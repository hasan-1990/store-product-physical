'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Slate, 
  Editable, 
  withReact, 
  useSlate,
  ReactEditor
} from 'slate-react';
import { 
  Editor, 
  Transforms, 
  Element as SlateElement,
  Descendant,
  Text,
  createEditor,
  BaseEditor,
  Node as SlateNode
} from 'slate';
import { withHistory } from 'slate-history';
import isHotkey from 'is-hotkey';
import SharedImageGallery from './SharedImageGallery';

// Define custom types
type CustomElement = {
  type: string;
  align?: string;
  url?: string;
  size?: 'small' | 'medium' | 'large';
  width?: number;
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: true;
  italic?: true;
  code?: true;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface SlateRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Initial editor value
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

// Hotkeys mapping
const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+`': 'code',
};

// Helper functions
const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

// Image Element Component with improved alignment and text wrapping
const ImageElement = ({ attributes, element, editor, children }: any) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartData, setResizeStartData] = useState({ x: 0, y: 0, width: 0 });
  const [isSelected, setIsSelected] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const getImageWidth = () => {
    if (element.width) return element.width;
    switch (element.size) {
      case 'small': return 300;
      case 'medium': return 450;
      case 'large': return 600;
      default: return 450;
    }
  };

  const getAlignmentClass = () => {
    switch (element.align) {
      case 'left': return 'float-right mr-4 mb-4 max-w-md'; // در RTL راست می‌شود
      case 'right': return 'float-left ml-4 mb-4 max-w-md'; // در RTL چپ می‌شود  
      case 'center': return 'mx-auto mb-4';
      default: return 'mx-auto mb-4';
    }
  };

  const getContainerClass = () => {
    const align = element.align || 'center';
    if (align === 'center') {
      return 'flex justify-center items-center my-4 w-full';
    } else if (align === 'right') {
      return 'flex justify-end items-center my-4 w-full';
    } else {
      return 'flex justify-start items-center my-4 w-full';
    }
  };

  const setImageAlignment = (align: 'left' | 'center' | 'right') => {
    try {
      const path = (ReactEditor as any).findPath(editor, element);
      Transforms.setNodes(editor, { align }, { at: path });
      
      // force re-render برای اطمینان از اعمال تغییرات
      setTimeout(() => {
        (ReactEditor as any).focus(editor);
      }, 50);
      
    } catch (error) {
      console.log('Alignment failed:', error);
      
      // روش جایگزین - پیدا کردن تصویر با URL
      try {
        const nodes = Array.from(Editor.nodes(editor, {
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'image' && n.url === element.url
        }));
        
        if (nodes.length > 0) {
          const [, path] = nodes[0];
          Transforms.setNodes(editor, { align }, { at: path });
        }
      } catch (fallbackError) {
        console.log('Fallback alignment failed:', fallbackError);
      }
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startData = {
      x: e.clientX,
      y: e.clientY,
      width: getImageWidth()
    };
    setResizeStartData(startData);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startData.x;
      const adjustedDelta = -deltaX * 0.5;
      const newWidth = Math.max(200, Math.min(800, startData.width + adjustedDelta));
      
      if (Math.abs(newWidth - getImageWidth()) > 5) {
        try {
          const path = (ReactEditor as any).findPath(editor, element);
          Transforms.setNodes(editor, { width: Math.round(newWidth) }, { at: path });
        } catch (error) {
          console.log('Resize failed:', error);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const moveImage = (direction: 'up' | 'down') => {
    try {
      const path = (ReactEditor as any).findPath(editor, element);
      const currentIndex = path[0];
      
      if (direction === 'up' && currentIndex > 0) {
        // انتقال به بالا
        Transforms.moveNodes(editor, { 
          at: path, 
          to: [currentIndex - 1] 
        });
        
        // focus کردن editor بعد از move
        setTimeout(() => {
          (ReactEditor as any).focus(editor);
        }, 100);
        
      } else if (direction === 'down' && currentIndex < editor.children.length - 1) {
        // انتقال به پایین  
        Transforms.moveNodes(editor, { 
          at: path, 
          to: [currentIndex + 1] 
        });
        
        // focus کردن editor بعد از move
        setTimeout(() => {
          (ReactEditor as any).focus(editor);
        }, 100);
      }
    } catch (error) {
      console.log('Move failed:', error);
    }
  };

  const deleteImage = () => {
    try {
      const path = (ReactEditor as any).findPath(editor, element);
      Transforms.removeNodes(editor, { at: path });
    } catch (error) {
      console.log('Delete failed:', error);
    }
  };

  return (
    <div 
      {...attributes} 
      contentEditable={false} 
      className={`${getContainerClass()} relative group select-none ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => setIsSelected(true)}
      onBlur={() => setIsSelected(false)}
    >
      <img 
        ref={imageRef}
        src={element.url} 
        alt="مقاله" 
        style={{ width: getImageWidth() }}
        className={`h-auto rounded-lg shadow-lg transition-all duration-200 ${getAlignmentClass()}`}
        draggable={false}
      />
      
      {/* Alignment Controls - بالای تصویر */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-black/80 rounded-md p-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setImageAlignment('right');
            // Keep focus in editor
            setTimeout(() => {
              (ReactEditor as any).focus(editor);
            }, 50);
          }}
          className={`p-1 text-white rounded text-xs hover:bg-white/20 transition-colors ${element.align === 'right' ? 'bg-blue-600' : 'bg-gray-700'}`}
          title="چیدمان چپ (در RTL)"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"/>
          </svg>
        </button>
        
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setImageAlignment('center');
            // Keep focus in editor
            setTimeout(() => {
              (ReactEditor as any).focus(editor);
            }, 50);
          }}
          className={`p-1 text-white rounded text-xs hover:bg-white/20 transition-colors ${element.align === 'center' || !element.align ? 'bg-blue-600' : 'bg-gray-700'}`}
          title="چیدمان وسط"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-2 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"/>
          </svg>
        </button>
        
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setImageAlignment('left');
            // Keep focus in editor
            setTimeout(() => {
              (ReactEditor as any).focus(editor);
            }, 50);
          }}
          className={`p-1 text-white rounded text-xs hover:bg-white/20 transition-colors ${element.align === 'left' ? 'bg-blue-600' : 'bg-gray-700'}`}
          title="چیدمان راست (در RTL)"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"/>
          </svg>
        </button>
      </div>

      {/* Corner Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 cursor-nw-resize opacity-0 group-hover:opacity-90 transition-opacity duration-200 flex items-center justify-center"
        onMouseDown={handleResizeStart}
        title="کشیدن برای تغییر سایز (به داخل: کوچکتر، به بیرون: بزرگتر)"
        style={{ 
          borderRadius: '0 0 8px 0',
          background: 'linear-gradient(-45deg, transparent 30%, #3b82f6 30%)'
        }}
      >
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 7h6v2H7V7zm0 4h6v2H7v-2z"/>
        </svg>
      </div>
      
      {/* Edge Resize Handle */}
      <div 
        className="absolute top-0 right-0 bottom-0 w-3 cursor-e-resize opacity-0 group-hover:opacity-30 hover:opacity-60 bg-blue-400 transition-opacity duration-200"
        onMouseDown={handleResizeStart}
        title="کشیدن برای تغییر سایز"
      />

      {/* Move Controls - سمت راست */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => moveImage('up')}
          className="p-2 bg-white/90 text-gray-700 rounded-md shadow-md hover:bg-white hover:shadow-lg transition-all"
          title="انتقال به بالا"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/>
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => moveImage('down')}
          className="p-2 bg-white/90 text-gray-700 rounded-md shadow-md hover:bg-white hover:shadow-lg transition-all"
          title="انتقال به پایین"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={deleteImage}
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-red-500/90 text-white rounded-md shadow-md hover:bg-red-600 hover:shadow-lg"
        title="حذف تصویر"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
        </svg>
      </button>

      {/* Size Indicator */}
      {isResizing && (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded shadow-lg">
          {Math.round(getImageWidth())}px
        </div>
      )}
      
      {children}
    </div>
  );
};

