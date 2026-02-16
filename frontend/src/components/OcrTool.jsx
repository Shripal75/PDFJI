import React, { useState, useEffect } from 'react';
import Dropzone from './Dropzone';
import axios from 'axios';
import { PencilSquareIcon, DocumentTextIcon, ClipboardDocumentIcon, CheckCircleIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const OcrTool = () => {
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

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
            setPages('');
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
            setExtractedText('');
            setPreviewPages([]);
            setSelectedPages(new Set());

            // If it's a PDF, fetch previews
            if (uploadedFile.type === 'application/pdf') {
                setIsLoadingPreviews(true);
                const formData = new FormData();
                formData.append('file', uploadedFile);
                try {
                    const res = await axios.post(`${API_URL}/extract-pages`, formData);
                    const { pages: pageUrls } = res.data;
                    setPreviewPages(pageUrls.map(url => `http://localhost:8000${url}`));

                    // Select all by default
                    const allIndices = new Set(pageUrls.map((_, i) => i));
                    setSelectedPages(allIndices);
                } catch (err) {
                    console.error('Error fetching previews:', err);
                } finally {
                    setIsLoadingPreviews(false);
                }
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

    const handleExtract = async () => {
        if (!file) return;
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', pages);

        try {
            const response = await axios.post(`${API_URL}/ocr-pdf`, formData, {
                responseType: 'json',
            });
            setExtractedText(response.data.text || 'No text detected.');
        } catch (error) {
            console.error('Error running OCR:', error);
            alert('Failed to extract handwritten text.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(extractedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([extractedText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const name = file?.name?.replace(/\.pdf$/i, '') || 'ocr_result';
        a.download = `${name}_ocr.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Handwriting to Text <span className="text-brand-red italic text-lg font-normal">(BETA)</span></h2>
                <p className="text-gray-500">Extract text from handwritten or scanned PDFs and images using OCR.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white">
                {!extractedText ? (
                    <div className="space-y-6">
                        {!file ? (
                            <Dropzone onDrop={handleDrop} multiple={false} accept={{
                                'application/pdf': ['.pdf'],
                                'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif', '.webp', '.gif'],
                            }} />
                        ) : (
                            <div className="space-y-4">
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-red/10 rounded-lg">
                                            <PencilSquareIcon className="h-6 w-6 text-brand-red" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700 block truncate max-w-md">{file.name}</span>
                                            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setPreviewPages([]); }} className="text-sm text-red-500 hover:text-red-700 font-medium">
                                        Change File
                                    </button>
                                </div>

                                {isLoadingPreviews ? (
                                    <div className="py-8 flex flex-col items-center gap-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
                                        <p className="text-sm text-gray-500">Loading pages...</p>
                                    </div>
                                ) : previewPages.length > 0 && (
                                    <div className="space-y-3 animate-in fade-in duration-500">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Pages to OCR</h3>
                                            <div className="flex gap-3">
                                                <button onClick={selectAll} className="text-xs font-bold text-brand-red hover:underline">All</button>
                                                <button onClick={deselectAll} className="text-xs font-bold text-gray-400 hover:text-gray-600 hover:underline">Clear</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50/50">
                                            {previewPages.map((url, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => togglePage(i)}
                                                    className={clsx(
                                                        "relative cursor-pointer group aspect-[2/3] bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all",
                                                        selectedPages.has(i)
                                                            ? "border-brand-red ring-2 ring-brand-red/10 scale-95"
                                                            : "border-gray-200 hover:border-gray-300"
                                                    )}
                                                >
                                                    <img src={url} alt={`Page ${i + 1}`} className="w-full h-full object-contain bg-gray-50" />

                                                    <div className={clsx(
                                                        "absolute inset-0 bg-brand-red/10 transition-opacity flex items-center justify-center",
                                                        selectedPages.has(i) ? "opacity-100" : "opacity-0 group-hover:opacity-10"
                                                    )}>
                                                        {selectedPages.has(i) && (
                                                            <CheckCircleIcon className="h-8 w-8 text-brand-red bg-white rounded-full p-0.5 shadow-md" />
                                                        )}
                                                    </div>

                                                    <div className="absolute bottom-0 left-0 right-0 bg-gray-900/60 backdrop-blur-sm py-0.5 text-center">
                                                        <span className="text-[9px] font-bold text-white">Page {i + 1}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-center text-[10px] text-gray-400">
                                            Processing fewer pages makes OCR much faster!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {file && (
                            <button
                                onClick={handleExtract}
                                disabled={isProcessing || (previewPages.length > 0 && selectedPages.size === 0)}
                                className="w-full py-4 bg-brand-red hover:bg-brand-red/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-red/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Recognizing Handwriting...
                                    </>
                                ) : (
                                    <>
                                        <PencilSquareIcon className="h-6 w-6" />
                                        Extract Text
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Extracted Text</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <ClipboardDocumentIcon className="h-4 w-4" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-4 py-2 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <DocumentTextIcon className="h-4 w-4" />
                                    Download .txt
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">{extractedText}</pre>
                        </div>

                        <button
                            onClick={() => { setFile(null); setExtractedText(''); }}
                            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Process Another Document
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OcrTool;
