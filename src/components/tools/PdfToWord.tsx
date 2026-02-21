import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { FileUploader, FileList } from '../FileUploader';
import { Loader2, ArrowRight, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const PdfToWord: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setStatus('idle');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      const docSections: any[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group text items by their vertical position (y-coordinate) to maintain some structure
        const items = textContent.items as any[];
        const lines: { [key: number]: string[] } = {};
        
        items.forEach((item) => {
          const y = Math.round(item.transform[5]);
          if (!lines[y]) lines[y] = [];
          lines[y].push(item.str);
        });

        // Sort lines by y-coordinate (descending)
        const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
        
        const pageParagraphs = sortedY.map(y => {
          return new Paragraph({
            children: [
              new TextRun({
                text: lines[y].join(' '),
                size: 24, // 12pt
              }),
            ],
          });
        });

        docSections.push({
          properties: {},
          children: pageParagraphs,
        });

        setProgress(Math.round((i / numPages) * 100));
      }

      const doc = new Document({
        sections: docSections,
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name.replace('.pdf', '.docx');
      link.click();
      
      setStatus('success');
    } catch (error) {
      console.error('Conversion Error:', error);
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl text-blue-600 mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">PDF to Word</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Convert your PDF documents into editable Word (.docx) files while preserving text content.
        </p>
      </div>

      <div className="grid gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
          <FileUploader
            onFilesSelected={(files) => {
              setFile(files[0]);
              setStatus('idle');
            }}
            accept=".pdf"
            multiple={false}
          />
        </div>

        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-bold text-neutral-900">Selected File</h3>
                  {status === 'success' && (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      CONVERTED
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 truncate">{file.name}</p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <ArrowRight className="h-5 w-5 rotate-45" />
                  </button>
                </div>

                {isProcessing && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest">
                      <span>Extracting Text...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {status === 'error' && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-bold">Failed to convert PDF. The file might be protected or corrupted.</p>
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="group flex items-center gap-3 rounded-2xl bg-neutral-900 px-12 py-5 font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50 shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      Convert to Word
                      <Download className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 bg-blue-50 rounded-3xl p-8 border border-blue-100">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          How it works
        </h4>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">1</div>
            <p className="text-sm text-blue-700 font-medium">Extracts text layers from your PDF pages.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">2</div>
            <p className="text-sm text-blue-700 font-medium">Reconstructs the document structure line by line.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm">3</div>
            <p className="text-sm text-blue-700 font-medium">Generates a standard .docx file for editing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
