import React from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { FileUploader, FileList } from '../FileUploader';
import { Loader2, ArrowRight, Type } from 'lucide-react';

export const AddWatermark: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [watermarkText, setWatermarkText] = React.useState('CONFIDENTIAL');

  const handleAddWatermark = async () => {
    if (files.length === 0 || !watermarkText) return;
    setIsProcessing(true);
    try {
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const pages = pdfDoc.getPages();

        pages.forEach((page) => {
          const { width, height } = page.getSize();
          page.drawText(watermarkText, {
            x: width / 4,
            y: height / 2,
            size: 50,
            font: font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.3,
            rotate: degrees(45),
          });
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `watermarked_${file.name}`;
        link.click();
      }
    } catch (error) {
      console.error('Error adding watermark:', error);
      alert('Failed to add watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">Add Watermark</h2>
        <p className="mt-2 text-neutral-500">Stamp an image or text over your PDF in seconds. Choose typography, transparency and position.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">Watermark Text</label>
        <div className="relative">
          <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="CONFIDENTIAL"
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
          />
        </div>
      </div>

      <FileUploader
        onFilesSelected={(newFiles) => setFiles([...files, ...newFiles])}
        accept=".pdf"
      />

      {files.length > 0 && (
        <>
          <FileList files={files} onRemove={(idx) => setFiles(files.filter((_, i) => i !== idx))} />
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAddWatermark}
              disabled={isProcessing || !watermarkText}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Add Watermark
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
