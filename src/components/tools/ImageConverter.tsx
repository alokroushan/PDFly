import React from 'react';
import { FileUploader, FileList } from '../FileUploader';
import { Download, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

type Format = 'jpeg' | 'png' | 'webp';

export const ImageConverter: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [targetFormat, setTargetFormat] = React.useState<Format>('jpeg');

  const convertImage = (file: File, format: Format): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Conversion failed'));
          }, `image/${format}`, 0.9);
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      for (const file of files) {
        const blob = await convertImage(file, targetFormat);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
        link.download = `${nameWithoutExt}.${targetFormat}`;
        link.click();
      }
    } catch (error) {
      console.error('Error converting images:', error);
      alert('Failed to convert images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-neutral-900">Image Converter</h2>
        <p className="mt-2 text-neutral-500">Convert images between JPG, PNG, and WEBP formats instantly.</p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-4">
        <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Convert to:</span>
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          {(['jpeg', 'png', 'webp'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setTargetFormat(format)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                targetFormat === format
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
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
                  Convert Images
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
