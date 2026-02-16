import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const Header = () => {
    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl flex items-baseline select-none font-sans">
                            <span className="logo-pdf tracking-tighter font-bold text-brand-navy">pdf</span>
                            <span className="logo-ji font-light text-brand-red">ji</span>
                        </h1>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
