import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { FileUploader } from '../FileUploader';
import { Loader2, ArrowRight, Lock, Unlock, CheckCircle2, XCircle, KeyRound, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const UnlockPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUnlock = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    setStatus('idle');
    setProgress(0);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // 1. Load the PDF with the password using PDF.js
      const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        password: password
      });
      
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      // 2. Create a new PDF document
      const outPdfDoc = await PDFDocument.create();
      
      // 3. Render each page to an image and add to the new PDF
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          // @ts-ignore - Some versions of pdfjs-dist have conflicting type definitions for RenderParameters
          await page.render({ canvasContext: context, viewport }).promise;
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          const img = await outPdfDoc.embedJpg(imgData);
          
          const { width, height } = img.scale(0.5); // Scale back to original size (since we used scale 2.0)
          const outPage = outPdfDoc.addPage([width, height]);
          outPage.drawImage(img, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }
        
        setProgress(Math.round((i / numPages) * 100));
      }

      // 4. Save the new unlocked PDF
      const pdfBytes = await outPdfDoc.save();
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `unlocked_${file.name}`;
      link.click();

      setStatus('success');
      setMessage('PDF successfully unlocked and downloaded!');
    } catch (error: any) {
      console.error('Unlock Error:', error);
      setStatus('error');
      if (error.name === 'PasswordException' || error.message?.includes('password')) {
        setMessage('Incorrect password. Please try again.');
      } else {
        setMessage('An error occurred while unlocking the PDF. Make sure it is a valid password-protected PDF.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 rounded-2xl text-amber-600 mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">Unlock PDF</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Remove passwords and restrictions from your PDF files instantly.
        </p>
      </div>

      <div className="grid gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
          <FileUploader
            onFilesSelected={(files) => {
              setFile(files[0]);
              setStatus('idle');
              setProgress(0);
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
                <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 mb-6">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Unlock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 truncate">{file.name}</p>
                    <p className="text-xs text-neutral-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="Enter PDF Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-amber-800 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      Note: This process removes encryption by re-generating the document. 
                      The resulting PDF will be a high-quality image-based document.
                    </p>
                  </div>
                </div>
              </div>

              {status !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-3 rounded-2xl p-4 border ${
                    status === 'success' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}
                >
                  {status === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <p className="font-semibold">{message}</p>
                </motion.div>
              )}

              <div className="flex flex-col items-center gap-6">
                {isProcessing && (
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-sm font-bold text-neutral-600">
                      <span>Unlocking & Re-generating...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-amber-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUnlock}
                  disabled={isProcessing || !password}
                  className="group flex items-center gap-3 rounded-2xl bg-neutral-900 px-12 py-5 font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-50 shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Unlock PDF
                      <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setFile(null);
                    setPassword('');
                    setStatus('idle');
                    setProgress(0);
                  }}
                  className="text-neutral-500 hover:text-neutral-900 text-sm font-medium transition-colors"
                >
                  Choose a different file
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
