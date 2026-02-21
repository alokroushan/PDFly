import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUploader, FileList } from '../FileUploader';
import { Download, Loader2, ArrowRight, FileStack, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MergePDF: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged_document.pdf';
      link.click();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please ensure all files are valid PDF documents.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-red-50 rounded-2xl text-red-600 mb-4">
          <FileStack className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">Merge PDF</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Combine multiple PDF files into a single, organized document in seconds.
        </p>
      </div>

      <div className="grid gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
          <FileUploader
            onFilesSelected={(newFiles) => setFiles([...files, ...newFiles])}
            accept=".pdf"
            multiple={true}
          />
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                    Files to Merge
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded-full">
                      {files.length}
                    </span>
                  </h3>
                  <button 
                    onClick={() => setFiles([])}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <motion.div
                      key={`${file.name}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex items-center gap-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-red-200 transition-all"
                    >
                      <div className="p-2 bg-white rounded-xl shadow-sm text-neutral-400">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 truncate text-sm">{file.name}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleMerge}
                  disabled={isProcessing || files.length < 2}
                  className="group flex items-center gap-3 rounded-2xl bg-neutral-900 px-12 py-5 font-bold text-white transition-all hover:bg-red-600 disabled:opacity-50 shadow-xl disabled:hover:bg-neutral-900"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Merging PDFs...
                    </>
                  ) : (
                    <>
                      Merge {files.length} PDFs
                      <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                {files.length < 2 && (
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    Select at least 2 files to merge
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
