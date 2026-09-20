'use client';

import { useState } from 'react';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  modified: string;
  extension?: string;
  url?: string;
}

export function useFileManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const openFileManager = () => setIsOpen(true);
  const closeFileManager = () => setIsOpen(false);

  const selectFile = (file: FileItem) => {
    setSelectedFile(file);
    setIsOpen(false);
  };

  return {
    isOpen,
    selectedFile,
    openFileManager,
    closeFileManager,
    selectFile
  };
}
