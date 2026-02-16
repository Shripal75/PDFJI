import React, { useState, useEffect } from 'react';
import Dropzone from './Dropzone';
import axios from 'axios';
import { PhotoIcon, ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const PdfToImageTool = () => {
    const [file, setFile] = useState(null);
    const [format, setFormat] = useState('png');
    const [previewPages, setPreviewPages] = useState([]);
    const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [pages, setPages] = useState('');
    const [outputFilename, setOutputFilename] = useState('');

    // Effect: Update pages string when selection changes
    useEffect(() => {
        if (selectedPages.size === 0 && previewPages.length > 0) {
            // If nothing selected (and not just init), maybe imply all? 
            // Or just empty string which backend interprets as ALL.
            // But visually, it's better if "All" are selected by default.
            setPages('');
        } else if (selectedPages.size === previewPages.length) {
            setPages(''); // All selected = empty string
        } else {
            // Convert set to sorted array
            const sorted = Array.from(selectedPages).map(i => i + 1).sort((a, b) => a - b);
            // Simple comma separation for now (backend handles ranges but this is easier to generate)
            // For a better UX we could generate ranges e.g. "1-3, 5"
            // Let's do a simple range generator
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
            setOutputFilename(`${name}_images.zip`);
            setDownloadUrl(null);
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
        formData.append('format', format);
        formData.append('pages', pages); // This string is now driven by visual selection

        try {
            const response = await axios.post(`${API_URL}/pdf-to-images`, formData, {
                responseType: 'blob',
            });
            const contentType = response.headers['content-type'] || '';
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);

            const name = file.name.replace(/\.pdf$/i, '');
            if (contentType.includes('image/')) {
                // Single image returned directly
                const ext = format === 'jpg' ? 'jpg' : 'png';
                setOutputFilename(`${name}.${ext}`);
            } else {
                // ZIP of multiple images
                setOutputFilename(`${name}_images.zip`);
            }
        } catch (error) {
            console.error('Error converting PDF to images:', error);
            alert('Failed to convert PDF to images.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">PDF to Image</h2>
                <p className="text-gray-500">Convert each page of your PDF into a high-quality image.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white">
                {!downloadUrl ? (
                    <div className="space-y-8">
                        {!file ? (
                            <Dropzone onDrop={handleDrop} multiple={false} accept={{ 'application/pdf': ['.pdf'] }} />
                        ) : (
                            <>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-navy/10 rounded-lg">
                                            <PhotoIcon className="h-6 w-6 text-brand-navy" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700 block truncate max-w-md">{file.name}</span>
                                            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                    <button onClick={() => { setFile(null); setPreviewPages([]); }} className="text-sm text-red-500 hover:text-red-700 font-mediumTransition">
                                        Change File
                                    </button>
                                </div>

                                {isLoadingPreviews ? (
                                    <div className="py-12 flex flex-col items-center gap-4">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-navy"></div>
                                        <p className="text-sm text-gray-500">Extracting page previews...</p>
                                    </div>
                                ) : previewPages.length > 0 && (
                                    <div className="space-y-4 animate-in fade-in duration-500">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Select Pages</h3>
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
                                        <p className="text-center text-xs text-gray-400">
                                            {selectedPages.size} pages selected
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    {/* Format Selection */}
                                    <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Output Format</span>
                                        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                                            <button
                                                onClick={() => setFormat('png')}
                                                className={`px - 6 py - 2 rounded - lg text - sm font - bold transition - all ${format === 'png'
                                                    ? 'bg-brand-navy text-white shadow-md'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    } `}
                                            >
                                                PNG
                                            </button>
                                            <button
                                                onClick={() => setFormat('jpg')}
                                                className={`px - 6 py - 2 rounded - lg text - sm font - bold transition - all ${format === 'jpg'
                                                    ? 'bg-brand-navy text-white shadow-md'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    } `}
                                            >
                                                JPG
                                            </button>
                                        </div>
                                    </div>

                                    {/* Page Range Input */}
                                    <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Selected Range</label>
                                        <div className="w-full relative">
                                            <input
                                                type="text"
                                                value={pages}
                                                onChange={(e) => setPages(e.target.value)}
                                                placeholder="All pages"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-4 focus:ring-brand-navy/10 focus:border-brand-navy transition-all font-medium placeholder:text-gray-400"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400">
                                            Select pages above or type range (e.g. 1-3, 5)
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConvert}
                                    disabled={isProcessing || (previewPages.length > 0 && selectedPages.size === 0)}
                                    className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl font-bold text-lg shadow-xl shadow-brand-navy/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            <PhotoIcon className="h-6 w-6" />
                                            Convert to {format.toUpperCase()}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-8 py-10">
                        <div className="relative inline-block">
                            <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce-short">
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
                            <h3 className="text-3xl font-extrabold text-gray-900">Converted!</h3>
                            <p className="text-gray-500 mt-2 text-lg">Your pages have been converted to high-quality {format.toUpperCase()} images.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a
                                href={downloadUrl}
                                download={outputFilename}
                                className="w-full sm:w-auto px-10 py-4 bg-brand-navy text-white rounded-xl font-bold shadow-xl shadow-brand-navy/20 hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-0"
                            >
                                <ArrowDownTrayIcon className="h-6 w-6" />
                                Download {outputFilename.endsWith('.zip') ? 'ZIP Archive' : `${format.toUpperCase()} Image`}
                            </a>
                            <button
                                onClick={() => { setFile(null); setDownloadUrl(null); setPreviewPages([]); }}
                                className="w-full sm:w-auto px-10 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
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

export default PdfToImageTool;
