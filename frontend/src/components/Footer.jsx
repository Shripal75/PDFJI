import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-8 sm:py-12 mt-auto overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-4 sm:gap-8 sm:flex-row sm:justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="PDFJI Logo" className="h-10 sm:h-12 w-auto object-contain" />
                        <span className="text-xl sm:text-2xl font-black text-brand-navy dark:text-white tracking-tight">PDF<span className="text-brand-red">JI</span></span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <a href="#" className="hover:text-brand-red dark:hover:text-brand-red transition-colors">Terms</a>
                        <a href="#" className="hover:text-brand-red dark:hover:text-brand-red transition-colors">Privacy</a>
                        <a href="#" className="hover:text-brand-red dark:hover:text-brand-red transition-colors">API Docs</a>
                    </div>
                </div>

                <div className="mt-6 pt-6 sm:mt-8 sm:pt-8 border-t border-gray-50 dark:border-slate-800 flex flex-col items-center gap-2 sm:gap-4 sm:flex-row sm:justify-between text-sm text-gray-400 dark:text-gray-500 text-center">
                    <p>© {new Date().getFullYear()} <span className="font-bold text-brand-navy dark:text-white">PDF</span><span className="font-bold text-brand-red">JI</span>. All rights reserved.</p>
                    <p className="flex flex-wrap justify-center items-center gap-1">
                        Making PDF management <span className="text-brand-red font-semibold">Fast</span> and <span className="text-brand-navy dark:text-blue-400 font-semibold">Easy</span>.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
