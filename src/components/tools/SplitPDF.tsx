import React from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUploader, FileList } from '../FileUploader';
import { Download, Loader2, ArrowRight } from 'lucide-react';

export const SplitPDF: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSplit = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const numPages = pdf.getPageCount();

      for (let i = 0; i < numPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
        link.download = `${nameWithoutExt}_page_${i + 1}.pdf`;
        link.click();
      }
    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('Failed to split PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">Split PDF</h2>
        <p className="mt-2 text-neutral-500">Separate one page or a whole set for easy conversion into independent PDF files.</p>
      </div>

      <FileUploader
        onFilesSelected={(newFiles) => setFiles([newFiles[0]])} // Only one file for splitting
        accept=".pdf"
        multiple={false}
      />

      {files.length > 0 && (
        <>
          <FileList files={files} onRemove={() => setFiles([])} />
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSplit}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Splitting...
                </>
              ) : (
                <>
                  Split PDF
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
