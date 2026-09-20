'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useSearchProducts } from '@/hooks/useApi';
import { useURLSettings } from '@/contexts/URLSettingsContext';

interface AjaxSearchBarProps {
  placeholder?: string;
  maxResults?: number;
  className?: string;
}

const AjaxSearchBar = ({ 
  placeholder = " جستجوی محصولات...", 
  maxResults = 6,
  className = ""
}: AjaxSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  
  const { generateProductUrl } = useURLSettings();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Use React Query for search
  const { data: searchResults, isLoading } = useSearchProducts(debouncedQuery, maxResults);
  const suggestions = searchResults || [];

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        setDebouncedQuery(query);
        setIsOpen(true);
      }, 300);
    } else {
      setDebouncedQuery('');
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleProductClick(suggestions[selectedIndex]);
        } else if (query.trim()) {
          // Redirect to products page with search query
          window.location.href = `/products?search=${encodeURIComponent(query)}`;
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleProductClick = (product: Product) => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    window.location.href = generateProductUrl(product);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay closing to allow clicking on suggestions
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : part
    );
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = suggestions.filter((product: Product) => {
    const img = product.imageUrl || product.image;
    return img && img.trim() !== '';
  });

  return (
    <div ref={searchRef} className={`search-container relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative group">
        <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur transition-all duration-200 ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}></div>
        
        <input
          ref={inputRef}
          type="text"
          name="search"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="relative w-full px-4 py-3 pr-13 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          style={{ height: '48px' }}
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
          ) : (
            <svg 
              className="h-5 w-5 text-gray-400 hover:text-purple-400 transition-colors duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div 
          className="search-dropdown absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-slate-800 to-purple-900 rounded-xl shadow-2xl border border-purple-500/30 overflow-hidden animate-fade-in-down backdrop-blur-md"
          style={{
            zIndex: 9999,
            maxHeight: '400px'
          }}
        >
          {filteredProducts.length > 0 ? (
            <>
              <div className="p-3 bg-purple-800/50 border-b border-purple-500/30">
                <p className="text-sm text-gray-300 font-medium">
                  {filteredProducts.length} محصول یافت شد
                </p>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredProducts.map((product: Product, index: number) => (
                  <button
                    key={product.id || product._id}
                    onClick={() => handleProductClick(product)}
                    className={`w-full p-4 flex items-center space-x-3 hover:bg-purple-700/30 transition-colors duration-200 border-b border-purple-500/20 last:border-b-0 ${
                      index === selectedIndex ? 'bg-purple-600/30 border-purple-400' : ''
                    }`}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100/10 border border-purple-500/20">
                      {(product.imageUrl || product.image) ? (
                        <Image
                          src={product.imageUrl || product.image || ''}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-white truncate">
                        {highlightText(product.name, query)}
                      </h4>
                      <p className="text-sm text-gray-300 truncate">
                        {typeof product.category === 'object' ? product.category?.name : product.category}
                      </p>
                    </div>
                    
                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      <div className="font-bold text-purple-400">
                        {product.price.toLocaleString('fa-IR')} تومان
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-gray-300 line-through">
                          {product.originalPrice.toLocaleString('fa-IR')} تومان
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow Icon */}
                    <div className="flex-shrink-0 text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* View All Results */}
              <Link 
                href={`/products?search=${encodeURIComponent(query)}`}
                className="block p-4 text-center bg-purple-700/30 hover:bg-purple-600/30 text-purple-300 font-medium transition-colors duration-200"
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                مشاهده همه نتایج برای &ldquo;{query}&rdquo;
              </Link>
            </>
          ) : query.length >= 2 && !isLoading ? (
            <div className="p-8 text-center">
              <div className="text-gray-300 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.769-6.244-2.077C7.318 11.53 9.536 11 12 11c2.464 0 4.682.53 6.244 1.923A7.962 7.962 0 0120 17c0 .59-.105 1.163-.298 1.693L18 20l-3.5-1.5A7.945 7.945 0 0112 19c-2.34 0-4.5-.769-6.244-2.077" />
                </svg>
              </div>
              <p className="text-gray-200 font-medium">هیچ محصولی یافت نشد</p>
              <p className="text-sm text-gray-300">با کلمات کلیدی متفاوت جستجو کنید</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AjaxSearchBar;
