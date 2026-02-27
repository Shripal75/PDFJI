import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const CompressTool = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [quality, setQuality] = useState(50);
    const [stats, setStats] = useState(null);
    const [outputFilename, setOutputFilename] = useState('');
    const [estimate, setEstimate] = useState(null);
    const [estimating, setEstimating] = useState(false);
    const [compressionMode, setCompressionMode] = useState('quality'); // 'quality' or 'size'
    const [targetSize, setTargetSize] = useState('500');
    const [targetUnit, setTargetUnit] = useState('KB');
    const debounceRef = useRef(null);
    const abortRef = useRef(null);

    const getTargetBytes = useCallback(() => {
        const value = parseFloat(targetSize);
        if (isNaN(value)) return null;
        return targetUnit === 'MB' ? value * 1024 * 1024 : value * 1024;
    }, [targetSize, targetUnit]);

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        if (compressionMode === 'size' && targetUnit === 'KB') {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    // Debounced estimation
    useEffect(() => {
        if (!file) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (abortRef.current) abortRef.current.abort();

        setEstimating(true);

        debounceRef.current = setTimeout(async () => {
            const controller = new AbortController();
            abortRef.current = controller;

            const formData = new FormData();
            formData.append('file', file);

            if (compressionMode === 'quality') {
                formData.append('quality', quality);
            } else {
                const bytes = getTargetBytes();
                if (bytes) formData.append('target_size', Math.round(bytes));
            }

            try {
                const response = await axios.post(`${API_URL}/estimate-size`, formData, {
                    signal: controller.signal,
                });
                setEstimate({
                    originalSize: response.data.original_size,
                    compressedSize: response.data.compressed_size,
                    savedPercent: response.data.saved_percent,
                });
            } catch (err) {
                if (!axios.isCancel(err)) {
                    console.error('Estimation failed', err);
                }
            } finally {
                setEstimating(false);
            }
        }, 800);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [quality, file, compressionMode, targetSize, targetUnit, getTargetBytes]);

    const handleDrop = (acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            setFile(acceptedFiles[0]);
            setDownloadUrl(null);
            setStats(null);
            setEstimate(null);
        }
    };

    const removeFile = () => {
        setFile(null);
        setDownloadUrl(null);
        setStats(null);
        setEstimate(null);
    };

    const handleCompress = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        if (compressionMode === 'quality') {
            formData.append('quality', quality);
        } else {
            const bytes = getTargetBytes();
            if (bytes) formData.append('target_size', Math.round(bytes));
        }

        try {
            const response = await axios.post(`${API_URL}/compress`, formData, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);

            const originalName = file.name.replace(/\.pdf$/i, '');
            const newFilename = originalName.startsWith('compressed_')
                ? originalName
                : `compressed_${originalName}`;
            setOutputFilename(newFilename);

            const originalSize = file.size;
            const newSize = response.headers['content-length'] || response.data.size;
            const savedBytes = originalSize - newSize;
            const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

            setStats({
                originalSize: originalSize,
                newSize: newSize,
                savedPercent: savedPercent > 0 ? savedPercent : 0
            });
        } catch (error) {
            console.error("Compression failed", error);
            alert("Compression failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Compress PDF</h2>
                <p className="text-gray-500 dark:text-gray-400">Reduce the file size of your PDF while maintaining quality.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none p-4 sm:p-8 border border-white dark:border-slate-700">
                {!downloadUrl ? (
                    <div className="space-y-6">
                        {!file ? (
                            <Dropzone onDrop={handleDrop} multiple={false} />
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-brand-red/10 rounded-lg flex items-center justify-center text-brand-red font-bold text-xs uppercase">
                                            PDF
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-200 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button onClick={removeFile} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500 transition-colors">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-700 space-y-6">
                                    <div className="flex p-1 bg-gray-200/50 dark:bg-slate-800/50 rounded-xl mb-6">
                                        <button
                                            onClick={() => setCompressionMode('quality')}
                                            className={clsx(
                                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                                compressionMode === 'quality' ? "bg-white dark:bg-slate-700 text-brand-navy dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                            )}
                                        >
                                            Quality Mode
                                        </button>
                                        <button
                                            onClick={() => setCompressionMode('size')}
                                            className={clsx(
                                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                                compressionMode === 'size' ? "bg-white dark:bg-slate-700 text-brand-navy dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                            )}
                                        >
                                            Target Size
                                        </button>
                                    </div>

                                    {compressionMode === 'quality' ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Image Quality</label>
                                                <span className="px-3 py-1 bg-white dark:bg-slate-800 text-brand-navy dark:text-blue-400 font-bold rounded-lg border border-brand-navy/10 dark:border-slate-600 shadow-sm text-sm sm:text-base">
                                                    {quality}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={quality}
                                                onChange={(e) => setQuality(e.target.value)}
                                                className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-navy dark:accent-blue-500"
                                            />
                                            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 px-0.5">
                                                <span>Smallest</span>
                                                <span className="text-center">Balanced</span>
                                                <span className="text-right">Best Quality</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <label className="text-lg font-bold text-gray-900 dark:text-white">Set Maximum Size</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={targetSize}
                                                    onChange={(e) => setTargetSize(e.target.value)}
                                                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 focus:ring-4 focus:ring-brand-navy/10 focus:border-brand-navy transition-all outline-none font-bold text-brand-navy dark:text-blue-400"
                                                    placeholder="Enter size..."
                                                />
                                                <select
                                                    value={targetUnit}
                                                    onChange={(e) => setTargetUnit(e.target.value)}
                                                    className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 focus:ring-4 focus:ring-brand-navy/10 focus:border-brand-navy transition-all outline-none font-bold text-brand-navy dark:text-blue-400"
                                                >
                                                    <option>KB</option>
                                                    <option>MB</option>
                                                </select>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">The app will attempt to compress the file to be under this size.</p>
                                        </div>
                                    )}

                                    {/* Live Estimation Display */}
                                    <div className="mt-4 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm min-h-[64px] flex items-center justify-center">
                                        {estimating ? (
                                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                                <svg className="animate-spin h-5 w-5 text-brand-navy dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span className="text-sm font-medium">Estimating...</span>
                                            </div>
                                        ) : estimate ? (
                                            <div className="flex flex-wrap items-center justify-between w-full gap-2">
                                                <div className="flex items-center gap-3 sm:gap-6">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Original</p>
                                                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{formatSize(estimate.originalSize)}</p>
                                                    </div>
                                                    <div className="text-gray-300 dark:text-gray-600">→</div>
                                                    <div>
                                                        <p className="text-[10px] text-brand-red uppercase font-bold tracking-wider">Estimated</p>
                                                        <p className="text-xs sm:text-sm font-bold text-brand-red">~{formatSize(estimate.compressedSize)}</p>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-xs rounded-md border border-green-100 dark:border-green-800/30 shrink-0">
                                                    {estimate.savedPercent > 0 ? `-${estimate.savedPercent}%` : '0%'}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">Enter a target size to see estimation</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCompress}
                                    disabled={loading}
                                    className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white dark:disabled:text-gray-500 rounded-xl font-semibold shadow-lg shadow-brand-navy/20 dark:shadow-none transition-all active:scale-[0.98]"
                                >
                                    {loading ? 'Compressing...' : 'Compress PDF'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-5 sm:space-y-6 py-6 sm:py-10">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                            <ArrowDownTrayIcon className="h-8 w-8 sm:h-10 sm:w-10" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Compression Complete!</h3>
                            {stats && (
                                <div className="mt-2 text-center">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Your file is ready to download.</p>
                                    <div className="mt-4 inline-flex items-center gap-2 sm:gap-4 bg-green-50 dark:bg-green-900/20 px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-green-100 dark:border-green-800/30">
                                        <div className="text-center">
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Original</p>
                                            <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-200">{formatSize(stats.originalSize)}</p>
                                        </div>
                                        <div className="h-8 w-px bg-green-200 dark:bg-green-800/50"></div>
                                        <div className="text-center">
                                            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 uppercase font-bold">Compressed</p>
                                            <p className="text-sm sm:text-lg font-bold text-green-700 dark:text-green-400">{formatSize(stats.newSize)}</p>
                                        </div>
                                        <div className="h-8 w-px bg-green-200 dark:bg-green-800/50"></div>
                                        <div className="text-center">
                                            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 uppercase font-bold">Saved</p>
                                            <p className="text-sm sm:text-lg font-bold text-green-700 dark:text-green-400">{stats.savedPercent}%</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-full max-w-md mx-auto">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-left">Output Filename</label>
                            <div className="flex items-center gap-1 min-w-0">
                                <input
                                    type="text"
                                    value={outputFilename}
                                    onChange={(e) => setOutputFilename(e.target.value)}
                                    className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                />
                                <span className="text-gray-400 dark:text-gray-500 font-medium text-sm shrink-0">.pdf</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                            <a
                                href={downloadUrl}
                                download={`${outputFilename || 'compressed'}.pdf`}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-brand-navy text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 dark:shadow-none hover:bg-brand-navy/90 transition-colors text-center"
                            >
                                Download Compressed PDF
                            </a>
                            <button
                                onClick={removeFile}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompressTool;
