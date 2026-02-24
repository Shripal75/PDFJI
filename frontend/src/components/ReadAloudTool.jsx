import React, { useState, useCallback, useRef, useEffect } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { PlayIcon, PauseIcon, StopIcon, SpeakerWaveIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const ReadAloudTool = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState('');
    const [pages, setPages] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [rate, setRate] = useState(1);
    const [voiceIndex, setVoiceIndex] = useState(0);
    const [voices, setVoices] = useState([]);
    const utteranceRef = useRef(null);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const available = speechSynthesis.getVoices();
            // Sort voices by language then name for easier selection
            const sortedVoices = [...available].sort((a, b) => {
                if (a.lang < b.lang) return -1;
                if (a.lang > b.lang) return 1;
                return a.name.localeCompare(b.name);
            });
            setVoices(sortedVoices);

            // Try to set initial voice to user's browser language if possible
            const userLang = navigator.language || navigator.userLanguage;
            if (userLang) {
                const defaultIndex = sortedVoices.findIndex(v => v.lang.startsWith(userLang.split('-')[0]));
                if (defaultIndex !== -1) setVoiceIndex(defaultIndex);
            }
        };

        loadVoices();
        speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            speechSynthesis.cancel();
        };
    }, []);

    const handleDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        const f = acceptedFiles[0];
        setFile(f);
        setLoading(true);
        setText('');
        setPages([]);

        try {
            const formData = new FormData();
            formData.append('file', f);

            const response = await axios.post(`${API_URL}/extract-text`, formData, {
                responseType: 'text'
            });

            const fullText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

            // Split into pages if there are page markers
            const pageSections = fullText.split(/--- Page \d+ ---/).filter(s => s.trim());
            if (pageSections.length > 1) {
                setPages(pageSections.map(s => s.trim()));
                setText(pageSections[0].trim());
            } else {
                setPages([fullText.trim()]);
                setText(fullText.trim());
            }
        } catch (error) {
            console.error('Text extraction failed:', error);
            alert('Failed to extract text from PDF.');
        } finally {
            setLoading(false);
        }
    }, []);

    const speak = (textToSpeak) => {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = rate;
        if (voices[voiceIndex]) {
            utterance.voice = voices[voiceIndex];
        }

        utterance.onend = () => {
            // Auto-advance to next page
            if (currentPage < pages.length - 1) {
                const nextPage = currentPage + 1;
                setCurrentPage(nextPage);
                setText(pages[nextPage]);
                speak(pages[nextPage]);
            } else {
                setIsPlaying(false);
                setIsPaused(false);
            }
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsPaused(false);
    };

    const handlePlay = () => {
        if (isPaused) {
            speechSynthesis.resume();
            setIsPaused(false);
        } else {
            speak(text);
        }
    };

    const handlePause = () => {
        speechSynthesis.pause();
        setIsPaused(true);
    };

    const handleStop = () => {
        speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
    };

    const goToPage = (idx) => {
        handleStop();
        setCurrentPage(idx);
        setText(pages[idx]);
    };

    const removeFile = () => {
        handleStop();
        setFile(null);
        setText('');
        setPages([]);
        setCurrentPage(0);
    };

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Read Aloud</h2>
                <p className="text-gray-500 text-sm sm:text-base">Listen to your PDF content read out loud.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-4 sm:p-8 border border-white">
                {!file ? (
                    <Dropzone onDrop={handleDrop} accept={{ 'application/pdf': ['.pdf'] }} />
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mb-4"></div>
                        <p className="text-gray-500">Extracting text from PDF...</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* File info */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="h-10 w-10 bg-brand-navy/10 rounded-lg flex items-center justify-center text-brand-navy font-bold text-xs">PDF</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate text-sm max-w-[200px] sm:max-w-md">{file.name}</p>
                                <p className="text-xs text-gray-500">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button onClick={removeFile} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                        </div>

                        {/* Player controls */}
                        <div className="bg-gradient-to-br from-brand-navy to-brand-navy/80 rounded-2xl p-4 sm:p-6 text-white">
                            {/* Playback buttons */}
                            <div className="flex items-center justify-center gap-4 mb-4">
                                {isPlaying && !isPaused ? (
                                    <button
                                        onClick={handlePause}
                                        className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                    >
                                        <PauseIcon className="h-7 w-7 text-white" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePlay}
                                        className="h-14 w-14 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors shadow-lg"
                                    >
                                        <PlayIcon className="h-7 w-7 text-brand-navy ml-0.5" />
                                    </button>
                                )}
                                <button
                                    onClick={handleStop}
                                    disabled={!isPlaying}
                                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-30"
                                >
                                    <StopIcon className="h-5 w-5 text-white" />
                                </button>
                            </div>

                            {/* Speed control */}
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <SpeakerWaveIcon className="h-4 w-4 text-white/60" />
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={rate}
                                    onChange={(e) => setRate(parseFloat(e.target.value))}
                                    className="w-32 sm:w-48 h-1.5 bg-white/20 rounded-full appearance-none accent-white"
                                />
                                <span className="text-xs font-mono text-white/80 w-8">{rate}x</span>
                            </div>

                            {/* Voice selector */}
                            {voices.length > 0 && (
                                <div className="flex justify-center">
                                    <select
                                        value={voiceIndex}
                                        onChange={(e) => setVoiceIndex(parseInt(e.target.value))}
                                        className="text-xs bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 max-w-[250px] outline-none"
                                    >
                                        {voices.map((v, i) => (
                                            <option key={i} value={i} className="text-gray-900">{v.name} ({v.lang})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Page navigation */}
                        {pages.length > 1 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {pages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => goToPage(idx)}
                                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${idx === currentPage
                                            ? 'bg-brand-navy text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Page {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Text display */}
                        <div className="bg-gray-50 rounded-xl p-4 max-h-[40vh] overflow-y-auto">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {text || '(No text found)'}
                            </p>
                        </div>

                        {/* Actions */}
                        <button
                            onClick={removeFile}
                            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Read Another PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReadAloudTool;
