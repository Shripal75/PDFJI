import React, { useState } from 'react';
import Dropzone from './Dropzone';
import axios from 'axios';
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const WordToPdfTool = () => {
    const [file, setFile] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDrop = (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            const name = acceptedFiles[0].name.replace(/\.(docx?|doc)$/i, '');
            setOutputFilename(`${name}.pdf`);
            setDownloadUrl(null);
        }
    };

    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/word-to-pdf', formData, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting Word to PDF:', error);
            alert('Failed to convert Word to PDF. Make sure Microsoft Word is installed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Word to PDF</h2>
                <p className="text-gray-500">Convert Word documents (.docx) to PDF format.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white">
                {!downloadUrl ? (
                    <div className="space-y-6">
                        {!file ? (
                            <Dropzone
                                onDrop={handleDrop}
                                multiple={false}
                                accept={{
                                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                                    'application/msword': ['.doc'],
                                }}
                            />
                        ) : (
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-navy/10 rounded-lg">
                                        <DocumentTextIcon className="h-6 w-6 text-brand-navy" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700 block truncate max-w-md">{file.name}</span>
                                        <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                                <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:text-red-700 font-medium">
                                    Change File
                                </button>
                            </div>
                        )}

                        {file && (
                            <button
                                onClick={handleConvert}
                                disabled={isProcessing}
                                className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-navy/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <DocumentTextIcon className="h-6 w-6" />
                                        Convert to PDF
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-6 py-10">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <DocumentTextIcon className="h-10 w-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Converted Successfully!</h3>
                            <p className="text-gray-500 mt-2">Your Word document has been converted to PDF.</p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={downloadUrl}
                                download={outputFilename}
                                className="px-8 py-3 bg-brand-navy text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 hover:bg-brand-navy/90 transition-colors flex items-center gap-2"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                Download PDF
                            </a>
                            <button
                                onClick={() => { setFile(null); setDownloadUrl(null); }}
                                className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
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

export default WordToPdfTool;
