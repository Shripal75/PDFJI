import React, { useState } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { PhotoIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ImageConvertTool = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [targetFormat, setTargetFormat] = useState('png');
    const [isProcessing, setIsProcessing] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('');

    const handleDrop = (acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            const f = acceptedFiles[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
            setDownloadUrl(null);

            // Detect current format and set default target to something different
            const ext = f.name.split('.').pop().toLowerCase();
            if (ext === 'png') setTargetFormat('jpg');
            else setTargetFormat('png');
        }
    };

    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_format', targetFormat);

        try {
            const response = await axios.post(`${API_URL}/convert-image`, formData, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);

            const name = file.name.replace(/\.[^.]+$/, '');
            const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
            setOutputFilename(`${name}.${ext}`);
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Failed to convert image.');
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setDownloadUrl(null);
        setOutputFilename('');
    };

    const formats = ['png', 'jpg', 'webp'];
    const currentExt = file?.name?.split('.').pop().toLowerCase();

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Convert Image</h2>
                <p className="text-gray-500 dark:text-gray-400">Convert images between PNG, JPG, and WEBP formats.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none p-8 border border-white dark:border-slate-700">
                {!downloadUrl ? (
                    <div className="space-y-8">
                        {!file ? (
                            <Dropzone
                                onDrop={handleDrop}
                                multiple={false}
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                            />
                        ) : (
                            <>
                                {/* File Info */}
                                <div className="p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 border border-gray-200 dark:border-slate-600">
                                            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700 dark:text-gray-200 block truncate max-w-[200px] sm:max-w-md">{file.name}</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">{(file.size / 1024).toFixed(1)} KB · {currentExt?.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <button onClick={reset} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
                                        Change File
                                    </button>
                                </div>

                                {/* Format Selection */}
                                <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Convert To</span>
                                    <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-slate-600">
                                        {formats.map((fmt) => (
                                            <button
                                                key={fmt}
                                                onClick={() => setTargetFormat(fmt)}
                                                disabled={currentExt === fmt || (currentExt === 'jpeg' && fmt === 'jpg')}
                                                className={clsx(
                                                    "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                                                    targetFormat === fmt
                                                        ? "bg-brand-navy text-white shadow-md"
                                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
                                                    (currentExt === fmt || (currentExt === 'jpeg' && fmt === 'jpg'))
                                                    && "opacity-30 cursor-not-allowed"
                                                )}
                                            >
                                                {fmt.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {currentExt?.toUpperCase()} → {targetFormat.toUpperCase()}
                                    </p>
                                </div>

                                {/* Convert Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={handleConvert}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white dark:disabled:text-gray-500 rounded-xl font-bold text-lg shadow-lg shadow-brand-navy/20 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Converting...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowPathIcon className="h-6 w-6" />
                                                Convert to {targetFormat.toUpperCase()}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-8 py-10">
                        <div className="relative inline-block">
                            <div className="h-24 w-24 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                                <PhotoIcon className="h-12 w-12" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg">
                                <div className="bg-green-500 rounded-full p-1">
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">Converted!</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Your image has been converted to {targetFormat.toUpperCase()}.</p>
                        </div>
                        <div className="w-full max-w-md mx-auto">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-left">Output Filename</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={outputFilename.replace(/\.[^.]+$/, '')}
                                    onChange={(e) => {
                                        const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
                                        setOutputFilename(e.target.value + '.' + ext);
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                />
                                <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">.{targetFormat === 'jpeg' ? 'jpg' : targetFormat}</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a
                                href={downloadUrl}
                                download={outputFilename}
                                className="w-full sm:w-auto px-10 py-4 bg-brand-navy text-white rounded-xl font-bold shadow-xl shadow-brand-navy/20 dark:shadow-none hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-0"
                            >
                                <ArrowDownTrayIcon className="h-6 w-6" />
                                Download {targetFormat.toUpperCase()} Image
                            </a>
                            <button
                                onClick={reset}
                                className="w-full sm:w-auto px-10 py-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300 dark:hover:border-slate-500 transition-all"
                            >
                                Convert Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageConvertTool;
