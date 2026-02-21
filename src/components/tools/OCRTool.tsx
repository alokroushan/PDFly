import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { FileUploader, FileList } from '../FileUploader';
import { Loader2, ArrowRight, FileSearch, Copy, Download, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const OCRTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleOCR = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setOcrText('');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = '';

      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            // We'll calculate a rough overall progress
            // This is just for one page, we need to scale it by total pages
          }
        }
      });

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          // @ts-ignore - Some versions of pdfjs-dist have conflicting type definitions for RenderParameters
          await page.render({ canvasContext: context, viewport }).promise;
          
          const { data: { text } } = await worker.recognize(canvas);
          fullText += `--- Page ${i} ---\n${text}\n\n`;
        }
        
        setProgress(Math.round((i / numPages) * 100));
      }

      await worker.terminate();
      setOcrText(fullText);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('An error occurred during OCR processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ocrText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([ocrText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file?.name.replace('.pdf', '')}_ocr.txt`;
    link.click();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-lime-50 rounded-2xl text-lime-600 mb-4">
          <FileSearch className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">OCR PDF</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Extract text from scanned PDFs and images using advanced Optical Character Recognition.
        </p>
      </div>

      {!ocrText ? (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
            <FileUploader
              onFilesSelected={(files) => setFile(files[0])}
              accept=".pdf"
              multiple={false}
            />
          </div>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-full max-w-md p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <FileSearch className="h-5 w-5 text-lime-600" />
                    </div>
                    <span className="font-bold text-neutral-900 truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} className="text-neutral-400 hover:text-red-500">
                    <CheckCircle2 className="h-5 w-5 rotate-45" />
                  </button>
                </div>

                {isProcessing && (
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-sm font-bold text-neutral-600">
                      <span>Extracting Text...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-lime-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleOCR}
                  disabled={isProcessing}
                  className="group flex items-center gap-3 rounded-2xl bg-neutral-900 px-12 py-5 font-bold text-white transition-all hover:bg-lime-600 disabled:opacity-50 shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Processing OCR...
                    </>
                  ) : (
                    <>
                      Start OCR Process
                      <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
            <h3 className="font-bold text-neutral-900">Extracted Text</h3>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-neutral-50 text-neutral-600 hover:bg-neutral-100 transition-all"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={downloadText}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-lime-600 text-white hover:bg-lime-700 transition-all shadow-md shadow-lime-100"
              >
                <Download className="h-4 w-4" />
                Download .txt
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-inner border border-neutral-100 min-h-[400px] max-h-[600px] overflow-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm text-neutral-700 leading-relaxed">
              {ocrText}
            </pre>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                setOcrText('');
                setFile(null);
              }}
              className="text-neutral-500 hover:text-neutral-900 font-bold text-sm transition-colors"
            >
              Process another document
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
