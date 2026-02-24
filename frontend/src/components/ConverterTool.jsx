import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { ArrowDownTrayIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ConverterTool = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const [stats, setStats] = useState(null);
    const [outputFilename, setOutputFilename] = useState('');

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
        if (acceptedFiles?.length > 0) {
            const uploadedFile = acceptedFiles[0];
            setFile(uploadedFile);
            setDownloadUrl(null);
            setStats(null);
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

    const removeFile = () => {
        setFile(null);
        setDownloadUrl(null);
        setStats(null);
        setPreviewPages([]);
    };

    const handleConvert = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pages', pages);

        try {
            const response = await axios.post(`${API_URL}/convert-to-word`, formData, {
                responseType: 'blob',
            });

            const newSize = response.headers['content-length'] || response.data.size;
            setStats({
                size: (newSize / 1024 / 1024).toFixed(2),
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);
            setOutputFilename(`${file.name.replace(/\.pdf$/i, '')}`);
        } catch (error) {
            console.error("Conversion failed", error);
            alert("Conversion failed!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">PDF to Word</h2>
                <p className="text-gray-500">Convert your PDF documents to editable Word files.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white">
                {!downloadUrl ? (
                    <div className="space-y-6">
                        {!file ? (
                            <Dropzone onDrop={handleDrop} multiple={false} />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-brand-navy/10 rounded-lg flex items-center justify-center text-brand-navy font-bold text-xs uppercase">
                                            DOC
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={removeFile} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {isLoadingPreviews ? (
                                    <div className="py-8 flex flex-col items-center gap-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
                                        <p className="text-sm text-gray-500">Loading pages...</p>
                                    </div>
                                ) : previewPages.length > 0 && (
                                    <div className="space-y-3 animate-in fade-in duration-500">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Pages</h3>
                                            <div className="flex gap-3">
                                                <button onClick={selectAll} className="text-xs font-bold text-brand-navy hover:underline">All</button>
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
                                                            ? "border-brand-navy ring-2 ring-brand-navy/10 scale-95"
                                                            : "border-gray-200 hover:border-gray-300"
                                                    )}
                                                >
                                                    <img src={url} alt={`Page ${i + 1}`} className="w-full h-full object-contain bg-gray-50" />

                                                    <div className={clsx(
                                                        "absolute inset-0 bg-brand-navy/10 transition-opacity flex items-center justify-center",
                                                        selectedPages.has(i) ? "opacity-100" : "opacity-0 group-hover:opacity-10"
                                                    )}>
                                                        {selectedPages.has(i) && (
                                                            <CheckCircleIcon className="h-8 w-8 text-brand-navy bg-white rounded-full p-0.5 shadow-md" />
                                                        )}
                                                    </div>

                                                    <div className="absolute bottom-0 left-0 right-0 bg-gray-900/60 backdrop-blur-sm py-0.5 text-center">
                                                        <span className="text-[9px] font-bold text-white">Page {i + 1}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-center text-[10px] text-gray-400">
                                            {selectedPages.size} pages selected for conversion
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleConvert}
                                    disabled={loading || (previewPages.length > 0 && selectedPages.size === 0)}
                                    className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 transition-all active:scale-[0.98]"
                                >
                                    {loading ? 'Converting...' : 'Convert to Word'}
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
                            <h3 className="text-2xl font-bold text-gray-900">Conversion Complete!</h3>
                            <p className="text-gray-500 mt-2">Your document has been converted to Word.</p>
                            {stats && (
                                <div className="mt-4 inline-block px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-sm font-medium text-gray-600">New Size: </span>
                                    <span className="text-sm font-bold text-gray-900">{stats.size} MB</span>
                                </div>
                            )}
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
                                <span className="text-gray-400 font-medium text-sm">.docx</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a
                                href={downloadUrl}
                                download={`${outputFilename}.docx`}
                                className="w-full sm:w-auto px-8 py-3 bg-brand-navy text-white rounded-xl font-bold hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-navy/20"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                Download Word Doc
                            </a>
                            <button
                                onClick={removeFile}
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

export default ConverterTool;
