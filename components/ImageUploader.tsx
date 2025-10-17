import React, { useCallback, useState, useRef } from 'react';
import UploadIcon from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onMultipleImagesUpload: (files: File[]) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onMultipleImagesUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onMultipleImagesUpload(Array.from(e.target.files));
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 1) {
        onMultipleImagesUpload(files);
      } else if (files.length === 1) {
        onImageUpload(files[0]);
      }
    }
  }, [onImageUpload, onMultipleImagesUpload]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-white mb-2">Unleash Your Photo's Potential</h2>
        <p className="text-lg text-gray-400">Upload an image to start editing, enhancing, and transforming with AI.</p>
      </div>

      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-800/50' : 'border-gray-600 hover:border-purple-500 hover:bg-gray-800/30'}`}
      >
        <div className="text-center pointer-events-none">
          <UploadIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-300">Drag & Drop your image(s) here</p>
          <p className="text-gray-400">or click to browse</p>
        </div>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>
      
      <div className="mt-6 text-center">
        <button
            onClick={() => multipleFileInputRef.current?.click()}
            disabled={isLoading}
            className="text-purple-400 hover:text-purple-300 hover:underline transition-colors disabled:opacity-50"
        >
            Wanna try batch photos?
        </button>
        <input
          ref={multipleFileInputRef}
          id="multiple-file-upload"
          name="multiple-file-upload"
          type="file"
          multiple
          className="sr-only"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleMultipleFileChange}
          disabled={isLoading}
        />
      </div>

      {isLoading && <p className="mt-4 text-purple-400">Processing image(s)...</p>}
    </div>
  );
};

export default ImageUploader;