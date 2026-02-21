/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileStack, 
  Image as ImageIcon, 
  FileText, 
  Minimize2, 
  ArrowLeftRight, 
  LayoutGrid,
  Github,
  Twitter,
  Mail,
  ChevronLeft,
  Scissors,
  Presentation,
  RotateCw,
  Lock,
  Unlock,
  Trash2,
  Type,
  FileDigit,
  Crop,
  PenTool,
  ShieldCheck,
  Languages,
  FileSearch,
  Wand2,
  Scan,
  Search,
  FileDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToolCard } from './components/ToolCard';
import { MergePDF } from './components/tools/MergePDF';
import { SplitPDF } from './components/tools/SplitPDF';
import { JpgToPdf } from './components/tools/JpgToPdf';
import { PdfToJpg } from './components/tools/PdfToJpg';
import { CompressImage } from './components/tools/CompressImage';
import { ImageConverter } from './components/tools/ImageConverter';
import { RotatePDF } from './components/tools/RotatePDF';
import { ProtectPDF } from './components/tools/ProtectPDF';
import { RemovePages } from './components/tools/RemovePages';
import { AddWatermark } from './components/tools/AddWatermark';
import { PptToPdf } from './components/tools/PptToPdf';
import { EditPDF } from './components/tools/EditPDF';
import { OCRTool } from './components/tools/OCRTool';
import { TranslatePDF } from './components/tools/TranslatePDF';
import { UnlockPDF } from './components/tools/UnlockPDF';
import { HtmlToPdf } from './components/tools/HtmlToPdf';
import { ScanToPDF } from './components/tools/ScanToPDF';
import { PdfToWord } from './components/tools/PdfToWord';
import { CropPDF } from './components/tools/CropPDF';
import { SignPDF } from './components/tools/SignPDF';
import { CompressPDF } from './components/tools/CompressPDF';

type ToolType = 
  | 'merge-pdf' 
  | 'split-pdf' 
  | 'jpg-to-pdf' 
  | 'pdf-to-jpg' 
  | 'compress-image' 
  | 'image-converter' 
  | 'ppt-to-pdf'
  | 'rotate-pdf'
  | 'protect-pdf'
  | 'unlock-pdf'
  | 'remove-pages'
  | 'add-watermark'
  | 'add-page-numbers'
  | 'crop-pdf'
  | 'edit-pdf'
  | 'sign-pdf'
  | 'translate-pdf'
  | 'ocr-pdf'
  | 'scan-to-pdf'
  | 'html-to-pdf'
  | 'pdf-to-word'
  | 'compress-pdf'
  | null;

