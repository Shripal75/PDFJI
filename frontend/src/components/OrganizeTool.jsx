import React, { useState } from 'react';
import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDownTrayIcon, TrashIcon, DocumentIcon, PlusIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

function SortablePage({ id, url, index, rotation, isSelected, selectionMode, reorderMode, reorderNumber, onRemove, onRotate, onToggleSelect, onReorderTap }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleClick = (e) => {
        if (reorderMode) {
            e.stopPropagation();
            e.preventDefault();
            onReorderTap(id);
        } else if (selectionMode) {
            e.stopPropagation();
            e.preventDefault();
            onToggleSelect(id);
        }
    };

    const disableDrag = selectionMode || reorderMode;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(disableDrag ? {} : listeners)}
            onClick={handleClick}
            className={clsx(
                "relative group aspect-[2/3] bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all",
                isDragging && "opacity-50 z-50 ring-2 ring-brand-navy",
                (selectionMode || reorderMode) && "cursor-pointer",
                reorderMode && reorderNumber > 0 ? "border-green-500 ring-2 ring-green-500/20" :
                    isSelected ? "border-brand-navy ring-2 ring-brand-navy/20" : "border-gray-200 hover:shadow-md"
            )}
        >
            <div className="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden relative">
                <img
                    src={url}
                    alt={`Page ${index + 1}`}
                    className="max-w-full max-h-full object-contain transition-transform duration-300"
                    style={{ transform: `rotate(${rotation}deg)` }}
                />

                {/* Reorder number overlay */}
                {reorderMode && reorderNumber > 0 && (
                    <div className="absolute inset-0 bg-green-500/15 flex items-center justify-center">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-500 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg">
                            {reorderNumber}
                        </div>
                    </div>
                )}

                {/* Selection overlay */}
                {selectionMode && !reorderMode && isSelected && (
                    <div className="absolute inset-0 bg-brand-navy/10 flex items-center justify-center">
                        <CheckCircleIcon className="h-8 w-8 text-brand-navy bg-white rounded-full p-0.5 shadow-md" />
                    </div>
                )}
            </div>

            {/* Hover actions (only when NOT in any mode) */}
            {!selectionMode && !reorderMode && (
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm"
                        title="Remove Page"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRotate(id); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 shadow-sm"
                        title="Rotate 90°"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm p-1.5 text-center">
                <span className="text-xs font-medium text-white">Page {index + 1}</span>
            </div>
        </div>
    );
}

