import React from 'react';
import imageCompression from 'browser-image-compression';
import { FileUploader, FileList } from '../FileUploader';
import { Download, Loader2, ArrowRight, Settings2 } from 'lucide-react';

export const CompressImage: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [maxSizeMB, setMaxSizeMB] = React.useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = React.useState(1920);

  const handleCompress = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
      };

      for (const file of files) {
        const compressedFile = await imageCompression(file, options);
        const url = URL.createObjectURL(compressedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed_${file.name}`;
        link.click();
      }
    } catch (error) {
      console.error('Error compressing images:', error);
      alert('Failed to compress images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">Compress Image</h2>
        <p className="mt-2 text-neutral-500">Reduce image file size without losing quality. KB Reducer for your photos.</p>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-indigo-600 font-semibold">
          <Settings2 className="h-5 w-5" />
          Compression Settings
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Max File Size: {maxSizeMB} MB
            </label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={maxSizeMB}
              onChange={(e) => setMaxSizeMB(parseFloat(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Max Resolution: {maxWidthOrHeight}px
            </label>
            <input
              type="range"
              min="400"
              max="4000"
              step="100"
              value={maxWidthOrHeight}
              onChange={(e) => setMaxWidthOrHeight(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      <FileUploader
        onFilesSelected={(newFiles) => setFiles([...files, ...newFiles])}
        accept=".jpg,.jpeg,.png,.webp"
      />

      {files.length > 0 && (
        <>
          <FileList files={files} onRemove={(idx) => setFiles(files.filter((_, i) => i !== idx))} />
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  Compress Images
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
