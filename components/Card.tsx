
import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card?: CardType;
  isFaceDown?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const SuitIcon: React.FC<{ suit: string }> = ({ suit }) => {
  const baseClass = "text-xl";
  switch (suit) {
    case '♥': return <span className={`${baseClass} text-red-500`}>♥</span>;
    case '♦': return <span className={`${baseClass} text-red-500`}>♦</span>;
    case '♣': return <span className={`${baseClass} text-black`}>♣</span>;
    case '♠': return <span className={`${baseClass} text-black`}>♠</span>;
    default: return null;
  }
};

export const Card: React.FC<CardProps> = ({ card, isFaceDown = false, isSelected = false, onClick, className = '' }) => {
  const baseClasses = "w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-lg shadow-md flex flex-col justify-between p-2 border-2 transition-all duration-200";
  const selectedClasses = isSelected ? "ring-4 ring-blue-500 -translate-y-2" : "hover:-translate-y-1";
  const clickableClasses = onClick ? "cursor-pointer" : "";

  if (isFaceDown) {
    return (
      <div 
        onClick={onClick}
        className={`${baseClasses} ${clickableClasses} ${selectedClasses} bg-gradient-to-br from-blue-500 to-blue-700 border-blue-800 flex items-center justify-center ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-blue-400 opacity-50"></div>
      </div>
    );
  }

  if (!card) {
    return <div className={`${baseClasses} bg-black/10 border-dashed border-slate-400 ${className}`}></div>;
  }

  const isRed = card.suit === '♥' || card.suit === '♦';
  const textColor = isRed ? "text-red-500" : "text-black";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${clickableClasses} ${selectedClasses} ${textColor} border-gray-300 ${className}`}
    >
      <div className="text-left font-bold text-2xl">
        <span>{card.rank}</span>
        <SuitIcon suit={card.suit} />
      </div>
      <div className="text-center font-bold text-4xl">
        <SuitIcon suit={card.suit} />
      </div>
      <div className="text-right font-bold text-2xl transform rotate-180">
        <span>{card.rank}</span>
        <SuitIcon suit={card.suit} />
      </div>
    </div>
  );
};