const OrganizeTool = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [outputFilename, setOutputFilename] = useState('edited_document');
    const [activeId, setActiveId] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    // Reorder mode: tap pages in sequence
    const [reorderMode, setReorderMode] = useState(false);
    const [reorderSequence, setReorderSequence] = useState([]); // array of page ids in user-tapped order

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        setLoading(true);

        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post(`${API_URL}/extract-pages`, formData);
                const { file_id, pages: imageUrls } = response.data;

                const newPages = imageUrls.map((url, i) => ({
                    id: uuidv4(),
                    fileId: file_id,
                    pageIndex: i,
                    url: `${API_URL}${url}`,
                    rotation: 0
                }));

                setPages(prev => [...prev, ...newPages]);
            } catch (error) {
                console.error("Extraction failed", error);
                alert(`Failed to load PDF pages from ${file.name}.`);
            }
        }
        setDownloadUrl(null);
        setLoading(false);
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const handleRemovePage = (id) => {
        setPages(pages.filter(p => p.id !== id));
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        setReorderSequence(prev => prev.filter(rid => rid !== id));
    };

    const handleRotatePage = (id) => {
        setPages(pages.map(p =>
            p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
        ));
    };

    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Reorder mode: tap a page to add/remove from sequence
    const handleReorderTap = (id) => {
        setReorderSequence(prev => {
            const idx = prev.indexOf(id);
            if (idx !== -1) {
                // Remove and shift numbers
                return prev.filter(rid => rid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const applyReorder = () => {
        if (reorderSequence.length === 0) return;

        // Build new pages array: reordered pages first, then remaining pages in original order
        const reorderedPages = reorderSequence.map(id => pages.find(p => p.id === id)).filter(Boolean);
        const remainingPages = pages.filter(p => !reorderSequence.includes(p.id));
        setPages([...reorderedPages, ...remainingPages]);
        setReorderMode(false);
        setReorderSequence([]);
    };

    const selectAll = () => setSelectedIds(new Set(pages.map(p => p.id)));
    const deselectAll = () => setSelectedIds(new Set());

    const toggleSelectionMode = () => {
        if (selectionMode) {
            setSelectionMode(false);
            setSelectedIds(new Set());
        } else {
            setSelectionMode(true);
            setReorderMode(false);
            setReorderSequence([]);
        }
    };

    const toggleReorderMode = () => {
        if (reorderMode) {
            setReorderMode(false);
            setReorderSequence([]);
        } else {
            setReorderMode(true);
            setSelectionMode(false);
            setSelectedIds(new Set());
            setReorderSequence([]);
        }
    };

    const deleteSelected = () => {
        setPages(pages.filter(p => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
    };

    const rotateSelected = () => {
        setPages(pages.map(p =>
            selectedIds.has(p.id) ? { ...p, rotation: (p.rotation + 90) % 360 } : p
        ));
    };

    const handleSave = async (onlySelected = false) => {
        const pagesToSave = onlySelected
            ? pages.filter(p => selectedIds.has(p.id))
            : pages;

        if (pagesToSave.length === 0) return;
        setLoading(true);

        try {
            const payloadPages = pagesToSave.map(p => ({
                file_id: p.fileId,
                page_index: p.pageIndex,
                rotation: p.rotation
            }));

            const response = await axios.post(`${API_URL}/organize-pdf`, {
                pages: payloadPages
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setDownloadUrl(url);
        } catch (error) {
            console.error("Organize failed", error);
            alert("Failed to save PDF.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setPages([]);
        setDownloadUrl(null);
        setSelectedIds(new Set());
        setSelectionMode(false);
        setReorderMode(false);
        setReorderSequence([]);
    };

    // Get the reorder number for a page (1-based, 0 if not in sequence)
    const getReorderNumber = (id) => {
        const idx = reorderSequence.indexOf(id);
        return idx === -1 ? 0 : idx + 1;
    };

    return (
        <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">PDF Editor</h2>
                <p className="text-gray-500 text-sm sm:text-base">Merge, split, reorder, rotate & delete PDF pages.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-3 sm:p-8 border border-white min-h-[500px] flex flex-col">
                {pages.length === 0 ? (
                    loading ? (
                        <div className="flex flex-col items-center justify-center flex-grow">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mb-4"></div>
                            <p className="text-gray-500">Loading pages...</p>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col justify-center">
                            <Dropzone onDrop={handleDrop} multiple={true} accept={{ 'application/pdf': ['.pdf'] }} />
                            <p className="text-center text-gray-400 mt-4 text-sm">Drop one or multiple PDF files to start editing</p>
                        </div>
                    )
                ) : (
                    <>
                        {/* Toolbar */}
                        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <DocumentIcon className="h-5 w-5 text-brand-navy" />
                                    {pages.length} Pages
                                </h3>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <button
                                        onClick={toggleReorderMode}
                                        className={clsx(
                                            "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all",
                                            reorderMode
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {reorderMode ? '✕ Cancel' : '↕ Reorder'}
                                    </button>
                                    <button
                                        onClick={toggleSelectionMode}
                                        className={clsx(
                                            "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all",
                                            selectionMode
                                                ? "bg-brand-navy text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        {selectionMode ? 'Done' : 'Select'}
                                    </button>
                                    <label className="px-2.5 sm:px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-1.5">
                                        <PlusIcon className="h-4 w-4" />
                                        <span className="hidden sm:inline">Add PDF</span>
                                        <span className="sm:hidden">Add</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={(e) => handleDrop(Array.from(e.target.files))}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Reorder toolbar */}
                            {reorderMode && (
                                <div className="flex items-center justify-between bg-green-50 px-3 py-2.5 rounded-xl border border-green-200">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-green-800">
                                            Tap pages in order: <span className="font-bold">{reorderSequence.length}</span> / {pages.length} selected
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-green-600 mt-0.5">Tap pages in the order you want them. Tap again to remove.</p>
                                    </div>
                                    <button
                                        onClick={applyReorder}
                                        disabled={reorderSequence.length === 0}
                                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 ml-2"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}

                            {/* Selection toolbar */}
                            {selectionMode && (
                                <div className="flex items-center justify-between bg-brand-navy/5 px-3 py-2 rounded-xl animate-in fade-in duration-200">
                                    <span className="text-xs sm:text-sm font-medium text-brand-navy">
                                        {selectedIds.size} selected
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={selectAll} className="text-xs font-bold text-brand-navy hover:underline">All</button>
                                        <button onClick={deselectAll} className="text-xs font-bold text-gray-400 hover:text-gray-600 hover:underline">Clear</button>
                                        <div className="w-px h-4 bg-gray-300"></div>
                                        <button
                                            onClick={rotateSelected}
                                            disabled={selectedIds.size === 0}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 transition-colors"
                                            title="Rotate Selected"
                                        >
                                            <ArrowPathIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={deleteSelected}
                                            disabled={selectedIds.size === 0}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors"
                                            title="Delete Selected"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {loading && (
                            <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center rounded-3xl">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
                            </div>
                        )}

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            onDragStart={handleDragStart}
                        >
                            <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                    {pages.map((page, index) => (
                                        <SortablePage
                                            key={page.id}
                                            id={page.id}
                                            url={page.url}
                                            index={index}
                                            rotation={page.rotation}
                                            isSelected={selectedIds.has(page.id)}
                                            selectionMode={selectionMode}
                                            reorderMode={reorderMode}
                                            reorderNumber={getReorderNumber(page.id)}
                                            onRemove={handleRemovePage}
                                            onRotate={handleRotatePage}
                                            onToggleSelect={handleToggleSelect}
                                            onReorderTap={handleReorderTap}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                            <DragOverlay>
                                {activeId ? (
                                    <div className="aspect-[2/3] bg-white rounded-lg shadow-xl ring-2 ring-brand-navy overflow-hidden opacity-90">
                                        <img
                                            src={pages.find(p => p.id === activeId)?.url}
                                            className="w-full h-full object-contain"
                                            style={{ transform: `rotate(${pages.find(p => p.id === activeId)?.rotation}deg)` }}
                                        />
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>

                        {/* Bottom action bar */}
                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 space-y-3">
                            {selectionMode && selectedIds.size > 0 && (
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={loading}
                                    className="w-full py-3 sm:py-4 bg-brand-red hover:bg-brand-red/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-brand-red/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                    Save Selected ({selectedIds.size} pages)
                                </button>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={loading || pages.length === 0}
                                    className="flex-1 py-3 sm:py-4 bg-brand-navy hover:bg-brand-navy/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-brand-navy/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                            Save PDF
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={reset}
                                    className="px-4 sm:px-6 py-3 sm:py-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {downloadUrl && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 sm:space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <ArrowDownTrayIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">PDF Ready!</h3>
                                <p className="text-gray-500 mt-2 text-sm sm:text-base">Your edited PDF has been created successfully.</p>
                            </div>
                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-600 mb-2 text-left">Output Filename</label>
                                <div className="flex items-center gap-1 min-w-0">
                                    <input
                                        type="text"
                                        value={outputFilename}
                                        onChange={(e) => setOutputFilename(e.target.value)}
                                        className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                    />
                                    <span className="text-gray-400 font-medium text-sm shrink-0">.pdf</span>
                                </div>
                            </div>
                            <div className="grid gap-3">
                                <a
                                    href={downloadUrl}
                                    download={`${outputFilename || 'edited_document'}.pdf`}
                                    className="w-full py-3 bg-brand-navy text-white rounded-xl font-bold hover:bg-brand-navy/90 transition-colors shadow-lg shadow-brand-navy/20 text-center"
                                >
                                    Download PDF
                                </a>
                                <button
                                    onClick={() => setDownloadUrl(null)}
                                    className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium"
                                >
                                    Keep Editing
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizeTool;
