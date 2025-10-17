
import React from 'react';

interface SuggestionPillProps {
  text: string;
  onClick: () => void;
  disabled: boolean;
}

const SuggestionPill: React.FC<SuggestionPillProps> = ({ text, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-gray-800 border border-gray-700 text-sm text-gray-300 px-3 py-1 rounded-full hover:bg-purple-900/50 hover:border-purple-700 hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800 disabled:hover:text-gray-300"
    >
      {text}
    </button>
  );
};

export default SuggestionPill;
