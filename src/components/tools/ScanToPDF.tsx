import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Loader2, ArrowRight, Camera, Trash2, Download, RotateCcw, CheckCircle2, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ScanToPDF: React.FC = () => {
  const [scans, setScans] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera Error:', err);
      setError('Could not access camera. Please ensure you have granted permission.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setScans(prev => [...prev, dataUrl]);
        // Visual feedback
        const flash = document.createElement('div');
        flash.className = 'fixed inset-0 bg-white z-[100] animate-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 200);
      }
    }
  };

  const removeScan = (index: number) => {
    setScans(prev => prev.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    if (scans.length === 0) return;
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const scan of scans) {
        const imgBytes = await fetch(scan).then(res => res.arrayBuffer());
        const img = await pdfDoc.embedJpg(imgBytes);
        const { width, height } = img.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(img, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scan_${new Date().getTime()}.pdf`;
      link.click();
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 rounded-2xl text-amber-600 mb-4">
          <Camera className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">Scan to PDF</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Use your camera to scan documents and convert them into high-quality PDFs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Camera Viewport */}
        <div className="relative aspect-[3/4] bg-neutral-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-neutral-800">
          {!isCameraActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="p-6 bg-neutral-800 rounded-full text-neutral-500">
                <Camera className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Ready to scan?</h3>
                <p className="text-neutral-400 text-sm">Grant camera access to start scanning your documents.</p>
              </div>
              <button
                onClick={startCamera}
                className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20"
              >
                Enable Camera
              </button>
              {error && (
                <p className="text-red-400 text-xs font-medium">{error}</p>
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-6">
                <button
                  onClick={stopCamera}
                  className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-8 border-white/30 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                />
                <div className="w-14" /> {/* Spacer for balance */}
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Scanned Pages List */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                Scanned Pages
                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs rounded-full">
                  {scans.length}
                </span>
              </h3>
              {scans.length > 0 && (
                <button
                  onClick={() => setScans([])}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-[300px] max-h-[500px]">
              <AnimatePresence initial={false}>
                {scans.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-neutral-100 rounded-3xl text-neutral-400">
                    <Plus className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No pages scanned yet.<br/>Capture your first page to start.</p>
                  </div>
                ) : (
                  scans.map((scan, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-100 shadow-sm"
                    >
                      <img src={scan} alt={`Scan ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-lg">
                        PAGE {idx + 1}
                      </div>
                      <button
                        onClick={() => removeScan(idx)}
                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-50">
              <button
                onClick={generatePDF}
                disabled={scans.length === 0 || isProcessing}
                className="w-full group flex items-center justify-center gap-3 rounded-2xl bg-neutral-900 px-8 py-5 font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-50 shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Creating PDF...
                  </>
                ) : (
                  <>
                    Save as PDF
                    <Download className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
            <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Scan Tip
            </h4>
            <p className="text-sm text-amber-700 leading-relaxed">
              For the best results, place your document on a flat surface with good lighting. Hold your camera steady and ensure the document fills the frame.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
