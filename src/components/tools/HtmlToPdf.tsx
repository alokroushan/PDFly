import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { Loader2, ArrowRight, Code, FileCode, Download, Eye, Layout, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HtmlToPdf: React.FC = () => {
  const [html, setHtml] = useState<string>(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: 'Inter', sans-serif; 
      padding: 60px; 
      color: #1a1a1a;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    h1 { 
      color: #4f46e5; 
      font-size: 32px;
      margin: 0;
    }
    .content {
      line-height: 1.8;
      font-size: 16px;
    }
    .card { 
      background: #f9fafb;
      border: 1px solid #e5e7eb; 
      padding: 30px; 
      border-radius: 16px; 
      margin-top: 40px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">Professional Document</div>
    <h1>PDFly HTML Export</h1>
  </div>
  
  <div class="content">
    <p>This document was generated directly from HTML and CSS using the <strong>PDFly Intelligence Engine</strong>. It supports modern CSS features, including:</p>
    <ul>
      <li>Custom Google Fonts</li>
      <li>Flexbox & Grid Layouts</li>
      <li>Complex Box Shadows</li>
      <li>High-Resolution Image Embedding</li>
    </ul>
    
    <div class="card">
      <p style="margin: 0; color: #6b7280; font-style: italic;">
        "The best way to predict the future is to create it."
      </p>
    </div>
  </div>
</body>
</html>`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [debouncedHtml, setDebouncedHtml] = useState(html);
  const previewRef = useRef<HTMLDivElement>(null);

  // Debounce HTML updates for the preview to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHtml(html);
    }, 500);
    return () => clearTimeout(timer);
  }, [html]);

  const handleConvert = async () => {
    if (!previewRef.current) return;
    setIsProcessing(true);

    try {
      // 1. Capture the preview element as a canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 3, // Ultra high quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      // 2. Create PDF
      const pdfDoc = await PDFDocument.create();
      const img = await pdfDoc.embedJpg(imgData);
      
      const a4Width = 595.28;
      const a4Height = 841.89;
      const imgDims = img.scale(1);
      
      const scaleFactor = (a4Width - 80) / imgDims.width;
      const finalWidth = imgDims.width * scaleFactor;
      const finalHeight = imgDims.height * scaleFactor;

      const page = pdfDoc.addPage([a4Width, Math.max(a4Height, finalHeight + 80)]);
      page.drawImage(img, {
        x: 40,
        y: page.getHeight() - finalHeight - 40,
        width: finalWidth,
        height: finalHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pdfly_export.pdf';
      link.click();
    } catch (error) {
      console.error('Conversion Error:', error);
      alert('An error occurred during conversion. Please check your HTML for errors.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-cyan-50 rounded-2xl text-cyan-600 mb-4">
          <FileCode className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">HTML to PDF</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Transform your web designs into pixel-perfect PDF documents with our advanced rendering engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Section */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-neutral-100">
            <div className="flex p-1 bg-neutral-50 rounded-xl">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'editor' ? 'bg-white text-cyan-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Code className="h-4 w-4" />
                HTML Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'preview' ? 'bg-white text-cyan-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Eye className="h-4 w-4" />
                Live Preview
              </button>
            </div>
            <div className="flex items-center gap-2 px-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Auto-Sync Active</span>
            </div>
          </div>

          <div className="relative flex-1 min-h-[600px] bg-neutral-900 rounded-[2.5rem] shadow-2xl border-8 border-neutral-800 overflow-hidden">
            {activeTab === 'editor' ? (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="w-full h-full p-8 font-mono text-sm text-cyan-400 focus:outline-none resize-none bg-transparent selection:bg-cyan-500/30"
                spellCheck={false}
                placeholder="Paste your HTML here..."
              />
            ) : (
              <div className="w-full h-full overflow-auto bg-neutral-100 p-8">
                <div className="bg-white shadow-2xl mx-auto min-h-full rounded-sm overflow-hidden" style={{ width: '100%', maxWidth: '800px' }}>
                  <iframe
                    srcDoc={debouncedHtml}
                    title="Preview"
                    className="w-full min-h-[800px] border-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-neutral-900">Export Options</h3>
              <p className="text-sm text-neutral-500">Your HTML will be rendered as a high-resolution image and embedded into a PDF.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Layout className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">A4 Portrait</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">595 x 842 Points</p>
                </div>
              </div>

              <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-100 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-700 leading-relaxed font-medium">
                  We use a 3x scaling factor to ensure your text and graphics remain sharp even when zoomed in.
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <button
                onClick={handleConvert}
                disabled={isProcessing || !html}
                className="w-full group flex items-center justify-center gap-3 rounded-2xl bg-neutral-900 px-8 py-5 font-bold text-white transition-all hover:bg-cyan-600 disabled:opacity-50 shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Rendering PDF...
                  </>
                ) : (
                  <>
                    Generate PDF
                    <Download className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
                  </>
                )}
              </button>
              
              <button
                onClick={() => setHtml(`<!DOCTYPE html><html><head><style>body{font-family:sans-serif;padding:40px;}</style></head><body><h1>New Document</h1></body></html>`)}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Editor
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-3xl p-8 text-white space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-cyan-400">
              <Code className="h-5 w-5" />
              Developer Notes
            </h4>
            <div className="space-y-3 text-xs text-neutral-400 leading-relaxed">
              <p>• External CSS frameworks like Tailwind can be included via CDN links in the <code>&lt;head&gt;</code>.</p>
              <p>• For multi-page documents, use the <code>page-break-after: always</code> CSS property.</p>
              <p>• Images must have permissive CORS headers to be included in the final export.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden capture element for html2canvas - rendered with debounced HTML */}
      <div className="fixed -left-[9999px] top-0">
        <div 
          ref={previewRef}
          style={{ width: '800px', padding: '0', margin: '0', background: 'white' }}
          dangerouslySetInnerHTML={{ __html: debouncedHtml }}
        />
      </div>
    </div>
  );
};
