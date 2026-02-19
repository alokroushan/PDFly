import React from 'react';
import { Upload, X, FileText, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  label?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, accept, multiple = true, label = "Drop files here or click to upload" }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
        isDragging ? "border-indigo-500 bg-indigo-50/50" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-indigo-50 p-4 text-indigo-600">
          <Upload className="h-8 w-8" />
        </div>
        <div>
          <p className="text-lg font-medium text-neutral-900">{label}</p>
          <p className="text-sm text-neutral-500">Supports {accept.replace(/\./g, '').toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
};

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemove }) => {
  return (
    <div className="mt-6 space-y-2">
      <AnimatePresence>
        {files.map((file, index) => (
          <motion.div
            key={`${file.name}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 rounded-lg bg-neutral-100 p-2">
                <FileText className="h-5 w-5 text-neutral-500" />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-neutral-900">{file.name}</p>
                <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
