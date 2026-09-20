'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ProductGalleryModal from './ProductGalleryModal';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = '', className = '' }: RichTextEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkData, setLinkData] = useState({ text: '', url: '' });
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showImageModal || showLinkModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [showImageModal, showLinkModal]);

  // Get current selection position
  const getSelectionPosition = () => {
    if (!textareaRef.current) return { start: 0, end: 0 };
    return {
      start: textareaRef.current.selectionStart || 0,
      end: textareaRef.current.selectionEnd || 0
    };
  };

  // Insert text at cursor position
  const insertText = (text: string, replace = false) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    
    const before = value.substring(0, start);
    const after = value.substring(replace ? end : start);
    const newValue = before + text + after;
    
    onChange(newValue);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + text.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 10);
  };

  // Format text functions
  const makeTextBold = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    
    if (selectedText && start !== end) {
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + `**${selectedText}**` + after;
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + 2, start + 2 + selectedText.length);
          textareaRef.current.focus();
        }
      }, 10);
    }
  };

  const makeTextItalic = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    
    if (selectedText && start !== end) {
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + `*${selectedText}*` + after;
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start + 1, start + 1 + selectedText.length);
          textareaRef.current.focus();
        }
      }, 10);
    }
  };

  const addHeader = (level: number) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    const hashes = '#'.repeat(level);
    
    if (selectedText && start !== end) {
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + `${hashes} ${selectedText}` + after;
      onChange(newValue);
    } else {
      // Find start of current line
      const beforeCursor = value.substring(0, start);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine = value.substring(lineStart);
      const lineEnd = currentLine.indexOf('\n');
      const actualLineEnd = lineEnd === -1 ? value.length : lineStart + lineEnd;
      
      const before = value.substring(0, lineStart);
      const after = value.substring(actualLineEnd);
      const lineContent = value.substring(lineStart, actualLineEnd);
      
      const newValue = before + `${hashes} ${lineContent}` + after;
      onChange(newValue);
    }
  };

  const addList = (ordered = false) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    
    if (selectedText && start !== end) {
      const lines = selectedText.split('\n');
      const listItems = lines.map((line, index) => {
        if (line.trim()) {
          const bullet = ordered ? `${index + 1}. ` : '- ';
          return `${bullet}${line.trim()}`;
        }
        return line;
      }).join('\n');
      
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + listItems + after;
      onChange(newValue);
    } else {
      // Add bullet to current line
      const beforeCursor = value.substring(0, start);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const bullet = ordered ? '1. ' : '- ';
      
      const before = value.substring(0, lineStart);
      const after = value.substring(lineStart);
      const newValue = before + bullet + after;
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(lineStart + bullet.length, lineStart + bullet.length);
          textareaRef.current.focus();
        }
      }, 10);
    }
  };

  const addQuote = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    
    if (selectedText && start !== end) {
      const lines = selectedText.split('\n');
      const quotedLines = lines.map(line => `> ${line}`).join('\n');
      
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + quotedLines + after;
      onChange(newValue);
    } else {
      const beforeCursor = value.substring(0, start);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      
      const before = value.substring(0, lineStart);
      const after = value.substring(lineStart);
      const newValue = before + '> ' + after;
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(lineStart + 2, lineStart + 2);
          textareaRef.current.focus();
        }
      }, 10);
    }
  };

  const addCode = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    
    if (selectedText && start !== end) {
      const before = value.substring(0, start);
      const after = value.substring(end);
      
      let newValue;
      if (selectedText.includes('\n')) {
        // Multi-line code block
        newValue = before + `\`\`\`\n${selectedText}\n\`\`\`` + after;
      } else {
        // Inline code
        newValue = before + `\`${selectedText}\`` + after;
      }
      onChange(newValue);
    }
  };

  const setTextAlign = (align: 'left' | 'center' | 'right') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const selectedText = value.substring(start, end);
    
    if (selectedText && start !== end) {
      const alignTag = align === 'right' ? '<div style="text-align: right;">' : 
                       align === 'center' ? '<div style="text-align: center;">' : 
                       '<div style="text-align: left;">';
      
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + `${alignTag}\n${selectedText}\n</div>` + after;
      onChange(newValue);
    }
  };

  // Link functions
  const showLinkDialog = () => {
    const selectedText = value.substring(getSelectionPosition().start, getSelectionPosition().end);
    setLinkData({ text: selectedText || 'متن لینک', url: '' });
    setShowLinkModal(true);
  };

  const insertLink = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    
    const linkMarkdown = `[${linkData.text}](${linkData.url})`;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newValue = before + linkMarkdown + after;
    
    onChange(newValue);
    setShowLinkModal(false);
    setLinkData({ text: '', url: '' });
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + linkMarkdown.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 10);
  };

  // Image functions
  const showImageDialog = () => {
    setShowImageModal(true);
    setSelectedImageUrl('');
  };

  const insertSelectedImage = (url?: string) => {
    if (!textareaRef.current) return;

    const confirmedUrl = url || selectedImageUrl;
    if (!confirmedUrl) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;

    const imageMarkdown = `![تصویر](${confirmedUrl})`;
    const before = value.substring(0, start);
    const after = value.substring(start);
    const newValue = before + imageMarkdown + after;

    onChange(newValue);
    setShowImageModal(false);
    setSelectedImageUrl('');

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + imageMarkdown.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 10);
  };

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="bg-gray-800/80 border border-gray-600 rounded-t-lg p-3 flex flex-wrap items-center gap-2">
        {/* Edit/Preview Toggle */}
        <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              !showPreview 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            ویرایش
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              showPreview 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            پیش‌نمایش
          </button>
        </div>

        {/* Text Formatting - Only show in edit mode */}
        {!showPreview && (
          <>
        <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
          <button
            type="button"
            onClick={makeTextBold}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="پررنگ (Bold)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.54 8.5c.31-.78.31-1.63 0-2.41A3.5 3.5 0 0 0 9 3H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5.5a3.5 3.5 0 0 0 2.96-5.34A3.5 3.5 0 0 0 12.54 8.5zM6 5h3a1.5 1.5 0 0 1 0 3H6V5zm3.5 10H6v-4h3.5a1.5 1.5 0 0 1 0 3z"/>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={makeTextItalic}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="کج (Italic)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 3a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2h-2.25l-3.5 12H11a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2h2.25l3.5-12H9a1 1 0 0 1-1-1z"/>
            </svg>
          </button>
        </div>

        {/* Headers */}
        <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
          <button
            type="button"
            onClick={() => addHeader(1)}
            className="px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="سرتیتر 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => addHeader(2)}
            className="px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="سرتیتر 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => addHeader(3)}
            className="px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="سرتیتر 3"
          >
            H3
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
          <button
            type="button"
            onClick={() => setTextAlign('right')}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="تراز راست"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('center')}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="تراز وسط"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm2 4a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm-2 4a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm2 4a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('left')}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="تراز چپ"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1z"/>
            </svg>
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
          <button
            type="button"
            onClick={() => addList(false)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="لیست نقطه‌ای"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM8 6a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1zM4 12a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM4 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => addList(true)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="لیست شماره‌دار"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zM3 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1zM3 16a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-1zM8 6a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1z"/>
            </svg>
          </button>
        </div>

        {/* Other Elements */}
        <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
          <button
            type="button"
            onClick={addQuote}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="نقل قول"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.5 10c-1.81 0-3.5-1.69-3.5-4s1.69-4 3.5-4 3.5 1.69 3.5 4-1.69 4-3.5 4zm0-6c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm7 6c-1.81 0-3.5-1.69-3.5-4s1.69-4 3.5-4 3.5 1.69 3.5 4-1.69 4-3.5 4zm0-6c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={addCode}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="بلوک کد"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={showLinkDialog}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="افزودن لینک"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={showImageDialog}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="افزودن تصویر"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
          </button>
        </div>
          </>
        )}
      </div>

      {/* Text Area */}
      {/* Content Area */}
      {showPreview ? (
        <div className="w-full min-h-[400px] px-4 py-3 bg-gray-900/50 border-x border-b border-gray-600 rounded-b-lg text-white prose prose-invert max-w-none overflow-auto">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({children}) => <h1 className="text-3xl font-bold mb-4 text-white">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-bold mb-3 text-white">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-bold mb-2 text-white">{children}</h3>,
              h4: ({children}) => <h4 className="text-lg font-bold mb-2 text-white">{children}</h4>,
              h5: ({children}) => <h5 className="text-base font-bold mb-1 text-white">{children}</h5>,
              h6: ({children}) => <h6 className="text-sm font-bold mb-1 text-white">{children}</h6>,
              p: ({children}) => <p className="mb-3 text-gray-200 leading-relaxed">{children}</p>,
              strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
              em: ({children}) => <em className="italic text-gray-200">{children}</em>,
              ul: ({children}) => <ul className="list-disc list-inside mb-3 text-gray-200">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside mb-3 text-gray-200">{children}</ol>,
              li: ({children}) => <li className="mb-1">{children}</li>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 mb-3">{children}</blockquote>,
              code: ({children}) => <code className="bg-gray-800 px-2 py-1 rounded text-green-400 font-mono text-sm">{children}</code>,
              pre: ({children}) => <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto mb-3 border border-gray-600">{children}</pre>,
              img: ({src, alt}) => (
                <img 
                  src={src} 
                  alt={alt} 
                  className="max-w-full h-auto rounded-lg shadow-lg mb-3" 
                  loading="lazy"
                  decoding="async"
                  style={{ 
                    imageRendering: 'crisp-edges' as any,
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale'
                  }}
                />
              ),
              a: ({href, children}) => <a href={href} className="text-purple-400 hover:text-purple-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
            }}
          >
            {value || 'هیچ محتوایی وارد نشده است...'}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[400px] px-4 py-3 bg-gray-900/50 border-x border-b border-gray-600 rounded-b-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none font-mono"
          style={{ direction: 'rtl' }}
        />
      )}

      {/* Link Modal */}
      {showLinkModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">افزودن لینک</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    متن لینک
                  </label>
                  <input
                    type="text"
                    value={linkData.text}
                    onChange={(e) => setLinkData(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="متن قابل کلیک"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    آدرس لینک
                  </label>
                  <input
                    type="url"
                    value={linkData.url}
                    onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                لغو
              </button>
              <button
                onClick={insertLink}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                افزودن لینک
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Gallery */}
      <ProductGalleryModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImageUrl('');
        }}
        title="انتخاب تصویر"
        source="admin"
        allowMultiple={false}
        selectedImage={selectedImageUrl}
        onSelectImage={(url) => setSelectedImageUrl(url)}
        onConfirm={(url) => {
          insertSelectedImage(url);
        }}
      />
    </div>
  );
}