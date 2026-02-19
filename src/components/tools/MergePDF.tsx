import React from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUploader, FileList } from '../FileUploader';
import { Download, Loader2, ArrowRight } from 'lucide-react';

export const MergePDF: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      link.click();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please ensure all files are valid PDF documents.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">Merge PDF</h2>
        <p className="mt-2 text-neutral-500">Combine multiple PDF files into one document in seconds.</p>
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
              onClick={handleMerge}
              disabled={isProcessing || files.length < 2}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  Merge PDF
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
