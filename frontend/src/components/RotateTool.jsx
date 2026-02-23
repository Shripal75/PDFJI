import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { ArrowPathIcon, ArrowDownTrayIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';

const RotateTool = () => {
    const [file, setFile] = useState(null);
    const [pages, setPages] = useState([]); // [{url, rotation}]
    const [sessionId, setSessionId] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);
        setOutputFilename(`rotated_${uploadedFile.name}`);
        setDownloadUrl(null);
        setIsLoading(true);

        // Upload to /extract-pages to get previews
        const formData = new FormData();
        formData.append('file', uploadedFile);
        try {
            const res = await axios.post(`${API_URL}/extract-pages`, formData);
            const { file_id, pages: pageUrls } = res.data;
            setSessionId(file_id);
            const pageList = pageUrls.map((url) => ({
                url: `${API_URL}${url}`,
                rotation: 0,
            }));
            setPages(pageList);
        } catch (err) {
            console.error('Error extracting pages:', err);
            alert('Failed to load PDF pages.');
        } finally {
            setIsLoading(false);
        }
    };

    const rotatePage = (index, angle) => {
        setPages(prev => prev.map((p, i) =>
            i === index ? { ...p, rotation: (p.rotation + angle + 360) % 360 } : p
        ));
    };

    const rotateAll = (angle) => {
        setPages(prev => prev.map(p => ({ ...p, rotation: (p.rotation + angle + 360) % 360 })));
    };

    const handleSave = async () => {
        if (!file) return;
        setIsProcessing(true);

        // Build rotations dict: only include pages that were actually rotated
        const rotations = {};
        pages.forEach((p, i) => {
            if (p.rotation !== 0) {
                rotations[i] = p.rotation;
            }
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('rotations', JSON.stringify(rotations));

        try {
            const response = await axios.post(`${API_URL}/rotate-pdf`, formData, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error rotating PDF:', error);
            alert('Failed to rotate PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const hasRotations = pages.some(p => p.rotation !== 0);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Rotate PDF</h2>
                <p className="text-gray-500">Rotate individual pages of your PDF document.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white">
                {!downloadUrl ? (
                    <div className="space-y-6">
                        {!file ? (
                            <Dropzone onDrop={handleDrop} multiple={false} accept={{ 'application/pdf': ['.pdf'] }} />
                        ) : isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mb-4"></div>
                                <p className="text-gray-500">Loading page previews...</p>
                            </div>
                        ) : (
                            <>
                                {/* Toolbar */}
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700 truncate max-w-xs">{file.name}</span>
                                        <span className="text-sm text-gray-400">({pages.length} pages)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => rotateAll(-90)}
                                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <ArrowUturnLeftIcon className="h-4 w-4" /> Rotate All Left
                                        </button>
                                        <button
                                            onClick={() => rotateAll(90)}
                                            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <ArrowUturnRightIcon className="h-4 w-4" /> Rotate All Right
                                        </button>
                                        <button
                                            onClick={() => { setFile(null); setPages([]); }}
                                            className="text-sm text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Change File
                                        </button>
                                    </div>
                                </div>

                                {/* Page Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {pages.map((page, index) => (
                                        <div key={index} className="bg-gray-50 rounded-xl border border-gray-200 p-3 flex flex-col items-center gap-2 group hover:shadow-md transition-shadow">
                                            <div className="relative w-full aspect-[3/4] bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                                                <img
                                                    src={page.url}
                                                    alt={`Page ${index + 1}`}
                                                    className="max-w-full max-h-full object-contain transition-transform duration-300"
                                                    style={{ transform: `rotate(${page.rotation}deg)` }}
                                                />
                                                {page.rotation !== 0 && (
                                                    <div className="absolute top-1 right-1 bg-brand-navy text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                                        {page.rotation}°
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs font-medium text-gray-500">Page {index + 1}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => rotatePage(index, -90)}
                                                    className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-brand-red/5 hover:border-brand-red/30 transition-colors"
                                                    title="Rotate Left"
                                                >
                                                    <ArrowUturnLeftIcon className="h-4 w-4 text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={() => rotatePage(index, 90)}
                                                    className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-brand-red/5 hover:border-brand-red/30 transition-colors"
                                                    title="Rotate Right"
                                                >
                                                    <ArrowUturnRightIcon className="h-4 w-4 text-gray-600" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={!hasRotations || isProcessing}
                                    className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-navy/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowPathIcon className="h-6 w-6" />
                                            Save Rotated PDF
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-6 py-10">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <ArrowPathIcon className="h-10 w-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">PDF Rotated Successfully!</h3>
                            <p className="text-gray-500 mt-2">Your pages have been rotated individually.</p>
                        </div>
                        <div className="w-full max-w-md mx-auto">
                            <label className="block text-sm font-medium text-gray-600 mb-2 text-left">Output Filename</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={outputFilename.replace(/\.pdf$/i, '')}
                                    onChange={(e) => setOutputFilename(e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                />
                                <span className="text-gray-400 font-medium text-sm">.pdf</span>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={downloadUrl}
                                download={`${outputFilename.replace(/\.pdf$/i, '') || 'rotated'}.pdf`}
                                className="px-8 py-3 bg-brand-navy text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 hover:bg-brand-navy/90 transition-colors flex items-center gap-2"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                Download PDF
                            </a>
                            <button
                                onClick={() => { setFile(null); setPages([]); setDownloadUrl(null); }}
                                className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Rotate Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RotateTool;
