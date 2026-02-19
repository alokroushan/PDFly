import React from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUploader, FileList } from '../FileUploader';
import { Loader2, ArrowRight, Trash2 } from 'lucide-react';

export const RemovePages: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [pagesToRemove, setPagesToRemove] = React.useState('');

  const handleRemove = async () => {
    if (files.length === 0 || !pagesToRemove) return;
    setIsProcessing(true);
    try {
      const indicesToRemove = pagesToRemove.split(',').map(p => parseInt(p.trim()) - 1).filter(p => !isNaN(p));
      
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Remove pages in reverse order to maintain correct indices
        indicesToRemove.sort((a, b) => b - a).forEach(index => {
          if (index >= 0 && index < pdfDoc.getPageCount()) {
            pdfDoc.removePage(index);
          }
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `modified_${file.name}`;
        link.click();
      }
    } catch (error) {
      console.error('Error removing pages:', error);
      alert('Failed to remove pages. Check your page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">Remove Pages</h2>
        <p className="mt-2 text-neutral-500">Delete pages from your PDF document easily.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">Pages to Remove (e.g. 1, 3, 5)</label>
        <input
          type="text"
          value={pagesToRemove}
          onChange={(e) => setPagesToRemove(e.target.value)}
          placeholder="1, 2, 5..."
          className="w-full rounded-xl border border-neutral-200 bg-white py-3 px-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
        />
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
              onClick={handleRemove}
              disabled={isProcessing || !pagesToRemove}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  Remove Pages
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
