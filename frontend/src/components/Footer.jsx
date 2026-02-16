import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="PDFji Logo" className="h-12 w-auto opacity-80" />
                        <h1 className="text-2xl flex items-baseline select-none font-sans">
                            <span className="logo-pdf tracking-tighter font-bold text-brand-navy">pdf</span>
                            <span className="logo-ji font-light text-brand-red">ji</span>
                        </h1>
                    </div>

                    <div className="flex gap-8 text-sm font-medium text-gray-500">
                        <a href="#" className="hover:text-brand-red transition-colors">Terms</a>
                        <a href="#" className="hover:text-brand-red transition-colors">Privacy</a>
                        <a href="#" className="hover:text-brand-red transition-colors">API Docs</a>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
                    <p>© {new Date().getFullYear()} PDFJI. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Making PDF management <span className="text-brand-red font-semibold">Fast</span> and <span className="text-brand-navy font-semibold">Easy</span>.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
