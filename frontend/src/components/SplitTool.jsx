import React, { useState } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { ScissorsIcon, ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const SplitTool = () => {
    const [file, setFile] = useState(null);
    const [range, setRange] = useState('');
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [previews, setPreviews] = useState([]);
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [loadingPreviews, setLoadingPreviews] = useState(false);

    // Sync selectedPages Set to range string
    useEffect(() => {
        if (selectedPages.size > 0) {
            const sorted = Array.from(selectedPages).sort((a, b) => a - b);
            // Format as comma separated: "1, 2, 5"
            const rangeStr = sorted.map(i => i + 1).join(', ');
            setRange(rangeStr);
        } else if (previews.length > 0) {
            setRange('');
        }
    }, [selectedPages, previews.length]);

    const handleDrop = async (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            setOutputFilename(`split_${uploadedFile.name}`);
            setDownloadUrl(null);
            setLoadingPreviews(true);
            setPreviews([]);
            setSelectedPages(new Set());

            const formData = new FormData();
            formData.append('file', uploadedFile);

            try {
                const response = await axios.post(`${API_URL}/extract-pages`, formData);
                const imageUrls = response.data.pages.map(url => `http://localhost:8000${url}`);
                setPreviews(imageUrls);
            } catch (error) {
                console.error('Error extracting previews:', error);
            } finally {
                setLoadingPreviews(false);
            }
        }
    };

    const togglePage = (index) => {
        const next = new Set(selectedPages);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setSelectedPages(next);
    };

    const handleSplit = async () => {
        if (!file || !range) return;
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', range);

        try {
            const response = await axios.post(`${API_URL}/split-pdf`, formData, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error splitting PDF:', error);
            alert('Failed to split PDF. Please check page range.');
        } finally {
            setIsProcessing(false);
        }
    };

    const selectAll = () => {
        setSelectedPages(new Set(previews.keys()));
    };

    const clearSelection = () => {
        setSelectedPages(new Set());
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Split PDF</h2>
                <p className="text-gray-500">Extract specific pages visually or by range.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white">
                {!downloadUrl ? (
                    <div className="space-y-8">
                        {!file ? (
                            <Dropzone onDrop={handleDrop} multiple={false} accept={{ 'application/pdf': ['.pdf'] }} />
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 truncate max-w-xs sm:max-w-md">{file.name}</span>
                                        <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <button onClick={() => setFile(null)} className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                                        Change File
                                    </button>
                                </div>

                                {loadingPreviews ? (
                                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-navy"></div>
                                        <p className="text-gray-500 font-medium">Loading page previews...</p>
                                    </div>
                                ) : previews.length > 0 && (
                                    <div className="space-y-6 animate-in fade-in duration-500">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-bold text-gray-900">Click to Select Pages</h3>
                                            <div className="flex gap-4">
                                                <button onClick={selectAll} className="text-sm font-bold text-brand-navy hover:underline">Select All</button>
                                                <button onClick={clearSelection} className="text-sm font-bold text-gray-400 hover:text-gray-600 hover:underline">Clear</button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {previews.map((url, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => togglePage(index)}
                                                    className={clsx(
                                                        "relative cursor-pointer aspect-[3/4] rounded-xl border-2 transition-all p-1 bg-gray-50 group",
                                                        selectedPages.has(index)
                                                            ? "border-brand-red ring-4 ring-brand-red/10 scale-95"
                                                            : "border-transparent hover:border-gray-200"
                                                    )}
                                                >
                                                    <img src={url} alt={`Page ${index + 1}`} className="w-full h-full object-contain rounded-lg" />
                                                    <div className={clsx(
                                                        "absolute inset-0 bg-brand-red/20 opacity-0 transition-opacity rounded-lg flex items-center justify-center",
                                                        selectedPages.has(index) && "opacity-100"
                                                    )}>
                                                        <CheckCircleIcon className="h-8 w-8 text-white drop-shadow-md" />
                                                    </div>
                                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900/60 backdrop-blur-sm text-[10px] text-white font-bold rounded-full">
                                                        Page {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-6 bg-brand-navy/5 rounded-2xl border border-brand-navy/10 space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-brand-navy mb-2">
                                                    Selected Page Range
                                                </label>
                                                <input
                                                    type="text"
                                                    value={range}
                                                    onChange={(e) => setRange(e.target.value)}
                                                    placeholder="e.g. 1-5, 8, 11-13"
                                                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:ring-4 focus:ring-brand-navy/10 focus:border-brand-navy transition-all outline-none font-bold text-brand-navy"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    You can also manually edit the range above.
                                                </p>
                                            </div>

                                            <button
                                                onClick={handleSplit}
                                                disabled={!range || isProcessing}
                                                className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-navy/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isProcessing ? (
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                                ) : (
                                                    <>
                                                        <ScissorsIcon className="h-6 w-6" />
                                                        Split PDF
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-6 py-10">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <ScissorsIcon className="h-10 w-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">PDF Split Successfully!</h3>
                            <p className="text-gray-500 mt-2">Your selected pages have been extracted.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                            <a
                                href={downloadUrl}
                                download={outputFilename}
                                className="flex-1 px-8 py-3 bg-brand-navy text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 hover:bg-brand-navy/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                Download PDF
                            </a>
                            <button
                                onClick={() => { setFile(null); setDownloadUrl(null); setRange(''); setSelectedPages(new Set()); setPreviews([]); }}
                                className="flex-1 px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Split Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SplitTool;