export default function App() {
  const [activeTool, setActiveTool] = React.useState<ToolType>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMobileSearchVisible, setIsMobileSearchVisible] = React.useState(false);

  const toolCategories = [
    {
      name: 'Organize PDF',
      tools: [
        { id: 'merge-pdf', title: 'Merge PDF', description: 'Combine multiple PDFs into one.', icon: FileStack, color: 'bg-red-50 text-red-600' },
        { id: 'compress-pdf', title: 'Compress PDF', description: 'Reduce PDF size while keeping quality.', icon: FileDown, color: 'bg-emerald-50 text-emerald-600' },
        { id: 'split-pdf', title: 'Split PDF', description: 'Separate pages into independent files.', icon: Scissors, color: 'bg-rose-50 text-rose-600' },
        { id: 'remove-pages', title: 'Remove Pages', description: 'Delete pages from your PDF document.', icon: Trash2, color: 'bg-orange-50 text-orange-600' },
        { id: 'scan-to-pdf', title: 'Scan to PDF', description: 'Convert scans into PDF documents.', icon: Scan, color: 'bg-amber-50 text-amber-600' },
      ]
    },
    {
      name: 'Convert to PDF',
      tools: [
        { id: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Convert images to PDF with ease.', icon: ImageIcon, color: 'bg-blue-50 text-blue-600' },
        { id: 'ppt-to-pdf', title: 'PPT to PDF', description: 'Convert Powerpoint to PDF.', icon: Presentation, color: 'bg-indigo-50 text-indigo-600' },
        { id: 'html-to-pdf', title: 'HTML to PDF', description: 'Convert web pages to PDF.', icon: FileSearch, color: 'bg-cyan-50 text-cyan-600' },
      ]
    },
    {
      name: 'Convert from PDF',
      tools: [
        { id: 'pdf-to-jpg', title: 'PDF to JPG', description: 'Extract images or convert pages to JPG.', icon: FileText, color: 'bg-orange-50 text-orange-600' },
        { id: 'pdf-to-word', title: 'PDF to Word', description: 'Convert PDF to editable Word docs.', icon: FileText, color: 'bg-blue-50 text-blue-600' },
      ]
    },
    {
      name: 'Edit PDF',
      tools: [
        { id: 'rotate-pdf', title: 'Rotate PDF', description: 'Rotate your PDF pages as you want.', icon: RotateCw, color: 'bg-purple-50 text-purple-600' },
        { id: 'add-watermark', title: 'Add Watermark', description: 'Stamp text or images over your PDF.', icon: Type, color: 'bg-pink-50 text-pink-600' },
        { id: 'add-page-numbers', title: 'Page Numbers', description: 'Add page numbers to your PDF.', icon: FileDigit, color: 'bg-violet-50 text-violet-600' },
        { id: 'crop-pdf', title: 'Crop PDF', description: 'Trim the edges of your PDF pages.', icon: Crop, color: 'bg-fuchsia-50 text-fuchsia-600' },
        { id: 'edit-pdf', title: 'Edit PDF', description: 'Add text, shapes, and images to PDF.', icon: PenTool, color: 'bg-sky-50 text-sky-600' },
      ]
    },
    {
      name: 'PDF Security',
      tools: [
        { id: 'protect-pdf', title: 'Protect PDF', description: 'Encrypt your PDF with a password.', icon: Lock, color: 'bg-slate-50 text-slate-600' },
        { id: 'unlock-pdf', title: 'Unlock PDF', description: 'Remove password from your PDF.', icon: Unlock, color: 'bg-zinc-50 text-zinc-600' },
        { id: 'sign-pdf', title: 'Sign PDF', description: 'Sign yourself or request signatures.', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600' },
      ]
    },
    {
      name: 'PDF Intelligence',
      tools: [
        { id: 'translate-pdf', title: 'Translate PDF', description: 'Translate PDF documents instantly.', icon: Languages, color: 'bg-teal-50 text-teal-600' },
        { id: 'ocr-pdf', title: 'OCR PDF', description: 'Make scanned PDFs searchable.', icon: Wand2, color: 'bg-lime-50 text-lime-600' },
      ]
    }
  ];

  const renderTool = () => {
    switch (activeTool) {
      case 'merge-pdf': return <MergePDF />;
      case 'split-pdf': return <SplitPDF />;
      case 'jpg-to-pdf': return <JpgToPdf />;
      case 'pdf-to-jpg': return <PdfToJpg />;
      case 'compress-image': return <CompressImage />;
      case 'image-converter': return <ImageConverter />;
      case 'rotate-pdf': return <RotatePDF />;
      case 'protect-pdf': return <ProtectPDF />;
      case 'remove-pages': return <RemovePages />;
      case 'add-watermark': return <AddWatermark />;
      case 'ppt-to-pdf': return <PptToPdf />;
      case 'edit-pdf': return <EditPDF />;
      case 'ocr-pdf': return <OCRTool />;
      case 'translate-pdf': return <TranslatePDF />;
      case 'unlock-pdf': return <UnlockPDF />;
      case 'html-to-pdf': return <HtmlToPdf />;
      case 'scan-to-pdf': return <ScanToPDF />;
      case 'pdf-to-word': return <PdfToWord />;
      case 'crop-pdf': return <CropPDF />;
      case 'sign-pdf': return <SignPDF />;
      case 'compress-pdf': return <CompressPDF />;
      case 'protect-pdf': return <ProtectPDF />;
      case 'add-page-numbers':
        return (
          <div className="mx-auto max-w-2xl text-center py-12">
            <Wand2 className="h-16 w-16 text-indigo-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold text-neutral-900">Coming Soon</h2>
            <p className="mt-4 text-neutral-500">
              We are working hard to bring this feature to you. Some advanced PDF tools require server-side processing which is being optimized.
            </p>
            <button 
              onClick={() => setActiveTool(null)}
              className="mt-8 text-indigo-600 font-semibold hover:underline"
            >
              Try another tool
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                setActiveTool(null);
                setSearchQuery('');
                setIsMobileSearchVisible(false);
              }}
            >
              <div className="rounded-lg bg-indigo-600 p-2 text-white transition-transform group-hover:scale-110">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-neutral-900">PDFly</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Solutions</a>
              <a href="#" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Pricing</a>
              <a href="#" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">API</a>
            </nav>

            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-10 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
                className="sm:hidden rounded-full p-2 text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                {isMobileSearchVisible ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Search Bar */}
          <AnimatePresence>
            {isMobileSearchVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="sm:hidden overflow-hidden pb-4"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-10 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            {!activeTool ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-6xl">
                    Every tool you need to work with <br />
                    <span className="text-indigo-600">PDFs and Images</span>
                  </h1>
          
                </div>

                <div className="space-y-16">
                  {(() => {
                    const categoriesWithTools = toolCategories.map(category => ({
                      ...category,
                      filteredTools: category.tools.filter(tool => 
                        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    })).filter(cat => cat.filteredTools.length > 0);

                    if (categoriesWithTools.length === 0 && searchQuery) {
                      return (
                        <div className="text-center py-20 space-y-4">
                          <div className="inline-flex items-center justify-center p-6 bg-neutral-50 rounded-full text-neutral-300 mb-4">
                            <Search className="h-12 w-12" />
                          </div>
                          <h3 className="text-2xl font-bold text-neutral-900">No tools found</h3>
                          <p className="text-neutral-500">
                            We couldn't find any tools matching "{searchQuery}". <br />
                            Try a different keyword or browse the categories.
                          </p>
                          <button 
                            onClick={() => setSearchQuery('')}
                            className="mt-4 text-indigo-600 font-bold hover:underline"
                          >
                            Clear search
                          </button>
                        </div>
                      );
                    }

                    return categoriesWithTools.map((category) => (
                      <div key={category.name} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <h2 className="text-xl font-bold text-neutral-900 uppercase tracking-widest">{category.name}</h2>
                          <div className="h-px flex-grow bg-neutral-200" />
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                          {category.filteredTools.map((tool) => (
                            <ToolCard
                              key={tool.id}
                              {...tool}
                              onClick={() => {
                                setActiveTool(tool.id as ToolType);
                                setIsMobileSearchVisible(false);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tool"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button
                  onClick={() => {
                    setActiveTool(null);
                    setSearchQuery('');
                  }}
                  className="group flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to Tools
                </button>
                {renderTool()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-600 p-1.5 text-white">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold tracking-tight text-neutral-900">PDFly</span>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Making document and image management accessible to everyone, everywhere.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Desktop App</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="text-neutral-400 hover:text-neutral-900 transition-colors"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="text-neutral-400 hover:text-neutral-900 transition-colors"><Github className="h-5 w-5" /></a>
                <a href="#" className="text-neutral-400 hover:text-neutral-900 transition-colors"><Mail className="h-5 w-5" /></a>
              </div>
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-8 text-center text-sm text-neutral-400">
            © {new Date().getFullYear()} PDFly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
