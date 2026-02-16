import { API_URL } from '../config';
import Dropzone from './Dropzone';
import axios from 'axios';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDownTrayIcon, TrashIcon, Squares2X2Icon, DocumentIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Simple UUID generator to avoid dependency issues with running server
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

function SortablePage({ id, url, index, rotation, onRemove, onRotate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={clsx(
            "relative group aspect-[2/3] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all",
            isDragging && "opacity-50 z-50 ring-2 ring-brand-navy"
        )}>
            <div className="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden relative">
                <img
                    src={url}
                    alt={`Page ${index + 1}`}
                    className="max-w-full max-h-full object-contain transition-transform duration-300"
                    style={{ transform: `rotate(${rotation}deg)` }}
                />
            </div>

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

            <div className="absolute bottom-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm p-1.5 text-center">
                <span className="text-xs font-medium text-white">Page {index + 1}</span>
            </div>
        </div>
    );
}

const OrganizeTool = () => {
    // Pages: { id: unique_str, fileId: str, pageIndex: int, url: str, rotation: int }
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDrop = async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        setLoading(true);

        // Process files sequentially to maintain order
        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post(`${API_URL}/extract-pages`, formData);
                const { file_id, pages: imageUrls } = response.data;

                const newPages = imageUrls.map((url, i) => ({
                    id: uuidv4(), // Unique ID for frontend DnD
                    fileId: file_id,
                    pageIndex: i,
                    url: `http://localhost:8000${url}`,
                    rotation: 0
                }));

                setPages(prev => [...prev, ...newPages]);
            } catch (error) {
                console.error("Extraction failed", error);
                alert(`Failed to load PDF pages from ${file.name}.`);
            }
        }
        setDownloadUrl(null); // Reset download if adding more files
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
    };

    const handleRotatePage = (id) => {
        setPages(pages.map(p =>
            p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
        ));
    };

    const handleSave = async () => {
        if (pages.length === 0) return;
        setLoading(true);

        try {
            // Construct payload: [{ file_id, page_index, rotation }]
            const payloadPages = pages.map(p => ({
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
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">PDF Editor</h2>
                <p className="text-gray-500">Merge, Split, Rotate, and Organize your PDF pages.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-white min-h-[500px] flex flex-col">
                {pages.length === 0 ? (
                    loading ? (
                        <div className="flex flex-col items-center justify-center flex-grow">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mb-4"></div>
                            <p className="text-gray-500">Loading pages...</p>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col justify-center">
                            <Dropzone onDrop={handleDrop} multiple={true} accept={{ 'application/pdf': ['.pdf'] }} />
                            <p className="text-center text-gray-400 mt-4">Drop one or multiple PDF files to start editing</p>
                        </div>
                    )
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <DocumentIcon className="h-5 w-5 text-brand-navy" />
                                {pages.length} Pages
                            </h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Clear All
                                </button>
                                <label className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium cursor-pointer flex items-center gap-2">
                                    <PlusIcon className="h-4 w-4" />
                                    Add PDF
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={(e) => handleDrop(Array.from(e.target.files))}
                                    />
                                </label>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 transition-colors shadow-lg shadow-brand-navy/20 font-medium flex items-center gap-2"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    Save PDF
                                </button>
                            </div>
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
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {pages.map((page, index) => (
                                        <SortablePage
                                            key={page.id}
                                            id={page.id}
                                            url={page.url}
                                            index={index}
                                            rotation={page.rotation}
                                            onRemove={handleRemovePage}
                                            onRotate={handleRotatePage}
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
                    </>
                )}

                {downloadUrl && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <ArrowDownTrayIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">PDF Ready!</h3>
                                <p className="text-gray-500 mt-2">Your edited PDF has been created successfully.</p>
                            </div>
                            <div className="grid gap-3">
                                <a
                                    href={downloadUrl}
                                    download="edited_document.pdf"
                                    className="w-full py-3 bg-brand-navy text-white rounded-xl font-bold hover:bg-brand-navy/90 transition-colors shadow-lg shadow-brand-navy/20"
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
