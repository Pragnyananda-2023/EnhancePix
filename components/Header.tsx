
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/70 backdrop-blur-md sticky top-0 z-10 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
          EnhancePix
        </h1>
        <p className="text-center text-gray-400 mt-1">AI-Powered Photo Magic</p>
      </div>
    </header>
  );
};

export default Header;
