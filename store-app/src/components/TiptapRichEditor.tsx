'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import SharedImageGallery from './SharedImageGallery';

// Custom fontSize extension
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    readMoreSeparator: {
      insertReadMoreSeparator: () => ReturnType;
      toggleReadMoreSeparator: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

const ImageComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const [isSelected, setIsSelected] = useState(false);
  
  const getWrapperClass = () => {
    if (node.attrs.align === 'center') return 'flex justify-center my-6';
    if (node.attrs.align === 'right') return 'float-right mr-0 ml-6 mb-4';
    if (node.attrs.align === 'left') return 'float-left ml-0 mr-6 mb-4';
    return '';
  };
  
  return (
    <NodeViewWrapper className={'relative group ' + getWrapperClass()}>
      <div className="relative inline-block" style={{ maxWidth: '100%' }} onClick={() => setIsSelected(true)} onBlur={() => setIsSelected(false)}>
        <div className="relative overflow-hidden rounded-lg">
          <img 
            src={node.attrs.src} 
            alt={node.attrs.alt || ''} 
            style={{ 
              width: node.attrs.width ? node.attrs.width + 'px' : 'auto', 
              maxWidth: '100%', 
              height: node.attrs.hasReadMore ? '400px' : 'auto',
              objectFit: node.attrs.hasReadMore ? 'cover' : 'contain',
              // وقتی حالت ادامه مطلب فعال است، کادر 200px داریم و cover باعث کات می‌شود.
              // طبق درخواست: کات از ابتدای عکس (بالا) شروع شود، نه از وسط.
              objectPosition: node.attrs.hasReadMore ? '50% 0%' : '50% 50%'
            }} 
            className={'rounded-lg ' + (isSelected ? 'ring-2 ring-purple-500' : '')} 
          />
          {node.attrs.hasReadMore && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none">
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                <div className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2 cursor-pointer transition-all">
                  <span>مشاهده بیشتر</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
        {isSelected && (
          <div className="absolute top-2 left-2 bg-black/80 rounded-md p-1 flex gap-1 z-10">
            <button onClick={() => updateAttributes({ align: 'left' })} className={'p-1 text-white text-xs rounded ' + (node.attrs.align === 'left' ? 'bg-purple-600' : 'hover:bg-gray-700')} title="چپ">←</button>
            <button onClick={() => updateAttributes({ align: 'center' })} className={'p-1 text-white text-xs rounded ' + (node.attrs.align === 'center' ? 'bg-purple-600' : 'hover:bg-gray-700')} title="وسط">↔</button>
            <button onClick={() => updateAttributes({ align: 'right' })} className={'p-1 text-white text-xs rounded ' + (node.attrs.align === 'right' ? 'bg-purple-600' : 'hover:bg-gray-700')} title="راست">→</button>
            <div className="w-px h-full bg-gray-600 mx-1"></div>
            <button onClick={() => updateAttributes({ width: Math.max(100, (node.attrs.width || 300) - 50) })} className="p-1 text-white text-sm font-bold rounded hover:bg-gray-700" title="کوچکتر">−</button>
            <button onClick={() => updateAttributes({ width: Math.min(1400, (node.attrs.width || 300) + 50) })} className="p-1 text-white text-sm font-bold rounded hover:bg-gray-700" title="بزرگتر">+</button>
            <div className="w-px h-full bg-gray-600 mx-1"></div>
            <button 
              onClick={() => updateAttributes({ hasReadMore: !node.attrs.hasReadMore })} 
              className={'p-1 text-white text-xs rounded ' + (node.attrs.hasReadMore ? 'bg-purple-600' : 'hover:bg-gray-700')} 
              title={node.attrs.hasReadMore ? 'حذف ادامه مطلب' : 'افزودن ادامه مطلب'}
            >
              {node.attrs.hasReadMore ? '📖' : '📄'}
            </button>
            <div className="w-px h-full bg-gray-600 mx-1"></div>
            <button onClick={(e) => { e.stopPropagation(); deleteNode(); }} className="p-1 text-red-400 text-xs rounded hover:bg-red-900" title="حذف">×</button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

const CustomImage = Node.create({
  name: 'customImage',
  group: 'block',
  atom: true,
  addAttributes() {
    return { 
      src: { default: null }, 
      alt: { default: null }, 
      width: { default: 400 }, 
      align: { default: 'center' },
      hasReadMore: { default: false }
    };
  },
  parseHTML() {
    return [
      { tag: 'img[src]' },
      { tag: 'div[data-has-read-more]' }
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const { hasReadMore, align, width } = node.attrs;
    
    // اضافه کردن attributes به img
    const imgAttrs = mergeAttributes(HTMLAttributes, {
      'data-has-read-more': hasReadMore ? 'true' : undefined,
      'data-align': align || 'center',
      'data-width': width || 400,
      style: hasReadMore 
        ? `height: 200px; width: 100%; max-width: ${width || 400}px; object-fit: cover; object-position: 50% 0%; display: block;`
        : `width: ${width || 400}px; max-width: 100%; height: auto;`
    });
    
    return ['img', imgAttrs];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});

// Read More Separator Component
const ReadMoreSeparatorComponent = ({ deleteNode }: any) => {
  return (
    <NodeViewWrapper className="relative my-6 group">
      <div className="relative">
        <div 
          className="h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          style={{ margin: '20px 0' }}
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-gray-800 px-4 py-1 border border-purple-500 rounded text-purple-400 text-xs font-semibold flex items-center gap-2">
            <span>مشاهده بیشتر</span>
            <button
              onClick={deleteNode}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
              title="حذف"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// Read More Separator Extension
const ReadMoreSeparator = Node.create({
  name: 'readMoreSeparator',
  group: 'block',
  atom: true,
  
  parseHTML() {
    return [
      { tag: 'div[data-read-more-separator]' },
      { tag: 'span[data-read-more-separator]' },
      { tag: 'hr.read-more-separator' }
    ];
  },
  
  renderHTML() {
    // در خروجی نهایی، فقط یک marker متنی ذخیره می‌کنیم
    return ['span', {
      'data-read-more-separator': 'true',
      'class': 'read-more-marker',
      'style': 'display: none;'
    }, '[read-more]'];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ReadMoreSeparatorComponent);
  },
  
  addCommands() {
    return {
      insertReadMoreSeparator: () => ({ commands }: { commands: any }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
      toggleReadMoreSeparator: () => ({ state, commands, chain }: { state: any; commands: any; chain: any }) => {
        // بررسی اینکه آیا در داکیومنت separator وجود دارد
        let hasReadMoreSeparator = false;
        let separatorPos: number | null = null;

        state.doc.descendants((node: any, pos: number) => {
          if (node.type.name === 'readMoreSeparator') {
            hasReadMoreSeparator = true;
            separatorPos = pos;
            return false; // توقف جستجو
          }
        });

        if (hasReadMoreSeparator && separatorPos !== null) {
          // اگر separator موجود است، آن را حذف کن
          return chain()
            .focus()
            .deleteRange({ from: separatorPos, to: separatorPos + 1 })
            .run();
        } else {
          // اگر separator موجود نیست، آن را اضافه کن
          return commands.insertContent({
            type: this.name,
          });
        }
      },
    };
  },
});

interface TiptapRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showImageAltModal, setShowImageAltModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [pendingImageUrl, setPendingImageUrl] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  if (!editor) return null;
  const addLink = () => {
    if (!linkUrl) return;
    if (linkText && !editor.state.selection.empty) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else if (linkText) {
      editor.chain().focus().insertContent('<a href="' + linkUrl + '">' + linkText + '</a>').run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };
  const removeLink = () => editor.chain().focus().unsetLink().run();
  const handleImageSelect = (imageUrl: string) => {
    setPendingImageUrl(imageUrl);
  };

  const confirmImageSelection = (imageUrl?: string) => {
    const urlToUse = imageUrl || pendingImageUrl;
    if (!urlToUse) return;
    if (editor) {
      editor.commands.insertContent({ type: 'customImage', attrs: { src: urlToUse, alt: 'تصویر', width: 400, align: 'center' } });
    }
    setPendingImageUrl('');
    setShowImageGallery(false);
  };
  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href;
    const selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, '');
    setLinkUrl(previousUrl || '');
    setLinkText(selectedText || '');
    setShowLinkModal(true);
  };
  
  // بررسی وجود Read More Separator در محتوا
  const hasReadMoreSeparator = () => {
    let found = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'readMoreSeparator') {
        found = true;
        return false;
      }
    });
    return found;
  };
  
  const isLinkActive = editor.isActive('link');
  return (
    <>
      <div className="sticky top-0 z-50 flex flex-wrap items-center gap-1 p-2 bg-slate-900 backdrop-blur-md border-b border-purple-500/20 shadow-lg" dir="rtl">
        <button type="button" onClick={() => { console.log('Bold clicked, active:', editor.isActive('bold')); editor.chain().focus().toggleBold().run(); console.log('After bold:', editor.isActive('bold')); }} className={'p-2 rounded transition-colors ' + (editor.isActive('bold') ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="درشت"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 4v12h4.5a3.5 3.5 0 002.5-6 3.5 3.5 0 00-1-6.5H6zm2 2h3a1.5 1.5 0 010 3H8V6zm0 5h4a1.5 1.5 0 010 3H8v-3z"/></svg></button>
        <button type="button" onClick={() => { console.log('Italic clicked'); editor.chain().focus().toggleItalic().run(); }} className={'p-2 rounded transition-colors ' + (editor.isActive('italic') ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="کج"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 4h4v2h-1.5l-2 8H12v2H8v-2h1.5l2-8H10V4z"/></svg></button>
        <button type="button" onClick={() => { console.log('Underline clicked'); editor.chain().focus().toggleUnderline().run(); }} className={'p-2 rounded transition-colors ' + (editor.isActive('underline') ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="زیرخط"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 3v7a4 4 0 008 0V3h-2v7a2 2 0 01-4 0V3H6zm-2 14h12v2H4v-2z"/></svg></button>
        <div className="relative">
          <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="p-2 rounded transition-colors text-gray-300 hover:text-white hover:bg-gray-700 relative" title="رنگ متن">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4zm2 2a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
            <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#e5e7eb' }}></div>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl z-50 p-4 w-72 max-h-96 overflow-y-auto" onMouseLeave={() => setShowColorPicker(false)}>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">رنگ‌های پایه</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff'].map(color => (
                    <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className={'w-7 h-7 rounded border-2 transition-all hover:scale-110 ' + (editor.getAttributes('textStyle').color === color ? 'border-white ring-2 ring-purple-500' : 'border-gray-600')} style={{ backgroundColor: color }} title={color}></button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">رنگ‌های قرمز تا نارنجی</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#7f1d1d', '#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fee2e2', '#fef2f2'].map(color => (
                    <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className={'w-7 h-7 rounded border-2 transition-all hover:scale-110 ' + (editor.getAttributes('textStyle').color === color ? 'border-white ring-2 ring-purple-500' : 'border-gray-600')} style={{ backgroundColor: color }} title={color}></button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">رنگ‌های نارنجی تا زرد</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#7c2d12', '#9a3412', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'].map(color => (
                    <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className={'w-7 h-7 rounded border-2 transition-all hover:scale-110 ' + (editor.getAttributes('textStyle').color === color ? 'border-white ring-2 ring-purple-500' : 'border-gray-600')} style={{ backgroundColor: color }} title={color}></button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">رنگ‌های زرد تا سبز</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#713f12', '#854d0e', '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a', '#fef9c3'].map(color => (
                    <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className={'w-7 h-7 rounded border-2 transition-all hover:scale-110 ' + (editor.getAttributes('textStyle').color === color ? 'border-white ring-2 ring-purple-500' : 'border-gray-600')} style={{ backgroundColor: color }} title={color}></button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">رنگ‌های سبز</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#14532d', '#166534', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'].map(color => (
                    <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className={'w-7 h-7 rounded border-2 transition-all hover:scale-110 ' + (editor.getAttributes('textStyle').color === color ? 'border-white ring-2 ring-purple-500' : 'border-gray-600')} style={{ backgroundColor: color }} title={color}></button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">رنگ‌های آبی</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'].map(color => (
                    <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className={'w-7 h-7 rounded border-2 transition-all hover:scale-110 ' + (editor.getAttributes('textStyle').color === color ? 'border-white ring-2 ring-purple-500' : 'border-gray-600')} style={{ backgroundColor: color }} title={color}></button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">رنگ‌های بنفش و صورتی</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#581c87', '#6b21a8', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'].map(color => (
                    <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className={'w-7 h-7 rounded border-2 transition-all hover:scale-110 ' + (editor.getAttributes('textStyle').color === color ? 'border-white ring-2 ring-purple-500' : 'border-gray-600')} style={{ backgroundColor: color }} title={color}></button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">رنگ‌های صورتی</div>
                <div className="grid grid-cols-8 gap-2">
                  {['#831843', '#9f1239', '#db2777', '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3'].map(color => (
                    <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} className={'w-7 h-7 rounded border-2 transition-all hover:scale-110 ' + (editor.getAttributes('textStyle').color === color ? 'border-white ring-2 ring-purple-500' : 'border-gray-600')} style={{ backgroundColor: color }} title={color}></button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }} className="w-full px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors mt-2">حذف رنگ</button>
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <div className="relative">
          <button type="button" onClick={() => setShowFontSizeMenu(!showFontSizeMenu)} className="p-2 rounded transition-colors text-gray-300 hover:text-white hover:bg-gray-700 relative" title="اندازه متن">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 4a1 1 0 011-1h3a1 1 0 110 2H5v10h1a1 1 0 110 2H3a1 1 0 110-2h1V5H3a1 1 0 01-1-1zm8 0a1 1 0 011-1h6a1 1 0 110 2h-2v10h1a1 1 0 110 2h-4a1 1 0 110-2h1V5h-2a1 1 0 01-1-1z"/></svg>
          </button>
          {showFontSizeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl z-50 min-w-[140px]" onMouseLeave={() => setShowFontSizeMenu(false)}>
              <button type="button" onClick={() => { editor.chain().focus().setFontSize('0.75rem').run(); setShowFontSizeMenu(false); }} className="w-full px-4 py-2 text-right hover:bg-purple-600 transition-colors rounded-t-lg text-gray-300" style={{ fontSize: '0.75rem' }}>خیلی کوچک</button>
              <button type="button" onClick={() => { editor.chain().focus().setFontSize('0.875rem').run(); setShowFontSizeMenu(false); }} className="w-full px-4 py-2 text-right hover:bg-purple-600 transition-colors text-gray-300" style={{ fontSize: '0.875rem' }}>کوچک</button>
              <button type="button" onClick={() => { editor.chain().focus().setFontSize('1rem').run(); setShowFontSizeMenu(false); }} className="w-full px-4 py-2 text-right hover:bg-purple-600 transition-colors text-gray-300" style={{ fontSize: '1rem' }}>معمولی</button>
              <button type="button" onClick={() => { editor.chain().focus().setFontSize('1.25rem').run(); setShowFontSizeMenu(false); }} className="w-full px-4 py-2 text-right hover:bg-purple-600 transition-colors text-gray-300" style={{ fontSize: '1.25rem' }}>بزرگ</button>
              <button type="button" onClick={() => { editor.chain().focus().setFontSize('1.5rem').run(); setShowFontSizeMenu(false); }} className="w-full px-4 py-2 text-right hover:bg-purple-600 transition-colors text-gray-300" style={{ fontSize: '1.5rem' }}>خیلی بزرگ</button>
              <button type="button" onClick={() => { editor.chain().focus().setFontSize('2rem').run(); setShowFontSizeMenu(false); }} className="w-full px-4 py-2 text-right hover:bg-purple-600 transition-colors text-gray-300" style={{ fontSize: '2rem' }}>عظیم</button>
              <button type="button" onClick={() => { editor.chain().focus().unsetFontSize().run(); setShowFontSizeMenu(false); }} className="w-full px-4 py-2 text-right hover:bg-gray-600 transition-colors rounded-b-lg text-gray-400 border-t border-gray-700">پیش‌فرض</button>
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={'p-2 rounded transition-colors ' + (editor.isActive('bulletList') ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="لیست"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm4 1h7a1 1 0 110 2H8a1 1 0 110-2zm0 4h7a1 1 0 110 2H8a1 1 0 110-2zm0 4h7a1 1 0 110 2H8a1 1 0 110-2zM4 9a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1V9zm0 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1z"/></svg></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={'p-2 rounded transition-colors ' + (editor.isActive('orderedList') ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="لیست شماره"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a1 1 0 000 2h1v1H5a1 1 0 100 2h1v1H5a1 1 0 100 2h2a1 1 0 001-1V4a1 1 0 00-1-1H5zm4 2h7a1 1 0 110 2H9a1 1 0 110-2zm0 4h7a1 1 0 110 2H9a1 1 0 110-2zm0 4h7a1 1 0 110 2H9a1 1 0 110-2zM5 11a1 1 0 100 2h1v1H5a1 1 0 100 2h2a1 1 0 001-1v-2a1 1 0 00-1-1H5z"/></svg></button>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button 
          type="button" 
          onClick={() => editor.chain().focus().toggleReadMoreSeparator().run()} 
          className={'p-2 rounded transition-colors ' + (hasReadMoreSeparator() ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')}
          title={hasReadMoreSeparator() ? "حذف خط 'مشاهده بیشتر'" : "درج خط 'مشاهده بیشتر'"}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm1 5a1 1 0 100 2h12a1 1 0 100-2H4z" clipRule="evenodd"/>
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button type="button" onClick={openLinkModal} className={'p-2 rounded transition-colors ' + (isLinkActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="لینک"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/></svg></button>
        {isLinkActive && (<button type="button" onClick={removeLink} className="p-2 rounded transition-colors bg-red-600 text-white hover:bg-red-700" title="حذف لینک"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg></button>)}
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button type="button" onClick={() => setShowImageGallery(true)} className="p-2 rounded transition-colors text-gray-300 hover:text-white hover:bg-gray-700" title="تصویر"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/></svg></button>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={'p-2 rounded transition-colors ' + (editor.isActive({ textAlign: 'right' }) ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="راست"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"/></svg></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={'p-2 rounded transition-colors ' + (editor.isActive({ textAlign: 'center' }) ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="وسط"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"/></svg></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={'p-2 rounded transition-colors ' + (editor.isActive({ textAlign: 'left' }) ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700')} title="چپ"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"/></svg></button>
        <div className="flex-1"></div>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 rounded transition-colors text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="بازگشت"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a2 2 0 012 2v4a2 2 0 11-4 0v-4H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 rounded transition-colors text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" title="انجام مجدد"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 14.707a1 1 0 001.414 0l4-4a1 1 0 000-1.414l-4-4a1 1 0 10-1.414 1.414L12.586 9H5a2 2 0 00-2 2v4a2 2 0 104 0v-4h7.586l-2.293 2.293a1 1 0 000 1.414z" clipRule="evenodd"/></svg></button>
      </div>
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowLinkModal(false)}>
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-purple-500/30" onClick={(e) => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold text-white mb-4">{isLinkActive ? 'ویرایش لینک' : 'افزودن لینک'}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-300 mb-2">متن لینک</label><input type="text" value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="متن نمایشی لینک..." className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" autoFocus /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-2">آدرس لینک</label><input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} /></div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowLinkModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">انصراف</button>
                {isLinkActive && (<button type="button" onClick={() => { removeLink(); setShowLinkModal(false); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">حذف لینک</button>)}
                <button type="button" onClick={addLink} disabled={!linkUrl} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isLinkActive ? 'ویرایش' : 'افزودن'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <SharedImageGallery
        isOpen={showImageGallery}
        onClose={() => {
          setShowImageGallery(false);
          setPendingImageUrl('');
        }}
        onSelectImage={(imageUrl) => {
          setPendingImageUrl(imageUrl);
        }}
        onConfirm={(imageUrl) => {
          if (imageUrl) {
            confirmImageSelection(imageUrl);
          }
        }}
        title="انتخاب تصویر"
        source="admin"
        selectedImage={pendingImageUrl}
      />
    </>
  );
};

const TiptapRichEditor: React.FC<TiptapRichEditorProps> = ({ value, onChange, placeholder = 'توضیحات محصول را وارد کنید...', className = '' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        heading: { levels: [1, 2, 3, 4, 5, 6] }, 
        bulletList: { keepMarks: true, keepAttributes: false }, 
        orderedList: { keepMarks: true, keepAttributes: false }
      }), 
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-purple-400 underline hover:text-purple-300' } }), 
      CustomImage,
      ReadMoreSeparator,
      Underline, 
      TextStyle.configure({
        HTMLAttributes: {
          class: 'text-style-mark',
        },
      }), 
      Color.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }), 
      Placeholder.configure({ placeholder })
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => { const html = editor.getHTML(); console.log('Editor HTML:', html); onChange(html); },
    editorProps: { attributes: { class: 'max-w-none focus:outline-none min-h-[250px] px-4 py-3 text-gray-200', dir: 'rtl' }, handlePaste: () => false },
  });
  return (<div className={'bg-slate-800 border border-purple-500/20 rounded-lg overflow-auto max-h-[100vh] ' + className} dir="ltr"><div dir="rtl"><Toolbar editor={editor} /><div className="bg-slate-700/50"><EditorContent editor={editor} /></div></div><style jsx global>{'.bg-slate-800::-webkit-scrollbar{width:12px}.bg-slate-800::-webkit-scrollbar-track{background:#1e293b;border-radius:8px}.bg-slate-800::-webkit-scrollbar-thumb{background:#6b21a8;border-radius:8px;border:2px solid #1e293b}.bg-slate-800::-webkit-scrollbar-thumb:hover{background:#7c3aed}.tiptap{color:#e5e7eb!important;font-size:16px;line-height:1.6}.tiptap *{font-family:Yekan,IRANSans,system-ui,sans-serif!important}.tiptap p{margin-bottom:.5rem}.tiptap span[style*="color"]{display:inline!important}.tiptap ul,.tiptap ol{padding:0!important;margin:1rem 0!important;padding-inline-start:2rem!important;padding-inline-end:3rem!important}.tiptap ul{list-style-type:disc}.tiptap ol{list-style-type:decimal}.tiptap ul li,.tiptap ol li{color:#e5e7eb!important;display:list-item!important;margin:.3rem 0!important;padding:0!important}.tiptap ul li>p,.tiptap ol li>p{margin:0!important;padding:0!important;display:inline!important}.tiptap h1{color:#c4b5fd!important;font-weight:700!important;font-size:2.5rem!important;margin-top:1.5rem;margin-bottom:1rem;line-height:1.2}.tiptap h2{color:#c4b5fd!important;font-weight:700!important;font-size:2rem!important;margin-top:1.25rem;margin-bottom:.875rem;line-height:1.3}.tiptap h3{color:#c4b5fd!important;font-weight:600!important;font-size:1.75rem!important;margin-top:1rem;margin-bottom:.75rem;line-height:1.3}.tiptap h4{color:#c4b5fd!important;font-weight:600!important;font-size:1.5rem!important;margin-top:1rem;margin-bottom:.75rem;line-height:1.4}.tiptap h5{color:#c4b5fd!important;font-weight:600!important;font-size:1.25rem!important;margin-top:.875rem;margin-bottom:.625rem;line-height:1.4}.tiptap h6{color:#c4b5fd!important;font-weight:600!important;font-size:1rem!important;margin-top:.75rem;margin-bottom:.5rem;line-height:1.5}.tiptap a{color:#c084fc!important;text-decoration:underline}.tiptap strong,.tiptap b{color:#fbbf24!important;font-weight:900!important;background:linear-gradient(180deg,transparent 0%,transparent 50%,rgba(251,191,36,0.15) 50%,rgba(251,191,36,0.15) 100%);padding:0 2px;border-radius:2px}.tiptap em,.tiptap i{color:#a78bfa!important;font-style:italic!important;letter-spacing:0.5px}.tiptap u{color:#34d399!important;text-decoration:underline!important;text-decoration-color:#34d399!important;text-decoration-thickness:2px!important;text-underline-offset:3px!important}.tiptap code{background-color:#1e293b;color:#fbbf24;padding:.2rem .4rem;border-radius:.25rem}.tiptap pre{background-color:#1e293b;color:#e5e7eb;padding:1rem;border-radius:.5rem;overflow-x:auto}.tiptap img{border-radius:.5rem;max-width:100%;height:auto}.tiptap [data-type="customImage"]{clear:both}.tiptap [data-type="customImage"]:has([style*="justify-center"]){display:block;clear:both}.tiptap [data-type="customImage"]:has(.float-right){float:right;margin-left:1.5rem;margin-bottom:1rem}.tiptap [data-type="customImage"]:has(.float-left){float:left;margin-right:1.5rem;margin-bottom:1rem}.tiptap .is-editor-empty:first-child::before{color:#9ca3af;content:attr(data-placeholder);float:right;height:0;pointer-events:none}'}</style></div>);
};

export default TiptapRichEditor;