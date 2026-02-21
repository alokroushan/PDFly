import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { FileUploader, FileList } from '../FileUploader';
import { Loader2, ArrowRight, Crop, Download, RotateCcw, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CropPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 50, y: 50, width: 200, height: 200 });
  const [stageScale, setStageScale] = useState(1);
  
  const stageRef = useRef<any>(null);
  const rectRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (file) {
      loadPdf();
    } else {
      setPageImage(null);
      setNumPages(0);
    }
  }, [file]);

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
        // @ts-ignore - PDF.js type definitions can be inconsistent across versions
        await page.render({ canvasContext: context, viewport }).promise;
        setPageImage(canvas.toDataURL());
        setPageSize({ width: viewport.width, height: viewport.height });
        
        // Adjust stage scale to fit container
        const containerWidth = Math.min(window.innerWidth - 80, 600);
        setStageScale(containerWidth / viewport.width);
        
        // Reset crop box to a reasonable default if it's outside or too small
        setCropBox({
          x: viewport.width * 0.1,
          y: viewport.height * 0.1,
          width: viewport.width * 0.8,
          height: viewport.height * 0.8
        });
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const handleCrop = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Calculate crop coordinates relative to PDF points
      // PDF points are usually 72 DPI, our preview might be different
      // We need to map our cropBox (which is in preview pixels) to PDF page coordinates
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Map preview coordinates to PDF coordinates
        // Preview scale was 1.5 in renderPage
        const scaleX = width / (pageSize.width / 1.5);
        const scaleY = height / (pageSize.height / 1.5);
        
        // pdf-lib uses (0,0) as bottom-left
        // Our cropBox uses (0,0) as top-left
        const cropX = (cropBox.x / 1.5) * scaleX;
        const cropY = height - ((cropBox.y + cropBox.height) / 1.5) * scaleY;
        const cropW = (cropBox.width / 1.5) * scaleX;
        const cropH = (cropBox.height / 1.5) * scaleY;

        page.setCropBox(cropX, cropY, cropW, cropH);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cropped_${file.name}`;
      link.click();
    } catch (error) {
      console.error('Error cropping PDF:', error);
      alert('Failed to crop PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [pageImage]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-fuchsia-50 rounded-2xl text-fuchsia-600 mb-4">
          <Crop className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">Crop PDF</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Trim the edges of your PDF pages. The selected area will be applied to all pages.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center min-h-[600px] justify-center relative overflow-hidden">
              {pageImage ? (
                <div className="relative shadow-2xl border-4 border-neutral-800 rounded-lg overflow-hidden">
                  <Stage
                    width={pageSize.width * stageScale}
                    height={pageSize.height * stageScale}
                    scaleX={stageScale}
                    scaleY={stageScale}
                    ref={stageRef}
                  >
                    <Layer>
                      {/* Background Image */}
                      <Rect
                        width={pageSize.width}
                        height={pageSize.height}
                        fillPatternImage={(() => {
                          const img = new window.Image();
                          img.src = pageImage;
                          return img;
                        })()}
                      />
                      {/* Dimmed Overlay */}
                      <Rect
                        width={pageSize.width}
                        height={pageSize.height}
                        fill="rgba(0,0,0,0.5)"
                      />
                      {/* Crop Area (Clear) */}
                      <Rect
                        x={cropBox.x}
                        y={cropBox.y}
                        width={cropBox.width}
                        height={cropBox.height}
                        fill="white"
                        fillPatternImage={(() => {
                          const img = new window.Image();
                          img.src = pageImage;
                          return img;
                        })()}
                        fillPatternOffset={{ x: cropBox.x, y: cropBox.y }}
                        draggable
                        ref={rectRef}
                        onDragEnd={(e) => {
                          setCropBox({
                            ...cropBox,
                            x: e.target.x(),
                            y: e.target.y(),
                          });
                        }}
                        onTransformEnd={(e) => {
                          const node = rectRef.current;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();
                          node.scaleX(1);
                          node.scaleY(1);
                          setCropBox({
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(5, node.width() * scaleX),
                            height: Math.max(5, node.height() * scaleY),
                          });
                        }}
                      />
                      <Transformer
                        ref={trRef}
                        boundBoxFunc={(oldBox, newBox) => {
                          if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                          }
                          return newBox;
                        }}
                        rotateEnabled={false}
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

          {/* Controls Area */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900">Crop Controls</h3>
                <p className="text-sm text-neutral-500">Drag and resize the box on the left to select your crop area.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Selected File</span>
                    <button onClick={() => setFile(null)} className="text-xs font-bold text-red-500">Change</button>
                  </div>
                  <p className="font-bold text-neutral-900 truncate text-sm">{file.name}</p>
                </div>

                <div className="p-4 bg-fuchsia-50 rounded-2xl border border-fuchsia-100 flex items-start gap-3">
                  <Info className="h-5 w-5 text-fuchsia-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-fuchsia-700 leading-relaxed">
                    The crop area you select will be applied to <strong>all {numPages} pages</strong> of the document.
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button
                  onClick={handleCrop}
                  disabled={isProcessing || !pageImage}
                  className="w-full group flex items-center justify-center gap-3 rounded-2xl bg-neutral-900 px-8 py-5 font-bold text-white transition-all hover:bg-fuchsia-600 disabled:opacity-50 shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Cropping PDF...
                    </>
                  ) : (
                    <>
                      Apply Crop
                      <Download className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setCropBox({
                      x: pageSize.width * 0.1,
                      y: pageSize.height * 0.1,
                      width: pageSize.width * 0.8,
                      height: pageSize.height * 0.8
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Selection
                </button>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-3xl p-6 text-white">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <Crop className="h-4 w-4 text-fuchsia-400" />
                Precision Cropping
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Our tool uses the standard PDF CropBox attribute. This means the content isn't deleted, but the viewing area is restricted, ensuring maximum compatibility with PDF viewers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
