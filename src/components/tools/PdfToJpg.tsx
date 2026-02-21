import React from 'react';
import * as pdfjs from 'pdfjs-dist';
import { FileUploader, FileList } from '../FileUploader';
import { Download, Loader2, ArrowRight } from 'lucide-react';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const PdfToJpg: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const convertPdfToImages = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // @ts-ignore - Some versions of pdfjs-dist have conflicting type definitions for RenderParameters
      await page.render({ 
        canvasContext: context, 
        viewport,
      }).promise;
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
        link.download = `${nameWithoutExt}_page_${i}.jpg`;
        link.click();
      }
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      for (const file of files) {
        await convertPdfToImages(file);
      }
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      alert('Failed to convert PDF to images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">PDF to JPG</h2>
        <p className="mt-2 text-neutral-500">Extract every page of a PDF into high-quality JPG images.</p>
      </div>

      <FileUploader
        onFilesSelected={(newFiles) => setFiles([...files, ...newFiles])}
        accept=".pdf"
        multiple={false}
      />

      {files.length > 0 && (
        <>
          <FileList files={files} onRemove={(idx) => setFiles(files.filter((_, i) => i !== idx))} />
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  Convert to JPG
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
