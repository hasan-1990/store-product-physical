'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FolderIcon,
  FileIcon,
  UploadIcon,
  TrashIcon,
  EditIcon,
  FolderPlusIcon,
  DownloadIcon,
  XIcon,
  SearchIcon,
  ArrowLeftIcon,
  HomeIcon,
  CheckIcon,
  CopyIcon,
  MoveIcon,
  MoreVerticalIcon,
  FileTextIcon,
  FileArchiveIcon,
  ImageIcon,
  FilmIcon,
  MusicIcon
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  modified: string;
  extension?: string;
  url?: string;
  itemCount?: number;
  alt?: string; // Alt text برای تصاویر
}

interface FileManagerProps {
  onSelect?: (file: FileItem) => void;
  selectionMode?: boolean;
  allowedExtensions?: string[];
  onClose?: () => void;
}

export default function FileManager({
  onSelect,
  selectionMode = false,
  allowedExtensions = ['.zip', '.rar', '.7z', '.pdf'],
  onClose
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem } | null>(null);
  const [copiedItem, setCopiedItem] = useState<FileItem | null>(null);
  const [operationMode, setOperationMode] = useState<'copy' | 'move' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<FileItem | null>(null);
  const [showAltTextModal, setShowAltTextModal] = useState<FileItem | null>(null);
  const [altText, setAltText] = useState<string>('');

  // بارگذاری فایل‌ها
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/file-manager?folder=${currentPath}`);
      const data = await response.json();

      if (data.success) {
        setFolders(data.folders);
        setFiles(data.files);
      }
    } catch (error) {
      console.error('خطا در بارگذاری فایل‌ها:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // بستن context menu با کلیک
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // بستن toast بعد از 3 ثانیه
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // نمایش toast
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  // Drag & Drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', currentPath);

      try {
        setUploadProgress(50);
        const response = await fetch('/api/file-manager', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 1000);
          loadFiles();
          showToast('فایل با موفقیت آپلود شد', 'success');
        }
      } catch (error) {
        console.error('خطا در آپلود:', error);
        setUploadProgress(0);
        showToast('خطا در آپلود فایل', 'error');
      }
    }
  }, [currentPath, loadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true
  });

  // ایجاد پوشه جدید
  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const formData = new FormData();
    formData.append('action', 'create-folder');
    formData.append('folderName', newFolderName);
    formData.append('folder', currentPath);

    try {
      const response = await fetch('/api/file-manager', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setShowNewFolderModal(false);
        setNewFolderName('');
        loadFiles();
        showToast('پوشه با موفقیت ایجاد شد', 'success');
        // باز کردن پوشه جدید
        setTimeout(() => {
          const newFolderPath = data.folder.path;
          setCurrentPath(newFolderPath);
        }, 500);
      }
    } catch (error) {
      console.error('خطا در ایجاد پوشه:', error);
      showToast('خطا در ایجاد پوشه', 'error');
    }
  };

  // تغییر نام
  const handleRename = async (item: FileItem) => {
    if (!newName.trim() || newName === item.name) {
      setRenaming(null);
      return;
    }

    try {
      const response = await fetch('/api/file-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          oldPath: item.path,
          newName: newName
        })
      });

      const data = await response.json();
      if (data.success) {
        setRenaming(null);
        loadFiles();
        showToast('نام با موفقیت تغییر کرد', 'success');
      }
    } catch (error) {
      console.error('خطا در تغییر نام:', error);
      showToast('خطا در تغییر نام', 'error');
    }
  };

  // کپی
  const handleCopy = (item: FileItem) => {
    setCopiedItem(item);
    setOperationMode('copy');
    setContextMenu(null);
    showToast(`${item.name} کپی شد - به پوشه مقصد بروید و چسباندن را بزنید`, 'success');
  };

  // انتقال (Move)
  const handleCut = (item: FileItem) => {
    setCopiedItem(item);
    setOperationMode('move');
    setContextMenu(null);
    showToast(`${item.name} برش خورد - به پوشه مقصد بروید و چسباندن را بزنید`, 'warning');
  };

  // چسباندن (Paste)
  const handlePaste = async () => {
    if (!copiedItem || !operationMode) return;

    try {
      const response = await fetch('/api/file-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: operationMode,
          oldPath: copiedItem.path,
          targetPath: currentPath,
          newName: copiedItem.name // اضافه کردن نام فایل
        })
      });

      const data = await response.json();
      if (data.success) {
        const actionText = operationMode === 'copy' ? 'کپی' : 'انتقال';
        showToast(`${copiedItem.name} با موفقیت ${actionText} شد`, 'success');
        setCopiedItem(null);
        setOperationMode(null);
        loadFiles();
      } else {
        showToast(data.error || 'خطا در عملیات', 'error');
      }
    } catch (error) {
      console.error('خطا در چسباندن:', error);
      showToast('خطا در چسباندن', 'error');
    }
  };

  // حذف
  const handleDelete = async (item: FileItem) => {
    setShowDeleteModal(item);
  };

  const confirmDelete = async () => {
    if (!showDeleteModal) return;

    try {
      const response = await fetch(`/api/file-manager?path=${encodeURIComponent(showDeleteModal.path)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        showToast(`${showDeleteModal.name} با موفقیت حذف شد`, 'success');
        setShowDeleteModal(null);
        loadFiles();
      } else {
        showToast(data.error || 'خطا در حذف', 'error');
      }
    } catch (error) {
      console.error('خطا در حذف:', error);
      showToast('خطا در حذف', 'error');
    }
  };

  // باز کردن پوشه
  const openFolder = (folder: FileItem) => {
    setCurrentPath(folder.path);
  };

  // بازگشت به پوشه قبلی
  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  // فیلتر کردن بر اساس جستجو
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // فرمت سایز فایل
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // آیکون فایل بر اساس نوع
  const getFileIcon = (extension?: string) => {
    if (!extension) return <FileIcon className="w-full h-full" />;
    
    const ext = extension.toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
      return <ImageIcon className="w-full h-full text-purple-500" />;
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
      return <FileArchiveIcon className="w-full h-full text-orange-500" />;
    }
    if (['.mp4', '.avi', '.mkv', '.mov'].includes(ext)) {
      return <FilmIcon className="w-full h-full text-red-500" />;
    }
    if (['.mp3', '.wav', '.flac', '.ogg'].includes(ext)) {
      return <MusicIcon className="w-full h-full text-pink-500" />;
    }
    if (['.pdf', '.doc', '.docx', '.txt'].includes(ext)) {
      return <FileTextIcon className="w-full h-full text-blue-500" />;
    }
    return <FileIcon className="w-full h-full text-gray-500" />;
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header با گرادیانت */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {copiedItem && (
              <button
                onClick={handlePaste}
                className="px-4 py-2.5 bg-green-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-green-600 flex items-center gap-2 transition-all duration-200 animate-pulse"
              >
                {operationMode === 'copy' ? <CopyIcon className="w-5 h-5" /> : <MoveIcon className="w-5 h-5" />}
                چسباندن
              </button>
            )}
            
            <label className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105">
              <UploadIcon className="w-5 h-5" />
              <span className="hidden md:inline">آپلود فایل</span>
              <input {...getInputProps()} style={{ display: 'none' }} />
            </label>

            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <FolderPlusIcon className="w-5 h-5" />
              <span className="hidden md:inline">پوشه جدید</span>
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FolderIcon className="w-7 h-7" />
            </div>
            مدیریت فایل‌ها
          </h2>

          {/* Close Button - فقط در حالت modal */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all duration-200 hover:scale-110"
              title="بستن"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <button
            onClick={() => setCurrentPath('')}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
            title="صفحه اصلی"
          >
            <HomeIcon className="w-5 h-5 text-white" />
          </button>
          
          {currentPath && (
            <button
              onClick={goBack}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
              title="بازگشت"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white" />
            </button>
          )}
          
          <div className="flex-1 text-white font-medium truncate">
            / {currentPath || 'ریشه'}
          </div>

          {/* Search */}
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی فایل..."
              className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-gray-200 focus:ring-2 focus:ring-white/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-lg p-2">
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div
        {...getRootProps()}
        className={`p-6 overflow-y-auto transition-all duration-200 ${isDragActive ? 'bg-blue-50/50 dark:bg-blue-900/20 ring-4 ring-blue-400 ring-inset' : ''}`}
        style={{ height: 'calc(100% - 220px)', minHeight: '400px' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-gray-500 mt-4">در حال بارگذاری...</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10 gap-2">
            {/* Folders */}
            {filteredFolders.map((folder) => (
              <div
                key={folder.path}
                onDoubleClick={() => openFolder(folder)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, item: folder });
                }}
                className={`group relative p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedItem?.path === folder.path
                    ? 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 ring-2 ring-indigo-400'
                    : 'bg-white dark:bg-gray-800 hover:shadow-xl'
                }`}
                onClick={() => setSelectedItem(folder)}
              >
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <FolderIcon className="w-10 h-10 text-yellow-500 drop-shadow-lg" />
                    {folder.itemCount && folder.itemCount > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 bg-indigo-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px]">
                        {folder.itemCount}
                      </div>
                    )}
                  </div>
                  
                  {renaming === folder.path ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => handleRename(folder)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(folder)}
                      className="mt-1.5 w-full px-1.5 py-0.5 border rounded text-[11px] text-center"
                      autoFocus
                    />
                  ) : (
                    <div className="mt-1.5 font-medium text-[11px] text-gray-900 dark:text-white truncate w-full text-center" title={folder.name}>
                      {folder.name}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, item: folder });
                    }}
                    className="p-0.5 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <MoreVerticalIcon className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Files */}
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, item: file });
                }}
                className={`group relative p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedItem?.path === file.path
                    ? 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 ring-2 ring-blue-400'
                    : 'bg-white dark:bg-gray-800 hover:shadow-xl'
                }`}
                onClick={() => setSelectedItem(file)}
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 flex items-center justify-center">
                    {getFileIcon(file.extension)}
                  </div>
                  
                  {renaming === file.path ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => handleRename(file)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(file)}
                      className="mt-1.5 w-full px-1.5 py-0.5 border rounded text-[11px] text-center"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="mt-1.5 font-medium text-[11px] text-gray-900 dark:text-white truncate w-full text-center" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        {formatSize(file.size)}
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                  {selectionMode && onSelect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // اگر فایل تصویر است، مودال Alt Text را نمایش بده
                        const isImage = file.extension && ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(file.extension.toLowerCase());
                        if (isImage) {
                          setShowAltTextModal(file);
                          setAltText('');
                        } else {
                          onSelect(file);
                        }
                      }}
                      className="p-0.5 bg-green-500 text-white rounded shadow hover:bg-green-600"
                    >
                      <CheckIcon className="w-2.5 h-2.5" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, item: file });
                    }}
                    className="p-0.5 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <MoreVerticalIcon className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredFiles.length === 0 && filteredFolders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FolderIcon className="w-24 h-24 mb-4 opacity-30" />
            <p className="text-lg">هیچ فایلی وجود ندارد</p>
            <p className="text-sm mt-2">فایل‌های خود را اینجا بکشید یا آپلود کنید</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setRenaming(contextMenu.item.path);
              setNewName(contextMenu.item.name);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <EditIcon className="w-4 h-4" />
            تغییر نام
          </button>

          <button
            onClick={() => handleCopy(contextMenu.item)}
            className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <CopyIcon className="w-4 h-4" />
            کپی
          </button>

          <button
            onClick={() => handleCut(contextMenu.item)}
            className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <MoveIcon className="w-4 h-4" />
            برش
          </button>

          {contextMenu.item.type === 'file' && (
            <a
              href={contextMenu.item.url}
              download
              className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
              onClick={() => setContextMenu(null)}
            >
              <DownloadIcon className="w-4 h-4" />
              دانلود
            </a>
          )}

          <hr className="my-2 border-gray-200 dark:border-gray-700" />

          <button
            onClick={() => {
              handleDelete(contextMenu.item);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-right hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-3"
          >
            <TrashIcon className="w-4 h-4" />
            حذف
          </button>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNewFolderModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">ایجاد پوشه جدید</h3>
              <button onClick={() => setShowNewFolderModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              placeholder="نام پوشه..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                انصراف
              </button>
              <button
                onClick={createFolder}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                ایجاد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <TrashIcon className="w-6 h-6" />
                تأیید حذف
              </h3>
              <button onClick={() => setShowDeleteModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              آیا از حذف <span className="font-bold text-gray-900 dark:text-white">"{showDeleteModal.name}"</span> اطمینان دارید؟
              {showDeleteModal.type === 'folder' && (
                <span className="block text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ تمام فایل‌های داخل این پوشه نیز حذف خواهند شد!
                </span>
              )}
            </p>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                انصراف
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alt Text Modal برای تصاویر */}
      {showAltTextModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAltTextModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-purple-500" />
                افزودن Alt Text به تصویر
              </h3>
              <button onClick={() => setShowAltTextModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* پیش‌نمایش تصویر */}
            <div className="mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex justify-center">
              <img
                src={showAltTextModal.url}
                alt="پیش‌نمایش"
                className="max-h-48 rounded-lg shadow-lg object-contain"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نام فایل: <span className="font-bold text-gray-900 dark:text-white">{showAltTextModal.name}</span>
              </label>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alt Text (متن جایگزین تصویر)
                <span className="text-red-500 mr-1">*</span>
              </label>
              <textarea
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="مثال: افزونه گلایدر المنتور - نمایش رابط کاربری اصلی"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white min-h-[100px] resize-y"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 Alt Text برای SEO و دسترسی‌پذیری اهمیت دارد. توضیح مختصر و مفیدی از تصویر بنویسید.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAltTextModal(null);
                  setAltText('');
                }}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  if (!altText.trim()) {
                    showToast('لطفاً Alt Text را وارد کنید', 'warning');
                    return;
                  }
                  if (onSelect && showAltTextModal) {
                    // اضافه کردن alt text به فایل
                    const fileWithAlt = {
                      ...showAltTextModal,
                      alt: altText.trim()
                    };
                    onSelect(fileWithAlt);
                    setShowAltTextModal(null);
                    setAltText('');
                  }
                }}
                disabled={!altText.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ تایید و انتخاب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm ${
            toast.type === 'success' ? 'bg-green-500/90 text-white' :
            toast.type === 'error' ? 'bg-red-500/90 text-white' :
            'bg-amber-500/90 text-white'
          }`}>
            {toast.type === 'success' && <CheckIcon className="w-5 h-5" />}
            {toast.type === 'error' && <XIcon className="w-5 h-5" />}
            {toast.type === 'warning' && <MoveIcon className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-all"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
