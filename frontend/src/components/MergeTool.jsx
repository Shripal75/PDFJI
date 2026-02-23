import React, { useState, useMemo } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { ArrowDownTrayIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

// Sortable file item component
const SortableFileItem = ({ item, index, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl border transition-all ${isDragging ? 'border-brand-navy/40 shadow-lg shadow-brand-navy/10 bg-white' : 'border-gray-100 hover:border-gray-200'
                }`}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors touch-none"
                    title="Drag to reorder"
                >
                    <Bars3Icon className="h-5 w-5" />
                </button>
                <span className="text-xs font-bold text-gray-400 w-5 text-center shrink-0">{index + 1}</span>
                <span className="text-sm font-medium text-gray-700 truncate">{item.file.name}</span>
            </div>
            <button
                onClick={() => onRemove(item.id)}
                className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors shrink-0"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

const MergeTool = () => {
    const [fileItems, setFileItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('merged');
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const activeItem = useMemo(
        () => fileItems.find((item) => item.id === activeId),
        [activeId, fileItems]
    );

    const handleDrop = (acceptedFiles) => {
        const newItems = acceptedFiles.map((file) => ({
            id: uuidv4(),
            file,
        }));
        setFileItems((prev) => [...prev, ...newItems]);
        setDownloadUrl(null);
    };

    const removeFile = (id) => {
        setFileItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setFileItems((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const handleMerge = async () => {
        if (fileItems.length < 2) return;
        setLoading(true);
        const formData = new FormData();
        fileItems.forEach((item) => {
            formData.append('files', item.file);
        });

        try {
            const response = await axios.post(`${API_URL}/merge`, formData, {
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
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Merge PDFs</h2>
                <p className="text-sm sm:text-base text-gray-500">Combine multiple PDF files into one document. Drag to reorder.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-4 sm:p-8 border border-white">
                {!downloadUrl ? (
                    <div className="space-y-6">
                        <Dropzone onDrop={handleDrop} multiple={true} />

                        {fileItems.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500 font-medium">
                                        {fileItems.length} file{fileItems.length !== 1 ? 's' : ''} selected — drag <Bars3Icon className="h-4 w-4 inline -mt-0.5" /> to reorder
                                    </p>
                                </div>

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={fileItems.map((item) => item.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="flex flex-col gap-2">
                                            {fileItems.map((item, index) => (
                                                <SortableFileItem
                                                    key={item.id}
                                                    item={item}
                                                    index={index}
                                                    onRemove={removeFile}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>

                                    <DragOverlay>
                                        {activeItem ? (
                                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-brand-navy shadow-xl">
                                                <Bars3Icon className="h-5 w-5 text-brand-navy" />
                                                <span className="text-sm font-medium text-gray-700">{activeItem.file.name}</span>
                                            </div>
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>

                                <button
                                    onClick={handleMerge}
                                    disabled={loading || fileItems.length < 2}
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
                                onClick={() => { setFileItems([]); setDownloadUrl(null); setOutputFilename('merged'); }}
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
