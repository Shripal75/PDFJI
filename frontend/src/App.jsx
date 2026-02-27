import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MergeTool from './components/MergeTool';
import CompressTool from './components/CompressTool';
import ConverterTool from './components/ConverterTool';
import ImageToPdfTool from './components/ImageToPdfTool';
import OrganizeTool from './components/OrganizeTool';
import SplitTool from './components/SplitTool';
import RotateTool from './components/RotateTool';
import ExtractTool from './components/ExtractTool';
import WordToPdfTool from './components/WordToPdfTool';
import PdfToWordTool from './components/PdfToWordTool';
import PdfToImageTool from './components/PdfToImageTool';
import OcrTool from './components/OcrTool';
import ImageCompressTool from './components/ImageCompressTool';
import PdfToPptTool from './components/PdfToPptTool';
import PptToPdfTool from './components/PptToPdfTool';
import ImageConvertTool from './components/ImageConvertTool';
import TranslateTool from './components/TranslateTool';
import ReadAloudTool from './components/ReadAloudTool';
import {
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  PhotoIcon,
  PencilSquareIcon,
  ScissorsIcon,
  ArrowPathIcon,
  SparklesIcon,
  PresentationChartBarIcon,
  Squares2X2Icon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  SwatchIcon,
  LanguageIcon,
  SpeakerWaveIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Footer from './components/Footer';

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const tools = {
    'pdf-editor': { id: 'pdf-editor', name: 'PDF Editor', icon: PencilSquareIcon, description: 'Merge, split, reorder, rotate & delete pages.' },
    'merge': { id: 'merge', name: 'Merge PDF', icon: Squares2X2Icon, description: 'Combine multiple PDFs into one.' },
    'split': { id: 'split', name: 'Split PDF', icon: ScissorsIcon, description: 'Extract pages or split your document.' },
    'rotate': { id: 'rotate', name: 'Rotate', icon: ArrowPathIcon, description: 'Rotate PDF pages.' },
    'compress': { id: 'compress', name: 'Compress', icon: WrenchScrewdriverIcon, description: 'Reduce PDF file size.' },
    'pdf-to-img': { id: 'pdf-to-img', name: 'PDF to Image', icon: PhotoIcon, description: 'Convert PDF pages to images.' },
    'pdf-to-word': { id: 'pdf-to-word', name: 'PDF to Word', icon: DocumentTextIcon, description: 'Convert PDF to editable DOCX.' },
    'pdf-to-ppt': { id: 'pdf-to-ppt', name: 'PDF to PowerPoint', icon: PresentationChartBarIcon, description: 'Convert PDF slides to editable PPTX.' },
    'extract': { id: 'extract', name: 'Extract Text', icon: DocumentTextIcon, description: 'Extract raw text from PDF files.' },
    // 'ocr': { id: 'ocr', name: 'Handwriting OCR', icon: SparklesIcon, description: 'Extract text from scanned PDFs & images.', beta: true },
    'compress-image': { id: 'compress-image', name: 'Compress Image', icon: PhotoIcon, description: 'Compress images with smart quality estimation.' },
    'img-to-pdf': { id: 'img-to-pdf', name: 'Image to PDF', icon: PhotoIcon, description: 'Convert images to a single PDF file.' },
    'word-to-pdf': { id: 'word-to-pdf', name: 'Word to PDF', icon: DocumentTextIcon, description: 'Convert DOCX to PDF.' },
    'ppt-to-pdf': { id: 'ppt-to-pdf', name: 'PowerPoint to PDF', icon: PresentationChartBarIcon, description: 'Convert PowerPoint presentations to PDF.' },
    'convert-image': { id: 'convert-image', name: 'Convert Image', icon: ArrowPathIcon, description: 'Convert images between PNG, JPG, and WEBP.' },
    'translate': { id: 'translate', name: 'Translate PDF', icon: LanguageIcon, description: 'Translate PDF content between languages.' },
    'read-aloud': { id: 'read-aloud', name: 'Read Aloud', icon: SpeakerWaveIcon, description: 'Listen to your PDF read out loud.' },
  };

  const categories = [
    {
      title: 'PDF Editor',
      items: ['pdf-editor', 'merge', 'split', 'rotate', 'compress']
    },
    {
      title: 'PDF Convert',
      items: ['pdf-to-img', 'pdf-to-word', 'pdf-to-ppt']
    },
    {
      title: 'Text Convert',
      items: ['extract']
    },
    {
      title: 'Img Tool',
      items: ['compress-image', 'pdf-to-img', 'img-to-pdf', 'convert-image']
    },
    {
      title: 'Other Converts',
      items: ['word-to-pdf', 'ppt-to-pdf']
    },
    {
      title: 'PDF Utilities',
      items: ['translate', 'read-aloud']
    }
  ];

  const renderTool = () => {
    switch (activeTool) {
      case 'ocr': return <OcrTool />;
      case 'convert-image': return <ImageConvertTool />;
      case 'extract': return <ExtractTool />;
      case 'pdf-to-ppt': return <PdfToPptTool />;
      case 'ppt-to-pdf': return <PptToPdfTool />;
      case 'pdf-to-img': return <PdfToImageTool />;
      case 'pdf-editor': return <OrganizeTool />;
      case 'merge': return <MergeTool />;
      case 'split': return <SplitTool />;
      case 'rotate': return <RotateTool />;
      case 'compress': return <CompressTool />;
      case 'compress-image': return <ImageCompressTool />;
      case 'img-to-pdf': return <ImageToPdfTool />;
      case 'word-to-pdf': return <WordToPdfTool />;
      case 'pdf-to-word': return <PdfToWordTool />;
      case 'translate': return <TranslateTool />;
      case 'read-aloud': return <ReadAloudTool />;
      default: return (
        <div className="max-w-[1600px] mx-auto">
          <div className="py-12 mb-8 text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Welcome to <span className="text-brand-navy dark:text-blue-400">PDF</span><span className="text-brand-red">JI</span></h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              All your PDF and document conversion needs in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
            {Object.values(tools).map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={clsx(
                  "flex flex-col items-center p-6 rounded-2xl border transition-all duration-200 text-left group bg-white dark:bg-slate-800",
                  "border-gray-200 dark:border-slate-700 hover:border-brand-red dark:hover:border-brand-red hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-none"
                )}
              >
                <div className={clsx(
                  "p-3 rounded-xl mb-4 transition-colors",
                  "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 group-hover:bg-brand-red/10 dark:group-hover:bg-brand-red/20 group-hover:text-brand-red dark:group-hover:text-brand-red"
                )}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white text-center">
                  {tool.name}
                </h3>
                {tool.beta && (
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide mb-1">
                    BETA
                  </span>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{tool.description}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveTool(null)}
          >
            <img src="/logo.png" alt="PDFJI Logo" className="h-10 w-auto object-contain" />
            <span className="text-xl font-black text-brand-navy dark:text-white tracking-tight">PDF<span className="text-brand-red">JI</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
          <button
            onClick={() => { setActiveTool(null); setIsSidebarOpen(false); }}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold",
              activeTool === null
                ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20 dark:shadow-none"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            )}
          >
            <HomeIcon className="h-5 w-5" />
            Dashboard
          </button>

          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{category.title}</h3>
              <div className="space-y-1">
                {category.items.map((toolId) => {
                  const tool = tools[toolId];
                  if (!tool) return null;
                  return (
                    <button
                      key={toolId}
                      onClick={() => { setActiveTool(toolId); setIsSidebarOpen(false); }}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group",
                        activeTool === toolId
                          ? "bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange dark:text-orange-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                      )}
                    >
                      <tool.icon className={clsx(
                        "h-5 w-5 transition-colors",
                        activeTool === toolId ? "text-brand-orange" : "text-gray-400 group-hover:text-gray-500"
                      )} />
                      <span className="flex-1 text-left">
                        {tool.name === 'Handwriting OCR' ? (
                          <>Handwriting<br />OCR</>
                        ) : tool.name}
                      </span>
                      {tool.beta && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                          BETA
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
          <div className="text-xs text-center text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} PDFJI. All rights reserved.
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="font-bold text-gray-900 dark:text-white truncate">
            {activeTool ? tools[activeTool]?.name : 'Dashboard'}
          </span>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900">
          <div className="flex flex-col min-h-full">
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              <div className="max-w-[1600px] mx-auto h-full">
                {renderTool()}
              </div>
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center p-8 text-center bg-gray-50">
          <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <pre className="bg-red-50 p-4 rounded text-left text-sm text-red-800 overflow-auto max-w-full max-h-60 mb-6">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-brand-navy text-white rounded-xl font-bold hover:bg-opacity-90 transition-opacity"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
