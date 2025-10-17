
import React, { useState, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import MagicWandIcon from './icons/MagicWandIcon';
import NewImageIcon from './icons/NewImageIcon';
import SuggestionPill from './SuggestionPill';
import UndoIcon from './icons/UndoIcon';
import RedoIcon from './icons/RedoIcon';
import DownloadIcon from './icons/DownloadIcon';

interface ImageEditorProps {
  imageToDisplay: string;
  onEdit: (prompt: string) => void;
  isLoading: boolean;
  onStartOver: () => void;
  lastPrompt: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const actionPrompts = {
  enhance: "Subtly enhance the colors, lighting, and sharpness of this photo to make it more vibrant and clear without looking artificial.",
  upscale: "Increase the resolution and detail of this image, making it sharper and clearer as if it were taken with a higher-quality camera. Fill in details logically.",
  upcrop: "Expand the image canvas on all sides, filling in new areas contextually to create a wider scene. Maintain aspect ratio.",
  quality: "Improve the overall quality of this photo. Reduce digital noise, correct compression artifacts, and sharpen important details."
};

const suggestionPrompts = [
  "Make the sky a dramatic sunset",
  "Add a majestic castle in the background",
  "Change the season to autumn",
  "Give this photo a vintage film look",
  "Turn this into a fantasy landscape",
  "Add a clear reflection in the water",
];

const ActionButton: React.FC<{onClick: () => void; children: React.ReactNode, disabled: boolean}> = ({ onClick, children, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="bg-gray-700/50 border border-gray-600 hover:bg-gray-700 hover:border-purple-500 text-gray-200 font-semibold py-3 px-2 rounded-lg text-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700/50 disabled:hover:border-gray-600">
        {children}
    </button>
);

const ImageEditor: React.FC<ImageEditorProps> = ({ 
    imageToDisplay, 
    onEdit, 
    isLoading, 
    onStartOver, 
    lastPrompt,
    onUndo,
    onRedo,
    canUndo,
    canRedo 
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('original');
  const [downloadFormat, setDownloadFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [downloadQuality, setDownloadQuality] = useState<number>(0.92);

  const handleActionClick = (prompt: string) => {
    setCustomPrompt(''); 
    onEdit(prompt);
  };
  
  const handleGenerateClick = () => {
    if (customPrompt.trim()) {
      onEdit(customPrompt);
    }
  };

  const handleDownload = useCallback(() => {
    if (!imageToDisplay) return;

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (selectedAspectRatio === 'original') {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
        } else {
            const ratioMap: { [key: string]: number } = {
                '1:1': 1,
                '4:3': 4 / 3,
                '16:9': 16 / 9,
            };
            const targetRatio = ratioMap[selectedAspectRatio];

            if (!targetRatio) { // Fallback for safety
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);
            } else {
                const originalWidth = img.naturalWidth;
                const originalHeight = img.naturalHeight;
                const originalRatio = originalWidth / originalHeight;

                let sx = 0, sy = 0, sWidth = originalWidth, sHeight = originalHeight;

                if (targetRatio > originalRatio) { // Target is wider than original, crop top/bottom
                    sHeight = originalWidth / targetRatio;
                    sy = (originalHeight - sHeight) / 2;
                } else if (targetRatio < originalRatio) { // Target is narrower than original, crop left/right
                    sWidth = originalHeight * targetRatio;
                    sx = (originalWidth - sWidth) / 2;
                }

                canvas.width = sWidth;
                canvas.height = sHeight;
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            }
        }

        // For JPEGs from PNGs, fill transparent background with white
        if (downloadFormat === 'image/jpeg' && imageToDisplay.startsWith('data:image/png')) {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const dataUrl = canvas.toDataURL(downloadFormat, downloadFormat === 'image/jpeg' ? downloadQuality : undefined);

        const link = document.createElement('a');
        link.href = dataUrl;
        
        const fileExtension = downloadFormat.split('/')[1];
        link.download = `enhancepix-edited-image.${fileExtension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    img.onerror = (err) => {
        console.error("Failed to load image for canvas conversion. Falling back to direct download.", err);
        // Fallback for safety, though unlikely with data URLs
        const link = document.createElement('a');
        link.href = imageToDisplay;
        const fallbackExtension = imageToDisplay.split(';')[0].split('/')[1] || 'png';
        link.download = `enhancepix-edited-image.${fallbackExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    img.src = imageToDisplay;
  }, [imageToDisplay, downloadFormat, downloadQuality, selectedAspectRatio]);

  const getAspectRatioClass = (ratio: string): string => {
    switch (ratio) {
        case '1:1': return 'aspect-square';
        case '4:3': return 'aspect-[4/3]';
        case '16:9': return 'aspect-[16/9]';
        default: return 'aspect-square'; // Default container size
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className={`relative ${getAspectRatioClass(selectedAspectRatio)} max-w-2xl mx-auto w-full transition-all duration-300`}>
        <div className="absolute inset-0 bg-black/30 rounded-2xl shadow-2xl shadow-purple-900/20"></div>
        <img
          src={imageToDisplay}
          alt="User uploaded content to be edited"
          className={`relative w-full h-full ${selectedAspectRatio === 'original' ? 'object-contain' : 'object-cover'} rounded-xl z-0`}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10 p-4">
            <LoadingSpinner />
            <p className="mt-4 text-lg font-medium text-purple-300 animate-pulse">
              Enhancing...
            </p>
            {lastPrompt && <p className="mt-2 text-sm text-gray-400 text-center max-w-xs">"{lastPrompt}"</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center">
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">Choose an Action</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ActionButton onClick={() => handleActionClick(actionPrompts.enhance)} disabled={isLoading}>Enhance</ActionButton>
            <ActionButton onClick={() => handleActionClick(actionPrompts.upscale)} disabled={isLoading}>Upscale</ActionButton>
            <ActionButton onClick={() => handleActionClick(actionPrompts.upcrop)} disabled={isLoading}>Upcrop</ActionButton>
            <ActionButton onClick={() => handleActionClick(actionPrompts.quality)} disabled={isLoading}>Improve</ActionButton>
          </div>
        </div>

        <div className="my-6 border-t border-gray-700"></div>

        <div>
          <label htmlFor="custom-prompt" className="text-2xl font-bold text-white mb-4 block">Or, Describe Your Edit</label>
          <div className="flex gap-2">
            <input
              id="custom-prompt"
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., 'Add a shooting star in the sky'"
              className="flex-grow bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              onClick={handleGenerateClick}
              disabled={isLoading || !customPrompt.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <MagicWandIcon className="w-5 h-5" />
              <span>Generate</span>
            </button>
          </div>
        </div>
        
        <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-300 mb-3">Suggestions</h4>
            <div className="flex flex-wrap gap-2">
                {suggestionPrompts.map(prompt => (
                    <SuggestionPill key={prompt} text={prompt} onClick={() => setCustomPrompt(prompt)} disabled={isLoading} />
                ))}
            </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700">
            <h4 className="text-lg font-semibold text-gray-300 mb-3">Finalize & Download</h4>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                    {['Original', '1:1', '4:3', '16:9'].map(ratio => {
                        const ratioValue = ratio.toLowerCase();
                        return (
                            <button
                                key={ratioValue}
                                onClick={() => setSelectedAspectRatio(ratioValue)}
                                disabled={isLoading}
                                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
                                    selectedAspectRatio === ratioValue
                                    ? 'bg-purple-600 text-white border-purple-500'
                                    : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 text-gray-300'
                                }`}
                            >
                                {ratio === '1:1' ? 'Square (1:1)' : ratio === '4:3' ? 'Standard (4:3)' : ratio === '16:9' ? 'Widescreen (16:9)' : 'Original'}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800/60 rounded-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Format</label>
                    <div className="flex rounded-md shadow-sm">
                        <button type="button" onClick={() => setDownloadFormat('image/png')} disabled={isLoading || !canUndo} className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-600 text-sm font-medium transition-colors ${ downloadFormat === 'image/png' ? 'bg-purple-600 text-white z-10' : 'bg-gray-700 text-gray-300 hover:bg-gray-600' } disabled:opacity-50`}>
                            PNG
                        </button>
                        <button type="button" onClick={() => setDownloadFormat('image/jpeg')} disabled={isLoading || !canUndo} className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border border-gray-600 text-sm font-medium transition-colors ${ downloadFormat === 'image/jpeg' ? 'bg-purple-600 text-white z-10' : 'bg-gray-700 text-gray-300 hover:bg-gray-600' } disabled:opacity-50`}>
                            JPG
                        </button>
                    </div>
                </div>
                {downloadFormat === 'image/jpeg' && (
                <div>
                    <label htmlFor="quality-slider" className="block text-sm font-medium text-gray-400 mb-2">Quality ({Math.round(downloadQuality * 100)}%)</label>
                    <input id="quality-slider" type="range" min="0.1" max="1" step="0.01" value={downloadQuality} onChange={(e) => setDownloadQuality(parseFloat(e.target.value))} disabled={isLoading || !canUndo} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50 disabled:accent-gray-500" />
                </div>
                )}
            </div>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={onUndo} disabled={!canUndo || isLoading} className="flex items-center justify-center gap-2 text-gray-300 font-medium py-2 px-4 rounded-lg bg-gray-700/50 border border-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <UndoIcon className="w-5 h-5" />
                Undo
            </button>
            <button onClick={onRedo} disabled={!canRedo || isLoading} className="flex items-center justify-center gap-2 text-gray-300 font-medium py-2 px-4 rounded-lg bg-gray-700/50 border border-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <RedoIcon className="w-5 h-5" />
                Redo
            </button>
            
            <button 
                onClick={handleDownload} 
                disabled={!canUndo || isLoading}
                className="flex items-center justify-center gap-2 text-white font-medium py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
                <DownloadIcon className="w-5 h-5" />
                Download
            </button>
            <button onClick={onStartOver} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed">
                <NewImageIcon className="w-5 h-5" />
                <span>New Image</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