const isBlockActive = (editor: Editor, format: string, blockType = 'type') => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType as keyof CustomElement] === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor) as any;
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes((n as any).type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });

  let newProperties: Partial<SlateElement>;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    } as any;
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    } as any;
  }

  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] } as any;
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// Serialize to HTML
const serialize = (nodes: Descendant[]): string => {
  return nodes.map(node => serializeNode(node)).join('');
};

const serializeNode = (node: any): string => {
  if (Text.isText(node)) {
    let string = node.text;
    if (node.bold) {
      string = `<strong>${string}</strong>`;
    }
    if (node.italic) {
      string = `<em>${string}</em>`;
    }
    if (node.code) {
      string = `<code>${string}</code>`;
    }
    return string;
  }

  const children = node.children.map((n: any) => serializeNode(n)).join('');

  switch (node.type) {
    case 'paragraph':
      return `<p style="text-align: ${node.align || 'right'};">${children}</p>`;
    case 'heading-one':
      return `<h1 style="text-align: ${node.align || 'right'};">${children}</h1>`;
    case 'heading-two':
      return `<h2 style="text-align: ${node.align || 'right'};">${children}</h2>`;
    case 'heading-three':
      return `<h3 style="text-align: ${node.align || 'right'};">${children}</h3>`;
    case 'bulleted-list':
      return `<ul style="text-align: ${node.align || 'right'};">${children}</ul>`;
    case 'numbered-list':
      return `<ol style="text-align: ${node.align || 'right'};">${children}</ol>`;
    case 'list-item':
      return `<li>${children}</li>`;
    case 'link':
      return `<a href="${node.url}" target="_blank" rel="noopener noreferrer">${children}</a>`;
    case 'image':
      const align = node.align || 'center';
      const width = node.width || 400;
      let imageStyle = `max-width: 100%; width: ${width}px; height: auto; display: block;`;
      
      if (align === 'center') {
        imageStyle += ' margin: 0 auto;';
      } else if (align === 'left') {
        imageStyle += ' margin-right: auto; margin-left: 0;';
      } else if (align === 'right') {
        imageStyle += ' margin-left: auto; margin-right: 0;';
      }
      
      return `<div style="text-align: ${align}; width: 100%;"><img src="${node.url}" alt="تصویر" style="${imageStyle}" /></div>`;
    case 'code-block':
      return `<pre><code>${children}</code></pre>`;
    default:
      return children;
  }
};

