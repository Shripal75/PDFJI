import React, { useState, useCallback } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { ArrowDownTrayIcon, LanguageIcon, ArrowsRightLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
];

const TranslateTool = () => {
    const [file, setFile] = useState(null);
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('hi');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('translated');

    const handleDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setResults(null);
        }
    }, []);

    const swapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
    };

    const handleTranslate = async () => {
        if (!file) return;
        setLoading(true);
        setResults(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('source_lang', sourceLang);
            formData.append('target_lang', targetLang);

            const response = await axios.post(`${API_URL}/translate-pdf`, formData);
            setResults(response.data);
        } catch (error) {
            console.error('Translation failed:', error);
            alert('Translation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadAsText = () => {
        if (!results) return;
        const text = results.pages.map(p =>
            `--- Page ${p.page} ---\n${p.translated}`
        ).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${file.name.replace('.pdf', '')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadAsPdf = () => {
        if (!results) return;

        // Use browser's native print to generate PDF — ensures correct Hindi/complex script rendering
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to download PDF.');
            return;
        }

        const pagesHtml = results.pages.map(p => `
            <div style="page-break-after: always; padding: 20px 0;">
                <p style="color: #999; font-size: 11px; margin-bottom: 12px;">Page ${p.page}</p>
                <div style="font-size: 14px; line-height: 1.8; color: #222; white-space: pre-wrap; word-wrap: break-word;">${p.translated.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Translated - ${file.name}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500&display=swap');
                    body {
                        font-family: 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', sans-serif;
                        margin: 30px 40px;
                        color: #222;
                    }
                    @media print {
                        body { margin: 15px 20px; }
                    }
                </style>
            </head>
            <body>
                ${pagesHtml}
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const removeFile = () => {
        setFile(null);
        setResults(null);
    };

    const getLangName = (code) => LANGUAGES.find(l => l.code === code)?.name || code;

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Translate PDF</h2>
                <p className="text-gray-500 text-sm sm:text-base">Translate PDF content between languages using Google Translate.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-4 sm:p-8 border border-white">
                {!file ? (
                    <Dropzone onDrop={handleDrop} accept={{ 'application/pdf': ['.pdf'] }} />
                ) : !results ? (
                    <div className="space-y-6">
                        {/* File info */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="h-12 w-12 bg-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy font-bold text-xs">PDF</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button onClick={removeFile} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                        </div>

                        {/* Language selection */}
                        <div className="flex items-center gap-2 sm:gap-4 justify-center">
                            <div className="flex-1 max-w-[180px]">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">From</label>
                                <select
                                    value={sourceLang}
                                    onChange={(e) => setSourceLang(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
                                >
                                    {LANGUAGES.map(l => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={swapLanguages}
                                className="mt-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Swap languages"
                            >
                                <ArrowsRightLeftIcon className="h-5 w-5 text-gray-600" />
                            </button>

                            <div className="flex-1 max-w-[180px]">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">To</label>
                                <select
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
                                >
                                    {LANGUAGES.map(l => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Translate button */}
                        <button
                            onClick={handleTranslate}
                            disabled={loading}
                            className="w-full py-3 sm:py-4 bg-brand-navy hover:bg-brand-navy/90 disabled:bg-gray-300 text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Translating...</span>
                                </>
                            ) : (
                                <>
                                    <LanguageIcon className="h-5 w-5" />
                                    Translate {getLangName(sourceLang)} → {getLangName(targetLang)}
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Header with tabs */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <h3 className="text-lg font-bold text-gray-900">
                                {getLangName(sourceLang)} → {getLangName(targetLang)}
                            </h3>
                            <div className="flex bg-gray-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setActiveTab('translated')}
                                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${activeTab === 'translated' ? 'bg-white shadow text-brand-navy' : 'text-gray-500'}`}
                                >
                                    Translated
                                </button>
                                <button
                                    onClick={() => setActiveTab('original')}
                                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${activeTab === 'original' ? 'bg-white shadow text-brand-navy' : 'text-gray-500'}`}
                                >
                                    Original
                                </button>
                                <button
                                    onClick={() => setActiveTab('side-by-side')}
                                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${activeTab === 'side-by-side' ? 'bg-white shadow text-brand-navy' : 'text-gray-500'} hidden sm:block`}
                                >
                                    Side by Side
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden space-y-4 pr-1">
                            {results.pages.map((page, idx) => (
                                <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Page {page.page}</span>
                                    </div>
                                    <div className={`p-4 ${activeTab === 'side-by-side' ? 'grid grid-cols-2 gap-4' : ''}`}>
                                        {(activeTab === 'original' || activeTab === 'side-by-side') && (
                                            <div>
                                                {activeTab === 'side-by-side' && (
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{getLangName(sourceLang)}</p>
                                                )}
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words overflow-hidden">{page.original || '(No text)'}</p>
                                            </div>
                                        )}
                                        {(activeTab === 'translated' || activeTab === 'side-by-side') && (
                                            <div>
                                                {activeTab === 'side-by-side' && (
                                                    <p className="text-[10px] font-bold text-brand-navy uppercase mb-1">{getLangName(targetLang)}</p>
                                                )}
                                                <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed font-medium break-words overflow-hidden">{page.translated}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={downloadAsPdf}
                                className="w-full py-3 bg-brand-navy text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 hover:bg-brand-navy/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                Download as PDF
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={downloadAsText}
                                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <DocumentTextIcon className="h-4 w-4" />
                                    Download as Text
                                </button>
                                <button
                                    onClick={removeFile}
                                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Translate Another
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranslateTool;
