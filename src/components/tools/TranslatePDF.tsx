import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { GoogleGenAI } from "@google/genai";
import { FileUploader } from '../FileUploader';
import { Loader2, ArrowRight, Languages, Download, Copy, CheckCircle2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize PDF.js worker using the recommended Vite pattern
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
];

export const TranslatePDF: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetLang, setTargetLang] = useState('es');
  const [translatedText, setTranslatedText] = useState('');
  const [copied, setCopied] = useState(false);

  const extractText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
      setProgress(Math.round((i / pdf.numPages) * 30)); // First 30% is extraction
    }
    return fullText;
  };

  const translateText = async (text: string, langName: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model,
      contents: `Translate the following text to ${langName}. Preserve the paragraph structure. Only return the translated text.\n\nText:\n${text}`,
      config: {
        systemInstruction: "You are a professional translator. Translate the provided text accurately while maintaining the original tone and formatting.",
      }
    });

    return response.text || '';
  };

  const handleTranslate = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setTranslatedText('');

    try {
      // 1. Extract Text
      const originalText = await extractText(file);
      setProgress(40);

      // 2. Translate
      const langName = LANGUAGES.find(l => l.code === targetLang)?.name || 'Spanish';
      const result = await translateText(originalText, langName);
      setTranslatedText(result);
      setProgress(100);
    } catch (error) {
      console.error('Translation Error:', error);
      alert('An error occurred during translation. Please check your API key or file content.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTranslatedPdf = async () => {
    if (!translatedText) return;
    
    const pdfDoc = await PDFDocument.create();
    const { width, height } = { width: 595.28, height: 841.89 }; // A4
    const margin = 50;
    const fontSize = 12;
    const lineHeight = 18;
    
    // Check if text can be encoded with standard fonts
    const canEncodeWinAnsi = (text: string) => !/[^\u0000-\u007F\u00A0-\u00FF]/.test(text);
    
    if (canEncodeWinAnsi(translatedText)) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const lines = translatedText.split('\n');
      let page = pdfDoc.addPage([width, height]);
      let y = height - margin;

      for (const line of lines) {
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine + word + ' ';
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth > width - 2 * margin) {
            page.drawText(currentLine.trim(), { x: margin, y, size: fontSize, font });
            y -= lineHeight;
            currentLine = word + ' ';
            
            if (y < margin) {
              page = pdfDoc.addPage([width, height]);
              y = height - margin;
            }
          } else {
            currentLine = testLine;
          }
        }
        page.drawText(currentLine.trim(), { x: margin, y, size: fontSize, font });
        y -= lineHeight * 1.5;
        if (y < margin) {
          page = pdfDoc.addPage([width, height]);
          y = height - margin;
        }
      }
    } else {
      // Fallback: Render to images for non-Latin languages (CJK, Arabic, etc.)
      const lines = translatedText.split('\n');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Use a higher scale for better quality
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      let currentPageLines: string[] = [];
      let currentY = margin * scale;
      const maxContentHeight = (height - margin) * scale;

      const flushPage = async (pageLines: string[]) => {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = width * scale;
        pageCanvas.height = height * scale;
        const pCtx = pageCanvas.getContext('2d');
        if (!pCtx) return;

        pCtx.fillStyle = 'white';
        pCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pCtx.fillStyle = 'black';
        pCtx.font = `${fontSize * scale}px sans-serif`;
        
        let drawY = margin * scale;
        for (const l of pageLines) {
          pCtx.fillText(l, margin * scale, drawY);
          drawY += lineHeight * scale;
        }

        const imgData = pageCanvas.toDataURL('image/jpeg', 0.9);
        const img = await pdfDoc.embedJpg(imgData);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(img, { x: 0, y: 0, width, height });
      };

      ctx.font = `${fontSize * scale}px sans-serif`;
      for (const line of lines) {
        // Simple wrap
        const words = line.split(' ');
        let currentLine = '';
        for (const word of words) {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > (width - 2 * margin) * scale) {
            currentPageLines.push(currentLine.trim());
            currentY += lineHeight * scale;
            currentLine = word + ' ';
            if (currentY > maxContentHeight) {
              await flushPage(currentPageLines);
              currentPageLines = [];
              currentY = margin * scale;
            }
          } else {
            currentLine = testLine;
          }
        }
        currentPageLines.push(currentLine.trim());
        currentY += lineHeight * 1.5 * scale;
        if (currentY > maxContentHeight) {
          await flushPage(currentPageLines);
          currentPageLines = [];
          currentY = margin * scale;
        }
      }
      if (currentPageLines.length > 0) {
        await flushPage(currentPageLines);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translated_${file?.name}`;
    link.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl text-blue-600 mb-4">
          <Languages className="h-8 w-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-neutral-900">Translate PDF</h2>
        <p className="text-lg text-neutral-500 max-w-lg mx-auto">
          Translate your PDF documents into over 10 languages while preserving structure.
        </p>
      </div>

      {!translatedText ? (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
            <div className="mb-6 flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
              <Globe className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Target Language</label>
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-transparent font-bold text-neutral-900 focus:outline-none cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

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
                      <Languages className="h-5 w-5 text-blue-600" />
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
                      <span>Translating...</span>
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

                <button
                  onClick={handleTranslate}
                  disabled={isProcessing}
                  className="group flex items-center gap-3 rounded-2xl bg-neutral-900 px-12 py-5 font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50 shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Translate Document
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-neutral-900">Translated Result ({LANGUAGES.find(l => l.code === targetLang)?.name})</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-neutral-50 text-neutral-600 hover:bg-neutral-100 transition-all"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={downloadTranslatedPdf}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-inner border border-neutral-100 min-h-[400px] max-h-[600px] overflow-auto">
            <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
              {translatedText}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                setTranslatedText('');
                setFile(null);
              }}
              className="text-neutral-500 hover:text-neutral-900 font-bold text-sm transition-colors"
            >
              Translate another document
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