// Deserialize from HTML string
const deserialize = (htmlString: string): Descendant[] => {
  if (!htmlString || !htmlString.trim()) return initialValue;
  
  // اگر HTML نیست، متن ساده را به پاراگراف تبدیل کن
  if (!htmlString.includes('<')) {
    const lines = htmlString.split('\n');
    return lines.map(line => ({
      type: 'paragraph',
      children: [{ text: line }],
    }));
  }

  // پارس کردن HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const fragment: Descendant[] = [];

  const deserializeElement = (el: ChildNode): any => {
    if (el.nodeType === Node.TEXT_NODE) {
      const text = el.textContent || '';
      return text.length > 0 ? { text } : null;
    }

    if (el.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = el as HTMLElement;
    const nodeName = element.nodeName;
    const align = element.style.textAlign || undefined;

    // پردازش children به صورت inline
    const processInlineChildren = (node: Node): any[] => {
      const results: any[] = [];
      
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || '';
          if (text.length > 0) {
            results.push({ text });
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childEl = child as HTMLElement;
          
          switch (childEl.nodeName) {
            case 'A':
              // 🔗 پردازش لینک - استخراج متن از داخل تمام children
              const linkText = childEl.textContent || '';
              const linkUrl = childEl.getAttribute('href') || '';
              results.push({
                type: 'link',
                url: linkUrl,
                children: [{ text: linkText }],
              });
              break;
            case 'STRONG':
            case 'B':
              const boldChildren = processInlineChildren(childEl);
              boldChildren.forEach((c: any) => {
                if (c.text !== undefined) {
                  results.push({ ...c, bold: true });
                } else {
                  results.push(c);
                }
              });
              break;
            case 'EM':
            case 'I':
              const italicChildren = processInlineChildren(childEl);
              italicChildren.forEach((c: any) => {
                if (c.text !== undefined) {
                  results.push({ ...c, italic: true });
                } else {
                  results.push(c);
                }
              });
              break;
            case 'BR':
              results.push({ text: '\n' });
              break;
            default:
              results.push(...processInlineChildren(childEl));
              break;
          }
        }
      });
      
      return results;
    };

    // برای block elements
    switch (nodeName) {
      case 'P':
        const pChildren = processInlineChildren(element);
        return { 
          type: 'paragraph', 
          align, 
          children: pChildren.length > 0 ? pChildren : [{ text: '' }] 
        };
      case 'H1':
        const h1Children = processInlineChildren(element);
        return { 
          type: 'heading-one', 
          align, 
          children: h1Children.length > 0 ? h1Children : [{ text: '' }] 
        };
      case 'H2':
        const h2Children = processInlineChildren(element);
        return { 
          type: 'heading-two', 
          align, 
          children: h2Children.length > 0 ? h2Children : [{ text: '' }] 
        };
      case 'H3':
        const h3Children = processInlineChildren(element);
        return { 
          type: 'heading-three', 
          align, 
          children: h3Children.length > 0 ? h3Children : [{ text: '' }] 
        };
      case 'UL':
      case 'OL':
        const listChildren = Array.from(element.childNodes)
          .map(deserializeElement)
          .filter(Boolean);
        return { 
          type: nodeName === 'UL' ? 'bulleted-list' : 'numbered-list', 
          children: listChildren.length > 0 ? listChildren : [{ text: '' }] 
        };
      case 'LI':
        const liChildren = processInlineChildren(element);
        return { 
          type: 'list-item', 
          children: liChildren.length > 0 ? liChildren : [{ text: '' }] 
        };
      case 'IMG':
        const imgAlign = element.parentElement?.style.textAlign || 
                        element.getAttribute('data-align') || 
                        'center';
        return {
          type: 'image',
          url: element.getAttribute('src') || '',
          width: parseInt(element.style.width) || parseInt(element.getAttribute('width') || '400'),
          align: imgAlign,
          children: [{ text: '' }],
        };
      case 'PRE':
      case 'CODE':
        return { 
          type: 'code-block', 
          children: [{ text: element.textContent || '' }] 
        };
      case 'DIV':
      case 'SPAN':
        const inlineChildren = processInlineChildren(element);
        return inlineChildren.length > 0 ? inlineChildren : null;
      default:
        return null;
    }
  };

  Array.from(doc.body.childNodes).forEach(node => {
    const result = deserializeElement(node);
    if (result) {
      if (Array.isArray(result)) {
        fragment.push(...result);
      } else {
        fragment.push(result);
      }
    }
  });

  return fragment.length > 0 ? fragment : initialValue;
};

