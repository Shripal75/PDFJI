import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { DocumentTextIcon, ArrowDownTrayIcon, CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const PdfToWordTool = () => {
    const [file, setFile] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Page Selection State
    const [previewPages, setPreviewPages] = useState([]);
    const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [pages, setPages] = useState('');

    // Effect: Update pages string when selection changes
    useEffect(() => {
        if (selectedPages.size === 0 && previewPages.length > 0) {
            setPages('');
        } else if (selectedPages.size === previewPages.length) {
            setPages(''); // All selected
        } else {
            const sorted = Array.from(selectedPages).map(i => i + 1).sort((a, b) => a - b);
            let result = [];
            let start = sorted[0];
            let prev = start;

            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === prev + 1) {
                    prev = sorted[i];
                } else {
                    if (start === prev) {
                        result.push(String(start));
                    } else {
                        result.push(`${start}-${prev}`);
                    }
                    start = sorted[i];
                    prev = start;
                }
            }
            if (sorted.length > 0) {
                if (start === prev) {
                    result.push(String(start));
                } else {
                    result.push(`${start}-${prev}`);
                }
            }
            setPages(result.join(', '));
        }
    }, [selectedPages, previewPages.length]);

    const handleDrop = async (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            const name = uploadedFile.name.replace(/\.pdf$/i, '');
            setOutputFilename(`${name}.docx`);
            setDownloadUrl(null);

            // Reset Selection
            setPages('');
            setPreviewPages([]);
            setSelectedPages(new Set());

            // Fetch previews
            setIsLoadingPreviews(true);
            const formData = new FormData();
            formData.append('file', uploadedFile);
            try {
                const res = await axios.post(`${API_URL}/extract-pages`, formData);
                const { pages: pageUrls } = res.data;
                setPreviewPages(pageUrls.map(url => `${API_URL}${url}`));

                // Select all by default
                const allIndices = new Set(pageUrls.map((_, i) => i));
                setSelectedPages(allIndices);
            } catch (err) {
                console.error('Error fetching previews:', err);
            } finally {
                setIsLoadingPreviews(false);
            }
        }
    };

    const togglePage = (index) => {
        const newSelected = new Set(selectedPages);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedPages(newSelected);
    };

    const selectAll = () => {
        const all = new Set(previewPages.map((_, i) => i));
        setSelectedPages(all);
    };

    const deselectAll = () => {
        setSelectedPages(new Set());
    };

    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', pages);

        try {
            const response = await axios.post(`${API_URL}/pdf-to-word`, formData, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);
        } catch (error) {
            console.error('Error converting PDF to Word:', error);
            alert('Failed to convert PDF to Word.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">PDF to Word</h2>
                <p className="text-gray-500">Convert PDF documents (or specific pages) to editable Word (.docx) format.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white">
                {!downloadUrl ? (
                    <div className="space-y-8">
                        {!file ? (
                            <Dropzone
                                onDrop={handleDrop}
                                multiple={false}
                                accept={{ 'application/pdf': ['.pdf'] }}
                            />
                        ) : (
                            <>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-navy/10 rounded-lg">
                                            <DocumentTextIcon className="h-6 w-6 text-brand-navy" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700 block truncate max-w-[200px] sm:max-w-md">{file.name}</span>
                                            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setPreviewPages([]); }} className="text-sm text-red-500 hover:text-red-700 font-medium">
                                        Change File
                                    </button>
                                </div>

                                {/* Visual Page Selection */}
                                {isLoadingPreviews ? (
                                    <div className="py-12 flex flex-col items-center gap-4">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-navy"></div>
                                        <p className="text-sm text-gray-500">Loading page previews...</p>
                                    </div>
                                ) : previewPages.length > 0 && (
                                    <div className="space-y-4 animate-in fade-in duration-500">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Select Pages to Convert</h3>
                                            <div className="flex gap-4">
                                                <button onClick={selectAll} className="text-sm font-bold text-brand-navy hover:underline">Select All</button>
                                                <button onClick={deselectAll} className="text-sm font-bold text-gray-400 hover:text-gray-600 hover:underline">Clear</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto p-2 border border-gray-100 rounded-2xl bg-gray-50/50">
                                            {previewPages.map((url, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => togglePage(i)}
                                                    className={clsx(
                                                        "relative cursor-pointer group aspect-[2/3] bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all",
                                                        selectedPages.has(i)
                                                            ? "border-brand-navy ring-4 ring-brand-navy/10 scale-95"
                                                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                                    )}
                                                >
                                                    <img src={url} alt={`Page ${i + 1}`} className="w-full h-full object-contain bg-gray-50" />

                                                    {/* Selection Overlay */}
                                                    <div className={clsx(
                                                        "absolute inset-0 bg-brand-navy/10 transition-opacity flex items-center justify-center",
                                                        selectedPages.has(i) ? "opacity-100" : "opacity-0 group-hover:opacity-10"
                                                    )}>
                                                        {selectedPages.has(i) && (
                                                            <CheckCircleIcon className="h-10 w-10 text-brand-navy bg-white rounded-full p-1 shadow-lg" />
                                                        )}
                                                    </div>

                                                    <div className="absolute bottom-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm p-1 text-center">
                                                        <span className="text-[10px] font-bold text-white">Page {i + 1}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Range Input */}
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Selected Range:</span>
                                                <input
                                                    type="text"
                                                    value={pages}
                                                    onChange={(e) => setPages(e.target.value)}
                                                    placeholder="All pages (or type 1-3, 5)"
                                                    className="flex-grow px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleConvert}
                                    disabled={isProcessing || (previewPages.length > 0 && selectedPages.size === 0)}
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
                                            Convert to Word
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-6 py-10">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <DocumentTextIcon className="h-10 w-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Converted Successfully!</h3>
                            <p className="text-gray-500 mt-2">Your PDF has been converted to Word.</p>
                        </div>
                        <div className="w-full max-w-md mx-auto">
                            <label className="block text-sm font-medium text-gray-600 mb-2 text-left">Output Filename</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={outputFilename.replace(/\.docx$/i, '')}
                                    onChange={(e) => setOutputFilename(e.target.value)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                />
                                <span className="text-gray-400 font-medium text-sm">.docx</span>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={downloadUrl}
                                download={`${outputFilename.replace(/\.docx$/i, '') || 'converted'}.docx`}
                                className="px-8 py-3 bg-brand-navy text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 hover:bg-brand-navy/90 transition-colors flex items-center gap-2"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                Download Word Doc
                            </a>
                            <button
                                onClick={() => { setFile(null); setDownloadUrl(null); setPreviewPages([]); }}
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

export default PdfToWordTool;
