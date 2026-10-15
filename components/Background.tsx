import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-navy-900">
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-900 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-900 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-900 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* Overlay to create depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/50 to-navy-900/80"></div>
    </div>
  );
};