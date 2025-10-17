
import React, { useState, useCallback } from 'react';
import type { ImageFile } from './utils/imageUtils';
import { fileToImageFile, dataUrlToImageFile } from './utils/imageUtils';
import { editImage } from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageEditor from './components/ImageEditor';
import BatchEditor from './components/BatchEditor';

type EditMode = 'upload' | 'single' | 'batch';

export interface BatchImage {
  id: number;
  original: ImageFile;
  edited: ImageFile | null;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMsg?: string;
}

const App: React.FC = () => {
  // Common state
  const [mode, setMode] = useState<EditMode>('upload');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Single image state
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [history, setHistory] = useState<{ image: ImageFile; prompt: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  
  // Batch image state
  const [batchImages, setBatchImages] = useState<BatchImage[]>([]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setIsLoading(true);
      const imageFile = await fileToImageFile(file);
      setOriginalImage(imageFile);
      setHistory([]);
      setHistoryIndex(-1);
      setMode('single');
    } catch (err) {
      setError('Failed to load image. Please try another file.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleMultipleImagesUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    try {
      setError(null);
      setIsLoading(true);
      const imageFiles = await Promise.all(files.map(fileToImageFile));
      setBatchImages(imageFiles.map((file, index) => ({
        id: index,
        original: file,
        edited: null,
        status: 'idle',
      })));
      setMode('batch');
    } catch (err) {
       setError('Failed to load one or more images. Please try again.');
       console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleEdit = useCallback(async (prompt: string) => {
    if (!originalImage) return;

    const sourceImage = historyIndex === -1 ? originalImage : history[historyIndex].image;

    try {
      setError(null);
      setIsLoading(true);
      setLastPrompt(prompt);

      const resultDataUrl = await editImage({
        base64Data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
        prompt,
      });
      
      const resultImageFile = dataUrlToImageFile(resultDataUrl);
      
      const newHistory = history.slice(0, historyIndex + 1);
      const newHistoryEntry = { image: resultImageFile, prompt };
      
      setHistory([...newHistory, newHistoryEntry]);
      setHistoryIndex(newHistory.length);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, history, historyIndex]);

  const handleBatchEdit = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setLastPrompt(prompt);

    setBatchImages(prev => prev.map(img => ({ ...img, status: 'processing' })));
    
    const editPromises = batchImages.map(async (image) => {
        try {
            const resultDataUrl = await editImage({
                base64Data: image.original.base64,
                mimeType: image.original.mimeType,
                prompt,
            });
            const editedImageFile = dataUrlToImageFile(resultDataUrl);
            return { id: image.id, status: 'done' as const, edited: editedImageFile };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            return { id: image.id, status: 'error' as const, errorMsg };
        }
    });

    const results = await Promise.all(editPromises);

    setBatchImages(prev => {
        const newImages = [...prev];
        results.forEach(result => {
            const { id, status, edited, errorMsg } = result;
            const index = newImages.findIndex(img => img.id === id);
            if (index !== -1) {
                newImages[index] = { ...newImages[index], status, edited: edited || null, errorMsg };
            }
        });
        return newImages;
    });

    setIsLoading(false);
  }, [batchImages]);

  const handleUndo = useCallback(() => {
    if (historyIndex >= 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history.length]);

  const handleStartOver = useCallback(() => {
    setOriginalImage(null);
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setLastPrompt('');
    setBatchImages([]);
    setMode('upload');
  }, []);

  const imageToDisplay = historyIndex === -1 
    ? originalImage?.dataUrl 
    : history[historyIndex]?.image.dataUrl;

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;
  
  const renderContent = () => {
    switch(mode) {
      case 'single':
        return imageToDisplay ? <ImageEditor
          imageToDisplay={imageToDisplay}
          onEdit={handleEdit}
          isLoading={isLoading}
          onStartOver={handleStartOver}
          lastPrompt={lastPrompt}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        /> : null;
      case 'batch':
        return <BatchEditor
          images={batchImages}
          onEdit={handleBatchEdit}
          isLoading={isLoading}
          onStartOver={handleStartOver}
          lastPrompt={lastPrompt}
        />;
      case 'upload':
      default:
        return <ImageUploader onImageUpload={handleImageUpload} onMultipleImagesUpload={handleMultipleImagesUpload} isLoading={isLoading} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans antialiased">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        {renderContent()}
        {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center max-w-4xl mx-auto">
                <p><strong>Error:</strong> {error}</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
