import React from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { FileUploader, FileList } from '../FileUploader';
import { Loader2, ArrowRight, RotateCw } from 'lucide-react';

export const RotatePDF: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [rotation, setRotation] = React.useState(90);

  const handleRotate = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        
        pages.forEach((page) => {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotation));
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rotated_${file.name}`;
        link.click();
      }
    } catch (error) {
      console.error('Error rotating PDF:', error);
      alert('Failed to rotate PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">Rotate PDF</h2>
        <p className="mt-2 text-neutral-500">Rotate your PDF pages as you want. Rotate multiple PDFs at the same time!</p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-4">
        <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Rotation:</span>
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          {[90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => setRotation(deg)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                rotation === deg
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-neutral-50 text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <RotateCw className="h-4 w-4" style={{ transform: `rotate(${deg}deg)` }} />
              {deg}°
            </button>
          ))}
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
              onClick={handleRotate}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Rotating...
                </>
              ) : (
                <>
                  Rotate PDF
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
