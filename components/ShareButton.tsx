
import React from 'react';

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
);

export const ShareButton: React.FC = () => {
    const shareOnFacebook = () => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent("Check out this cool card game, Crack!");
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        window.open(facebookShareUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <button
            onClick={shareOnFacebook}
            className="absolute top-4 right-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center"
        >
            <ShareIcon />
            Share
        </button>
    );
};
