
import React, { useState } from 'react';
import type { BatchImage } from '../App';
import BatchImageCard from './BatchImageCard';
import MagicWandIcon from './icons/MagicWandIcon';
import NewImageIcon from './icons/NewImageIcon';
import SuggestionPill from './SuggestionPill';
import DownloadIcon from './icons/DownloadIcon';

interface BatchEditorProps {
    images: BatchImage[];
    onEdit: (prompt: string) => void;
    isLoading: boolean;
    onStartOver: () => void;
    lastPrompt: string;
}

const suggestionPrompts = [
    "Make them all look vintage",
    "Enhance colors and sharpness",
    "Apply a cinematic look",
    "Change the season to autumn",
];


const BatchEditor: React.FC<BatchEditorProps> = ({ images, onEdit, isLoading, onStartOver, lastPrompt }) => {
    const [customPrompt, setCustomPrompt] = useState('');
    const [downloadFormat, setDownloadFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
    const [downloadQuality, setDownloadQuality] = useState<number>(0.92);
    
    const handleGenerateClick = () => {
        if (customPrompt.trim()) {
            onEdit(customPrompt);
        }
    };

    const handleDownloadAll = async () => {
        const imagesToDownload = images.filter(img => img.status === 'done' && img.edited);
        
        for (let i = 0; i < imagesToDownload.length; i++) {
            const image = imagesToDownload[i];
            if (!image.edited?.dataUrl) continue;
            
            try {
                // Use a timeout to stagger downloads to improve browser stability
                await new Promise(resolve => setTimeout(resolve, i * 300));
                
                const img = new Image();
                img.src = image.edited.dataUrl;

                // Wait for the image to load before drawing to canvas
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = (err) => reject(new Error('Failed to load image for conversion.'));
                });
                
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Could not get canvas context');
                
                ctx.drawImage(img, 0, 0);

                // For JPEGs from PNGs, fill transparent background with white
                if (downloadFormat === 'image/jpeg' && image.edited.dataUrl.startsWith('data:image/png')) {
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                const dataUrl = canvas.toDataURL(downloadFormat, downloadFormat === 'image/jpeg' ? downloadQuality : undefined);
                
                const link = document.createElement('a');
                link.href = dataUrl;
                
                const fileExtension = downloadFormat.split('/')[1];
                link.download = `enhancepix-batch-${image.id}.${fileExtension}`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                console.error(`Failed to process and download image ${image.id}:`, err);
                // You could add a user-facing notification here for the failed image
            }
        }
    };

    const processingCount = images.filter(img => img.status === 'processing').length;
    const doneCount = images.filter(img => img.status === 'done').length;
    const totalCount = images.length;
    const progress = totalCount > 0 ? (images.filter(img => img.status === 'done' || img.status === 'error').length / totalCount) * 100 : 0;

    return (
        <div className="w-full">
            {/* Header and Controls */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 mb-8 lg:sticky top-20 z-10 border border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Prompt Section */}
                    <div className="flex-grow">
                        <label htmlFor="batch-prompt" className="text-xl font-bold text-white mb-3 block">1. Describe a style to apply</label>
                        <div className="flex gap-2">
                            <input
                                id="batch-prompt"
                                type="text"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="e.g., 'Convert to black and white'"
                                className="flex-grow bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleGenerateClick}
                                disabled={isLoading || !customPrompt.trim()}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-5 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <MagicWandIcon className="w-5 h-5" />
                                <span>Apply to All</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {suggestionPrompts.map(prompt => (
                                <SuggestionPill key={prompt} text={prompt} onClick={() => setCustomPrompt(prompt)} disabled={isLoading} />
                            ))}
                        </div>
                    </div>

                    {/* Download Section */}
                    <div className="flex-shrink-0">
                         <label className="text-xl font-bold text-white mb-3 block">2. Download your images</label>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Format</label>
                                <div className="flex rounded-md shadow-sm">
                                    <button type="button" onClick={() => setDownloadFormat('image/png')} disabled={isLoading || doneCount === 0} className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-600 text-sm font-medium transition-colors w-1/2 justify-center ${ downloadFormat === 'image/png' ? 'bg-purple-600 text-white z-10' : 'bg-gray-700 text-gray-300 hover:bg-gray-600' } disabled:opacity-50`}>
                                        PNG
                                    </button>
                                    <button type="button" onClick={() => setDownloadFormat('image/jpeg')} disabled={isLoading || doneCount === 0} className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border border-gray-600 text-sm font-medium transition-colors w-1/2 justify-center ${ downloadFormat === 'image/jpeg' ? 'bg-purple-600 text-white z-10' : 'bg-gray-700 text-gray-300 hover:bg-gray-600' } disabled:opacity-50`}>
                                        JPG
                                    </button>
                                </div>
                            </div>
                            <div className={`bg-gray-900/50 p-3 rounded-lg border border-gray-700 transition-opacity ${downloadFormat === 'image/jpeg' ? 'opacity-100' : 'opacity-50'}`}>
                                <label htmlFor="quality-slider" className="block text-sm font-medium text-gray-400 mb-2">Quality ({Math.round(downloadQuality * 100)}%)</label>
                                <input id="quality-slider" type="range" min="0.1" max="1" step="0.01" value={downloadQuality} onChange={(e) => setDownloadQuality(parseFloat(e.target.value))} disabled={isLoading || doneCount === 0 || downloadFormat !== 'image/jpeg'} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50 disabled:accent-gray-500" />
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <button onClick={handleDownloadAll} disabled={isLoading || doneCount === 0} className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                <DownloadIcon className="w-5 h-5" />
                                <span>Download All ({doneCount})</span>
                            </button>
                            <button onClick={onStartOver} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                <NewImageIcon className="w-5 h-5" />
                                <span>New Upload</span>
                            </button>
                         </div>
                    </div>
                </div>
                {isLoading && (
                     <div className="mt-4">
                        <p className="text-purple-300 text-center mb-2">Processing {processingCount} of {totalCount} images... "{lastPrompt}"</p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map(image => (
                    <BatchImageCard key={image.id} image={image} />
                ))}
            </div>
        </div>
    );
};

export default BatchEditor;
