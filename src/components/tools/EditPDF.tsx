import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Stage, Layer, Line, Rect, Text as KonvaText, Transformer } from 'react-konva';
import { FileUploader, FileList } from '../FileUploader';
import { Loader2, ArrowRight, Type, Square, Pencil, Save, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface Shape {
  id: string;
  type: 'line' | 'rect' | 'text';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
}

export const EditPDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  
  const [tool, setTool] = useState<'pencil' | 'rect' | 'text'>('pencil');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);

  // Load PDF
  useEffect(() => {
    if (!file) return;

    const loadPdf = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      renderPage(pdf, 1);
    };

    loadPdf();
  }, [file]);

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      // @ts-ignore - Some versions of pdfjs-dist have conflicting type definitions for RenderParameters
      await page.render({ canvasContext: context, viewport }).promise;
      const img = new Image();
      img.src = canvas.toDataURL();
      img.onload = () => setBgImage(img);
    }
  };

  const handlePageChange = (newNum: number) => {
    if (newNum < 1 || newNum > numPages || !pdfDoc) return;
    setCurrentPage(newNum);
    renderPage(pdfDoc, newNum);
    // In a real app, we'd save shapes per page. For this demo, we'll clear them.
    setShapes([]);
  };

  const handleMouseDown = (e: any) => {
    if (selectedId) {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
        return;
      }
    }

    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;

    if (tool === 'pencil') {
      setShapes([...shapes, { id: Date.now().toString(), type: 'line', points: [pos.x, pos.y], color: '#4f46e5' }]);
    } else if (tool === 'rect') {
      setShapes([...shapes, { id: Date.now().toString(), type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, color: '#4f46e5' }]);
    } else if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        setShapes([...shapes, { id: Date.now().toString(), type: 'text', x: pos.x, y: pos.y, text, color: '#000000' }]);
      }
      isDrawing.current = false;
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || tool === 'text') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastShape = shapes[shapes.length - 1];

    if (tool === 'pencil') {
      lastShape.points = lastShape.points!.concat([point.x, point.y]);
    } else if (tool === 'rect') {
      lastShape.width = point.x - lastShape.x!;
      lastShape.height = point.y - lastShape.y!;
    }

    shapes.splice(shapes.length - 1, 1, lastShape);
    setShapes(shapes.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleSave = async () => {
    if (!file || !stageRef.current) return;
    setIsProcessing(true);

    try {
      const stage = stageRef.current;
      const dataUrl = stage.toDataURL();
      
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const currentPageObj = pages[currentPage - 1];
      
      const editImage = await pdfDoc.embedPng(dataUrl);
      const { width, height } = currentPageObj.getSize();
      
      currentPageObj.drawImage(editImage, {
        x: 0,
        y: 0,
        width,
        height,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${file.name}`;
      link.click();
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Failed to save edits.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">Edit PDF</h2>
        <p className="mt-2 text-neutral-500">Add text, shapes, and freehand drawings to your PDF document.</p>
      </div>

      {!file ? (
        <FileUploader
          onFilesSelected={(files) => setFile(files[0])}
          accept=".pdf"
          multiple={false}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTool('pencil')}
                className={`p-2 rounded-lg transition-all ${tool === 'pencil' ? 'bg-indigo-100 text-indigo-600' : 'text-neutral-500 hover:bg-neutral-50'}`}
                title="Pencil"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                onClick={() => setTool('rect')}
                className={`p-2 rounded-lg transition-all ${tool === 'rect' ? 'bg-indigo-100 text-indigo-600' : 'text-neutral-500 hover:bg-neutral-50'}`}
                title="Rectangle"
              >
                <Square className="h-5 w-5" />
              </button>
              <button
                onClick={() => setTool('text')}
                className={`p-2 rounded-lg transition-all ${tool === 'text' ? 'bg-indigo-100 text-indigo-600' : 'text-neutral-500 hover:bg-neutral-50'}`}
                title="Text"
              >
                <Type className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-neutral-200 mx-2" />
              <button
                onClick={() => setShapes([])}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Clear Page"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {numPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === numPages}
                  className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Edits
              </button>
            </div>
          </div>

          <div className="flex justify-center bg-neutral-100 rounded-3xl p-8 overflow-auto max-h-[70vh]">
            <div className="relative shadow-2xl bg-white">
              {bgImage && (
                <Stage
                  width={bgImage.width}
                  height={bgImage.height}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  ref={stageRef}
                >
                  <Layer>
                    <KonvaText text="" />
                    <Line
                      points={[0, 0, bgImage.width, 0, bgImage.width, bgImage.height, 0, bgImage.height, 0, 0]}
                      fillPatternImage={bgImage}
                      closed
                    />
                    {shapes.map((shape, i) => {
                      if (shape.type === 'line') {
                        return (
                          <Line
                            key={shape.id}
                            points={shape.points}
                            stroke={shape.color}
                            strokeWidth={3}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                          />
                        );
                      } else if (shape.type === 'rect') {
                        return (
                          <Rect
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            stroke={shape.color}
                            strokeWidth={3}
                          />
                        );
                      } else if (shape.type === 'text') {
                        return (
                          <KonvaText
                            key={shape.id}
                            x={shape.x}
                            y={shape.y}
                            text={shape.text}
                            fontSize={20}
                            fill={shape.color}
                          />
                        );
                      }
                      return null;
                    })}
                  </Layer>
                </Stage>
              )}
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => {
                setFile(null);
                setShapes([]);
                setPdfDoc(null);
              }}
              className="text-neutral-500 hover:text-neutral-900 text-sm font-medium transition-colors"
            >
              Upload a different file
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
