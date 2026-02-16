import React, { useState } from 'react';
import Dropzone from './Dropzone';
import axios from 'axios';
import { ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

const MergeTool = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('merged');

    const handleDrop = (acceptedFiles) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
        setDownloadUrl(null);
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleMerge = async () => {
        if (files.length < 2) return;
        setLoading(true);
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const response = await axios.post('http://localhost:8000/merge', formData, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);
        } catch (error) {
            console.error("Merge failed", error);
            alert("Merge failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Merge PDFs</h2>
                <p className="text-gray-500">Combine multiple PDF files into one document.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white">
                {!downloadUrl ? (
                    <div className="space-y-6">
                        <Dropzone onDrop={handleDrop} multiple={true} />

                        {files.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                                            <button onClick={() => removeFile(index)} className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleMerge}
                                    disabled={loading || files.length < 2}
                                    className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 transition-all active:scale-[0.98]"
                                >
                                    {loading ? 'Merging...' : 'Merge PDFs'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-6 py-10">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <ArrowDownTrayIcon className="h-10 w-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Your PDF is ready!</h3>
                            <p className="text-gray-500 mt-2">The merged file has been generated successfully.</p>
                        </div>
                        <div className="w-full max-w-md mx-auto">
                            <label className="block text-sm font-medium text-gray-600 mb-2 text-left">Output Filename</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={outputFilename}
                                    onChange={(e) => setOutputFilename(e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                />
                                <span className="text-gray-400 font-medium text-sm">.pdf</span>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={downloadUrl}
                                download={`${outputFilename || 'merged'}.pdf`}
                                className="px-8 py-3 bg-brand-navy text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 hover:bg-brand-navy/90 transition-colors"
                            >
                                Download Merged PDF
                            </a>
                            <button
                                onClick={() => { setFiles([]); setDownloadUrl(null); setOutputFilename('merged'); }}
                                className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
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

export default MergeTool;