// Toolbar Components
const MarkButton = ({ format, icon, title }: { format: string; icon: React.ReactNode; title: string }) => {
  const editor = useSlate();
  const isActive = isMarkActive(editor, format);

  return (
    <button
      type="button"
      className={`p-2 rounded transition-colors ${
        isActive 
          ? 'bg-purple-600 text-white' 
          : 'text-gray-300 hover:text-white hover:bg-gray-700'
      }`}
      title={title}
      onMouseDown={event => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      {icon}
    </button>
  );
};

const BlockButton = ({ format, icon, title }: { format: string; icon: React.ReactNode; title: string }) => {
  const editor = useSlate();
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  );

  return (
    <button
      type="button"
      className={`p-2 rounded transition-colors ${
        isActive 
          ? 'bg-purple-600 text-white' 
          : 'text-gray-300 hover:text-white hover:bg-gray-700'
      }`}
      title={title}
      onMouseDown={event => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {icon}
    </button>
  );
};

// Element rendering
const Element = ({ attributes, children, element }: any) => {
  const editor = useSlate();
  const style = { textAlign: element.align };
  
  switch (element.type) {
    case 'image':
      return (
        <ImageElement attributes={attributes} element={element} editor={editor}>
          {children}
        </ImageElement>
      );
    case 'link':
      return (
        <a 
          {...attributes} 
          href={element.url} 
          className="text-purple-400 hover:text-purple-300 underline relative group"
        >
          {children}
          <span
            contentEditable={false}
            className="inline-flex items-center justify-center mx-1 px-1.5 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer select-none align-middle shadow-sm z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(element.url, '_blank', 'noopener,noreferrer');
            }}
            onMouseDown={(e) => e.preventDefault()}
            title="باز کردن لینک در تب جدید"
          >
            🔗 باز کردن
          </span>
        </a>
      );
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes} className="list-disc list-inside my-2">
          {children}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol style={style} {...attributes} className="list-decimal list-inside my-2">
          {children}
        </ol>
      );
    case 'list-item':
      return (
        <li {...attributes} className="my-1">
          {children}
        </li>
      );
    case 'heading-one':
      return (
        <h1 style={style} {...attributes} className="text-3xl font-bold my-4 text-white">
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 style={style} {...attributes} className="text-2xl font-bold my-3 text-white">
          {children}
        </h2>
      );
    case 'heading-three':
      return (
        <h3 style={style} {...attributes} className="text-xl font-bold my-2 text-white">
          {children}
        </h3>
      );
    case 'heading-four':
      return (
        <h4 style={style} {...attributes} className="text-lg font-bold my-2 text-white">
          {children}
        </h4>
      );
    case 'heading-five':
      return (
        <h5 style={style} {...attributes} className="text-base font-bold my-2 text-white">
          {children}
        </h5>
      );
    case 'heading-six':
      return (
        <h6 style={style} {...attributes} className="text-sm font-bold my-2 text-white">
          {children}
        </h6>
      );
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes} className="border-l-4 border-purple-500 pl-4 italic text-gray-300 my-3">
          {children}
        </blockquote>
      );
    case 'code-block':
      return (
        <pre style={style} {...attributes} className="bg-gray-800 p-4 rounded-lg my-3 border border-gray-600 overflow-x-auto">
          <code>{children}</code>
        </pre>
      );
    default:
      return (
        <p style={style} {...attributes} className="my-2 text-gray-200 leading-relaxed min-h-[1.5em]">
          {children}
        </p>
      );
  }
};

