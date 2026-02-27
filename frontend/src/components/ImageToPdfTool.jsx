import React, { useState } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDownTrayIcon, TrashIcon, Bars3Icon, PhotoIcon } from '@heroicons/react/24/outline';

function SortableItem(props) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {props.children}
        </div>
    );
}

const ImageToPdfTool = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('converted_images');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDrop = (acceptedFiles) => {
        // Wrap files with unique ID for dnd
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file
        }));
        setFiles((prev) => [...prev, ...newFiles]);
        setDownloadUrl(null);
        setOutputFilename('converted_images');
    };

    const removeFile = (id) => {
        setFiles(files.filter((item) => item.id !== id));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        setLoading(true);
        const formData = new FormData();
        files.forEach((item) => {
            formData.append('files', item.file);
        });

        try {
            const response = await axios.post(`${API_URL}/img-to-pdf`, formData, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Image to PDF</h2>
                <p className="text-gray-500 dark:text-gray-400">Convert JPG, PNG images to PDF. Drag to reorder.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none p-8 border border-white dark:border-slate-700">
                {!downloadUrl ? (
                    <div className="space-y-6">
                        <Dropzone onDrop={handleDrop} multiple={true} accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }} />

                        {files.length > 0 && (
                            <div className="space-y-4">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <div className="flex flex-col gap-2">
                                        <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                            {files.map((item) => (
                                                <SortableItem key={item.id} id={item.id}>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-brand-red dark:hover:border-red-500 hover:bg-brand-red/5 dark:hover:bg-red-500/10 transition-colors group cursor-grab active:cursor-grabbing">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <Bars3Icon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-brand-red dark:group-hover:text-red-500" />
                                                            <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img src={URL.createObjectURL(item.file)} alt="preview" className="h-full w-full object-cover" />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{item.file.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </SortableItem>
                                            ))}
                                        </SortableContext>
                                    </div>
                                </DndContext>

                                <button
                                    onClick={handleConvert}
                                    disabled={loading || files.length === 0}
                                    className="w-full py-4 bg-brand-navy hover:bg-brand-navy/90 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white dark:disabled:text-gray-500 rounded-xl font-semibold shadow-lg shadow-brand-navy/20 dark:shadow-none transition-all active:scale-[0.98]"
                                >
                                    {loading ? 'Converting...' : 'Convert to PDF'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center space-y-6 py-10">
                        <div className="h-20 w-20 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                            <ArrowDownTrayIcon className="h-10 w-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your PDF is ready!</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">The images have been converted successfully.</p>
                        </div>
                        <div className="w-full max-w-md mx-auto">
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-left">Output Filename</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={outputFilename}
                                    onChange={(e) => setOutputFilename(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                />
                                <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">.pdf</span>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <a
                                href={downloadUrl}
                                download={`${outputFilename || 'converted_images'}.pdf`}
                                className="px-8 py-3 bg-brand-navy text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 dark:shadow-none hover:bg-brand-navy/90 transition-colors"
                            >
                                Download PDF
                            </a>
                            <button
                                onClick={() => { setFiles([]); setDownloadUrl(null); }}
                                className="px-8 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
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

export default ImageToPdfTool;
