import React from 'react';
import type { BatchImage } from '../App';
import LoadingSpinner from './LoadingSpinner';
import DownloadIcon from './icons/DownloadIcon';

interface BatchImageCardProps {
    image: BatchImage;
}

const BatchImageCard: React.FC<BatchImageCardProps> = ({ image }) => {
    const { original, edited, status, errorMsg } = image;

    const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!edited?.dataUrl) return;

        const link = document.createElement('a');
        link.href = edited.dataUrl;

        const fileExtension = edited.dataUrl.split(';')[0].split('/')[1] || 'png';
        link.download = `enhancepix-batch-${image.id}.${fileExtension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const content = () => {
        switch (status) {
            case 'processing':
                return (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10 p-4">
                        <LoadingSpinner />
                        <p className="mt-4 text-sm font-medium text-purple-300 animate-pulse">
                            Processing...
                        </p>
                    </div>
                );
            case 'error':
                return (
                     <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10 p-4 text-center">
                        <p className="text-red-200 font-bold">Error</p>
                        <p className="text-red-300 text-xs mt-1">{errorMsg}</p>
                    </div>
                )
            case 'done':
                 return (
                    <img
                        src={edited!.dataUrl}
                        alt="Edited version"
                        className="relative w-full h-full object-contain rounded-xl z-0"
                    />
                 );
            case 'idle':
            default:
                return null;
        }
    }

    return (
        <div className="relative aspect-square bg-black/30 rounded-2xl shadow-lg shadow-purple-900/10 border border-gray-800 overflow-hidden">
            <img
                src={original.dataUrl}
                alt="Original user upload"
                className={`w-full h-full object-contain rounded-xl transition-opacity duration-500 ${status === 'done' ? 'opacity-30' : 'opacity-100'}`}
            />
            <div className="absolute inset-0">
                {content()}
            </div>
             {status === 'done' && (
                <>
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
                        Done
                    </div>
                    <button
                        onClick={handleDownload}
                        className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 z-20"
                        aria-label="Download edited image"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </>
            )}
            {status === 'idle' && (
                <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Ready
                </div>
            )}
        </div>
    )
};

export default BatchImageCard;