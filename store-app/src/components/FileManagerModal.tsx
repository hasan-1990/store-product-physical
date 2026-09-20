'use client';

import React from 'react';
import { XIcon } from 'lucide-react';
import FileManager from './FileManager';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  modified: string;
  extension?: string;
  url?: string;
  alt?: string; // Alt text برای تصاویر
}

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: FileItem) => void;
  allowedExtensions?: string[];
}

export default function FileManagerModal({
  isOpen,
  onClose,
  onSelect,
  allowedExtensions
}: FileManagerModalProps) {
  console.log('📂 FileManagerModal - isOpen:', isOpen);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto" 
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col my-4" 
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* File Manager */}
        <div className="flex-1 overflow-hidden">
          <FileManager
            onSelect={(file) => {
              onSelect(file);
              onClose();
            }}
            selectionMode={true}
            allowedExtensions={allowedExtensions}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
