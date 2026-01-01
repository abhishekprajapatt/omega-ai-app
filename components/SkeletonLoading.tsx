'use client';
import React from 'react';

const SkeletonLoading: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-[#1a1b1e]">
      <div className="w-64 h-full bg-[#141518] border-r border-gray-800 flex flex-col">
        <div className="flex items-center p-4">
          <div className="h-8 w-32 bg-gray-700 animate-pulse rounded"></div>
        </div>
        
        <div className="px-4 py-2">
          <div className="h-10 w-full bg-gray-700 animate-pulse rounded-md"></div>
        </div>
        
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <div className="h-4 w-24 bg-gray-700 animate-pulse rounded mb-3"></div>
          
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-8 w-full bg-gray-700 animate-pulse rounded-md mb-2"></div>
          ))}
        </div>
        
        <div className="px-4 py-4">
          <div className="h-10 w-full bg-gray-700 animate-pulse rounded-md"></div>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="h-8 w-full bg-gray-700 animate-pulse rounded-md"></div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center bg-[#1a1b1e] relative">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-12 w-12 rounded-full bg-gray-700 animate-pulse"></div>
            <div className="h-12 w-64 bg-gray-700 animate-pulse rounded-md"></div>
          </div>
          
          <div className="h-5 w-80 bg-gray-700 animate-pulse rounded mb-10"></div>
        </div>
        
        <div className="absolute bottom-8 w-4/5 max-w-3xl">
          <div className="h-12 w-full bg-gray-700 animate-pulse rounded-2xl"></div>
        </div>
        
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="h-4 w-48 bg-gray-700 animate-pulse rounded-md"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoading;