import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { FileUploader } from '../FileUploader';
import { 
  Loader2, 
  ArrowRight, 
  PenTool, 
  Download, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Type, 
  Eraser,
  CheckCircle2,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface SignatureInstance {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  dataUrl: string;
}

export const SignPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [stageScale, setStageScale] = useState(1);
  
  const [signatures, setSignatures] = useState<SignatureInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  const stageRef = useRef<any>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const trRef = useRef<any>(null);

  // Load PDF metadata
  useEffect(() => {
    if (file) {
      loadPdf();
    } else {
      setPageImage(null);
      setNumPages(0);
      setSignatures([]);
    }
  }, [file]);

  // Render current page
  useEffect(() => {
    if (file && currentPage) {
      renderPage(currentPage);
    }
  }, [currentPage, file]);

  const loadPdf = async () => {
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const renderPage = async (pageNumber: number) => {
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNumber);
      
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        // @ts-ignore
        await page.render({ canvasContext: context, viewport }).promise;
        setPageImage(canvas.toDataURL());
        setPageSize({ width: viewport.width, height: viewport.height });
        
        const containerWidth = Math.min(window.innerWidth - 80, 800);
        setStageScale(containerWidth / viewport.width);
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  // Signature Pad Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    
    // Check if canvas is empty (optional but good)
    const dataUrl = canvas.toDataURL();
    const newSig: SignatureInstance = {
      id: Math.random().toString(36).substr(2, 9),
      x: 50,
      y: 50,
      width: 150,
      height: 75,
      page: currentPage,
      dataUrl
    };
    setSignatures([...signatures, newSig]);
    setShowSignaturePad(false);
  };

  const handleSign = async () => {
    if (!file || signatures.length === 0) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for (const sig of signatures) {
        const page = pages[sig.page - 1];
        const { width, height } = page.getSize();
        
        // Map preview coordinates to PDF coordinates
        // Preview scale was 1.5 in renderPage
        const scaleX = width / (pageSize.width / 1.5);
        const scaleY = height / (pageSize.height / 1.5);
        
        const imgBytes = await fetch(sig.dataUrl).then(res => res.arrayBuffer());
        const img = await pdfDoc.embedPng(imgBytes);

        page.drawImage(img, {
          x: (sig.x / 1.5) * scaleX,
          y: height - ((sig.y + sig.height) / 1.5) * scaleY,
          width: (sig.width / 1.5) * scaleX,
          height: (sig.height / 1.5) * scaleY,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `signed_${file.name}`;
      link.click();
    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('Failed to sign PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Component for Signature on Stage
  const SignatureImage = ({ sig }: { sig: SignatureInstance }) => {
    const [img] = useImage(sig.dataUrl);
    const isSelected = selectedId === sig.id;

    return (
      <>
        <KonvaImage
          image={img}
          x={sig.x}
          y={sig.y}
          width={sig.width}
          height={sig.height}
          draggable
          onClick={() => setSelectedId(sig.id)}
          onTap={() => setSelectedId(sig.id)}
          onDragEnd={(e) => {
            const newSigs = signatures.map(s => 
              s.id === sig.id ? { ...s, x: e.target.x(), y: e.target.y() } : s
            );
            setSignatures(newSigs);
          }}
          onTransformEnd={(e) => {
            const node = e.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            const newSigs = signatures.map(s => 
              s.id === sig.id ? { 
                ...s, 
                x: node.x(), 
                y: node.y(), 
                width: node.width() * scaleX, 
                height: node.height() * scaleY 
              } : s
            );
            setSignatures(newSigs);
          }}
          ref={isSelected ? (node) => {
            if (node && trRef.current) {
              trRef.current.nodes([node]);
              trRef.current.getLayer().batchDraw();
            }
          } : null}
        />
      </>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-4">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">Sign PDF</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Add your digital signature to any PDF document securely and professionally.
        </p>
      </div>

      {!file ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
          <FileUploader
            onFilesSelected={(files) => setFile(files[0])}
            accept=".pdf"
            multiple={false}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-neutral-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center min-h-[700px] justify-center relative overflow-hidden">
              {pageImage ? (
                <div 
                  className="relative shadow-2xl border-4 border-neutral-800 rounded-lg overflow-hidden bg-white"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedId(null);
                  }}
                >
                  <Stage
                    width={pageSize.width * stageScale}
                    height={pageSize.height * stageScale}
                    scaleX={stageScale}
                    scaleY={stageScale}
                    ref={stageRef}
                  >
                    <Layer>
                      <KonvaImage
                        image={(() => {
                          const img = new window.Image();
                          img.src = pageImage;
                          return img;
                        })()}
                        width={pageSize.width}
                        height={pageSize.height}
                      />
                      {signatures
                        .filter(sig => sig.page === currentPage)
                        .map(sig => (
                          <SignatureImage key={sig.id} sig={sig} />
                        ))
                      }
                      <Transformer
                        ref={trRef}
                        rotateEnabled={false}
                        keepRatio={true}
                        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                      />
                    </Layer>
                  </Stage>
                </div>
              ) : (
                <Loader2 className="h-12 w-12 text-white animate-spin opacity-20" />
              )}

              {/* Page Navigation */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-white font-bold text-sm min-w-[80px] text-center">
                  Page {currentPage} / {numPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                  disabled={currentPage === numPages}
                  className="p-2 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900">Signatures</h3>
                <p className="text-sm text-neutral-500">Create and place your signatures.</p>
              </div>

              <button
                onClick={() => setShowSignaturePad(true)}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-200 p-6 text-emerald-600 font-bold hover:bg-emerald-100 transition-all group"
              >
                <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                Create Signature
              </button>

              {signatures.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active Signatures</p>
                  <div className="grid grid-cols-1 gap-2">
                    {signatures.map((sig, idx) => (
                      <div 
                        key={sig.id}
                        className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${
                          selectedId === sig.id ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-100 hover:border-neutral-200'
                        }`}
                        onClick={() => {
                          setSelectedId(sig.id);
                          setCurrentPage(sig.page);
                        }}
                      >
                        <div className="w-12 h-8 bg-white rounded border border-neutral-100 overflow-hidden flex items-center justify-center p-1">
                          <img src={sig.dataUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate">Signature {idx + 1}</p>
                          <p className="text-[10px] text-neutral-500">Page {sig.page}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSignatures(signatures.filter(s => s.id !== sig.id));
                            if (selectedId === sig.id) setSelectedId(null);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-500"
                        >
                          <Eraser className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-4">
                <button
                  onClick={handleSign}
                  disabled={isProcessing || signatures.length === 0}
                  className="w-full group flex items-center justify-center gap-3 rounded-2xl bg-neutral-900 px-8 py-5 font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-50 shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Signing PDF...
                    </>
                  ) : (
                    <>
                      Finish & Download
                      <Download className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setFile(null)}
                  className="w-full py-3 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="bg-emerald-900 rounded-3xl p-6 text-white">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Legally Binding
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Digital signatures are recognized as legally binding in many jurisdictions. Your document is processed locally, ensuring your signature never leaves your device.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      <AnimatePresence>
        {showSignaturePad && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-neutral-900">Draw Signature</h3>
                <button onClick={() => setShowSignaturePad(false)} className="p-2 hover:bg-neutral-100 rounded-xl transition-all">
                  <XIcon className="h-6 w-6 text-neutral-500" />
                </button>
              </div>

              <div className="relative aspect-[2/1] bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200 overflow-hidden cursor-crosshair">
                <canvas
                  ref={sigCanvasRef}
                  width={500}
                  height={250}
                  className="w-full h-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest pointer-events-none">
                  Sign here
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={clearSignature}
                  className="flex-1 py-4 px-6 rounded-2xl border border-neutral-200 font-bold text-neutral-600 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  Clear
                </button>
                <button
                  onClick={saveSignature}
                  className="flex-[2] py-4 px-6 rounded-2xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Add to Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
