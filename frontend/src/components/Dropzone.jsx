import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Dropzone = ({ onDrop, accept = { 'application/pdf': ['.pdf'] }, multiple = false }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple,
    });

    return (
        <div
            {...getRootProps()}
            className={clsx(
                'border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 ease-in-out group',
                isDragActive
                    ? 'border-brand-navy dark:border-blue-400 bg-brand-navy/5 dark:bg-brand-navy/10 scale-[1.02]'
                    : 'border-gray-200 dark:border-slate-600 hover:border-brand-red dark:hover:border-brand-red hover:bg-gray-50 dark:hover:bg-slate-700/50'
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4">
                <div className={clsx(
                    "p-4 rounded-full transition-colors",
                    isDragActive ? "bg-brand-navy/10 dark:bg-brand-navy/20" : "bg-gray-100 dark:bg-slate-800 group-hover:bg-brand-red/5 dark:group-hover:bg-brand-red/10"
                )}>
                    <CloudArrowUpIcon className={clsx(
                        "h-10 w-10 transition-colors",
                        isDragActive ? "text-brand-navy dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-brand-red"
                    )} />
                </div>
                <div>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        or click to select files
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dropzone;