// Leaf rendering
const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong className="font-bold text-white">{children}</strong>;
  }

  if (leaf.code) {
    children = <code className="bg-gray-800 px-2 py-1 rounded text-green-400 font-mono text-sm">{children}</code>;
  }

  if (leaf.italic) {
    children = <em className="italic">{children}</em>;
  }

  return <span {...attributes}>{children}</span>;
};

export default function SlateRichEditor({ 
  value, 
  onChange, 
  placeholder = 'متن مقاله را اینجا بنویسید...', 
  className = '' 
}: SlateRichEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkData, setLinkData] = useState({ text: '', url: '' });
  
  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
  
  // Plugin برای تعریف لینک‌ها به عنوان inline element
  const withInlines = (editor: any) => {
    const { isInline } = editor;

    editor.isInline = (element: any) => {
      return element.type === 'link' ? true : isInline(element);
    };

    return editor;
  };
  
  const editor = useMemo(() => {
    return withInlines(withHistory(withReact(createEditor())));
  }, []);

  // Convert string value to Slate value
  const slateValue = useMemo(() => {
    try {
      return value ? deserialize(value) : initialValue;
    } catch (e) {
      console.error('Deserialize error:', e);
      return initialValue;
    }
  }, [value]);

  const handleChange = (newValue: Descendant[]) => {
    const isAstChange = editor.operations.some(
      (op: any) => 'set_selection' !== op.type
    );
    if (isAstChange) {
      const content = serialize(newValue);
      
      // Debug: چک کردن لینک‌ها در خروجی
      const hasLinkTags = content.includes('<a ');
      const linkCount = (content.match(/<a /g) || []).length;
      console.log(`💾 Serializing: ${linkCount} links found in HTML output`);
      if (hasLinkTags) {
        console.log('💾 Sample output:', content.substring(0, 500));
      }
      
      onChange(content);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event as any)) {
        event.preventDefault();
        const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
        toggleMark(editor, mark);
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    
    const clipboardData = event.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    
    if (htmlData) {
      // پارس HTML و حذف لینک‌ها
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, 'text/html');
      
      // حذف تمام تگ‌های <a> ولی نگه داشتن محتوایشون
      const links = doc.querySelectorAll('a');
      links.forEach(link => {
        const textNode = document.createTextNode(link.textContent || '');
        link.parentNode?.replaceChild(textNode, link);
      });
      
      // تبدیل HTML پاک شده به Slate format
      const cleanedHtml = doc.body.innerHTML;
      const fragment = deserialize(cleanedHtml);
      
      // درج fragment
      Transforms.insertFragment(editor, fragment);
    } else if (textData) {
      // اگر فقط متن ساده باشه، مستقیم درج کن
      const lines = textData.split('\n');
      const fragment = lines.map(line => ({
        type: 'paragraph',
        children: [{ text: line }],
      }));
      
      Transforms.insertFragment(editor, fragment);
    }
  };

  const insertImage = (imageUrl: string) => {
    const imageElement = {
      type: 'image',
      url: imageUrl,
      size: 'medium' as const,
      align: 'center' as const,
      children: [{ text: '' }],
    };
    
    // درج تصویر همراه با پاراگراف‌های خالی قبل و بعد
    Transforms.insertNodes(editor, [
      { type: 'paragraph', children: [{ text: '' }] }, // پاراگراف قبل
      imageElement, // تصویر
      { type: 'paragraph', children: [{ text: '' }] }  // پاراگراف بعد
    ]);
    
    // انتقال cursor به پاراگراف بعد از تصویر
    setTimeout(() => {
      try {
        // پیدا کردن آخرین پاراگراف و قراردادن cursor آنجا
        const lastPath = [editor.children.length - 1];
        Transforms.select(editor, {
          anchor: { path: [...lastPath, 0], offset: 0 },
          focus: { path: [...lastPath, 0], offset: 0 }
        });
        (ReactEditor as any).focus(editor);
      } catch (error) {
        console.log('Focus error:', error);
      }
    }, 100);
    
    setShowImageModal(false);
  };

  const insertLink = () => {
    if (!linkData.url) return;

    const { selection } = editor;
    
    if (linkData.text) {
      // اگر متن وارد شده، لینک جدید بساز
      const linkElement = {
        type: 'link',
        url: linkData.url,
        children: [{ text: linkData.text }],
      };
      Transforms.insertNodes(editor, linkElement);
      // فاصله بعد از لینک
      Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: ' ' }] });
    } else if (selection && !Editor.string(editor, selection)) {
      // اگر متن انتخاب نشده و فیلد متن خالی، نمایش پیام خطا
      alert('لطفا متن لینک را وارد کنید');
      return;
    } else if (selection) {
      // اگر متن انتخاب شده، آن را لینک‌دار کن
      const isCollapsed = selection.anchor.offset === selection.focus.offset;
      
      if (!isCollapsed) {
        // حذف متن انتخاب شده و جایگزینی با لینک
        const linkElement = {
          type: 'link',
          url: linkData.url,
          children: [{ text: Editor.string(editor, selection) }],
        };
        
        Transforms.delete(editor);
        Transforms.insertNodes(editor, linkElement);
        // فاصله بعد از لینک
        Transforms.insertText(editor, ' ');
      }
    }
    
    setShowLinkModal(false);
    setLinkData({ text: '', url: '' });
  };

  const removeLink = () => {
    const { selection } = editor;
    
    if (selection) {
      // پیدا کردن لینک در محدوده انتخاب شده
      const [linkNode] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
        at: selection,
      });
      
      if (linkNode) {
        const [node, path] = linkNode;
        const linkElement = node as any;
        
        // گرفتن متن داخل لینک
        const linkText = linkElement.children.map((child: any) => child.text).join('');
        
        // حذف لینک و جایگزینی با متن ساده
        Transforms.unwrapNodes(editor, {
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
          at: path,
        });
        
        // اطمینان از اینکه متن به عنوان متن ساده باقی می‌ماند
        Transforms.insertText(editor, linkText, { at: path });
      }
    }
    
    setShowLinkModal(false);
    setLinkData({ text: '', url: '' });
  };

  return (
    <div className={className}>
      <Slate 
        editor={editor} 
        initialValue={slateValue}
        onChange={handleChange}
      >
        {/* Toolbar */}
        <div className="bg-gray-800/80 border border-gray-600 rounded-t-lg p-3 flex flex-wrap items-center gap-2">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
            <MarkButton
              format="bold"
              title="پررنگ (Ctrl+B)"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.54 8.5c.31-.78.31-1.63 0-2.41A3.5 3.5 0 0 0 9 3H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5.5a3.5 3.5 0 0 0 2.96-5.34A3.5 3.5 0 0 0 12.54 8.5zM6 5h3a1.5 1.5 0 0 1 0 3H6V5zm3.5 10H6v-4h3.5a1.5 1.5 0 0 1 0 3z"/>
                </svg>
              }
            />
            
            <MarkButton
              format="italic"
              title="کج (Ctrl+I)"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2h-2.586L9 17H11a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2h2.586L11 4H9a1 1 0 0 1-1-1z"/>
                </svg>
              }
            />
            
            <MarkButton
              format="code"
              title="کد (Ctrl+`)"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.962 8.795l1.414 1.414L17 8.585 8.586 0 7.172 1.414l8.79 8.795-2.414 2.414L12.128 11l1.414-1.414.42-.791zM3.828 9.172L2.414 7.758 0 10.172l8.414 8.414 1.414-1.414L3.828 9.172z"/>
                </svg>
              }
            />
          </div>

          {/* Headers */}
          <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
            <BlockButton
              format="heading-one"
              title="تیتر اصلی H1"
              icon={<span className="text-sm font-bold">H1</span>}
            />
            
            <BlockButton
              format="heading-two"
              title="تیتر فرعی H2"
              icon={<span className="text-sm font-bold">H2</span>}
            />
            
            <BlockButton
              format="heading-three"
              title="تیتر سوم H3"
              icon={<span className="text-sm font-bold">H3</span>}
            />
            
            <BlockButton
              format="heading-four"
              title="تیتر چهارم H4"
              icon={<span className="text-sm font-bold">H4</span>}
            />
            
            <BlockButton
              format="heading-five"
              title="تیتر پنجم H5"
              icon={<span className="text-sm font-bold">H5</span>}
            />
            
            <BlockButton
              format="heading-six"
              title="تیتر ششم H6"
              icon={<span className="text-sm font-bold">H6</span>}
            />
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
            <BlockButton
              format="bulleted-list"
              title="لیست نقطه‌ای"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 100 4 2 2 0 000-4zM4 10a2 2 0 100 4 2 2 0 000-4zM4 16a2 2 0 100 4 2 2 0 000-4zM8 5h8a1 1 0 110 2H8a1 1 0 110-2zM8 11h8a1 1 0 110 2H8a1 1 0 110-2zM8 17h8a1 1 0 110 2H8a1 1 0 110-2z"/>
                </svg>
              }
            />
            
            <BlockButton
              format="numbered-list"
              title="لیست شماره‌دار"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                </svg>
              }
            />
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
            <BlockButton
              format="left"
              title="راست‌چین"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 8a1 1 0 011-1h8a1 1 0 110 2H3a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 16a1 1 0 011-1h6a1 1 0 110 2H3a1 1 0 01-1-1z"/>
                </svg>
              }
            />
            
            <BlockButton
              format="center"
              title="وسط‌چین"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM7 16a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"/>
                </svg>
              }
            />
            
            <BlockButton
              format="right"
              title="چپ‌چین"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM8 8a1 1 0 011-1h8a1 1 0 110 2H9a1 1 0 01-1-1zM2 12a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM10 16a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z"/>
                </svg>
              }
            />
          </div>

          {/* Blocks */}
          <div className="flex items-center gap-1 border-l border-gray-600 pl-3">
            <BlockButton
              format="block-quote"
              title="نقل قول"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              }
            />
            
            <BlockButton
              format="code-block"
              title="بلوک کد"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"/>
                </svg>
              }
            />
          </div>

          {/* Media */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                // گرفتن متن انتخاب شده
                const { selection } = editor;
                let selectedText = '';
                let existingUrl = '';
                
                if (selection) {
                  selectedText = Editor.string(editor, selection);
                  
                  // چک کردن اینکه آیا متن انتخاب شده یک لینک هست یا نه
                  try {
                    const [linkNode] = Editor.nodes(editor, {
                      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
                      at: selection,
                    });
                    
                    if (linkNode && linkNode[0]) {
                      const linkElement = linkNode[0] as any;
                      existingUrl = linkElement.url || '';
                    }
                  } catch (e) {
                    // اگر خطا داد، یعنی لینک نیست
                  }
                  
                  setLinkData({ text: selectedText, url: existingUrl });
                } else {
                  setLinkData({ text: '', url: '' });
                }
                setShowLinkModal(true);
              }}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="افزودن لینک"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
              </svg>
            </button>
            
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="افزودن تصویر"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Editor */}
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="w-full min-h-[400px] px-4 py-3 bg-gray-900/50 border-x border-b border-gray-600 rounded-b-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none focus:outline-none overflow-hidden"
          style={{ 
            direction: 'rtl',
            lineHeight: '1.8',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        />
      </Slate>

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
                    placeholder="متن نمایشی لینک"
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
            
            <div className="p-4 flex justify-between items-center gap-3">
              {/* دکمه حذف لینک - فقط اگر URL موجود باشد */}
              {linkData.url && (
                <button
                  onClick={removeLink}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  حذف لینک
                </button>
              )}
              
              <div className="flex gap-3 mr-auto">
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
          </div>
        </div>,
        document.body
      )}

      {/* Shared Image Gallery */}
      <SharedImageGallery
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onSelectImage={insertImage}
        title="انتخاب تصویر"
        source="admin"
      />
    </div>
  );
}