'use client';

import React, { useEffect, useState, useCallback, useMemo, useTransition } from 'react';
import { 
  ChevronDown, ChevronLeft, ChevronRight, 
  Package, Layers, Grid, Star, TrendingUp, 
  Zap, Shield, Globe, Code, Palette, Search,
  Tag, Eye, ArrowRight, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Types
interface MegaMenuItem {
  id: string;
  title: string;
  href: string;
  image?: string;
  price?: number;
  discount?: number;
  isNew?: boolean;
  isPopular?: boolean;
}

interface MegaMenuGroup {
  id: string;
  title: string;
  slug?: string;
  items: MegaMenuItem[];
  children?: MegaMenuGroup[];
  icon?: string;
}

interface MegaMenuCategory {
  id: string;
  title: string;
  slug?: string;
  groups: MegaMenuGroup[];
  icon?: any;
  color?: string;
}

interface MegaMenuPreviewSection {
  id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  order: number;
}

// Category icon mapping
const categoryIcons: Record<string, any> = {
  'افزونه': Package,
  'قالب': Palette,
  'سئو': TrendingUp,
  'امنیت': Shield,
  'کد': Code,
  'ابزار': Zap,
  'default': Grid
};

// Category color mapping
const categoryColors: Record<string, string> = {
  'افزونه': 'purple',
  'قالب': 'blue',
  'سئو': 'green',
  'امنیت': 'red',
  'کد': 'yellow',
  'ابزار': 'pink'
};


const MegaMenu = () => {
  const [isPending, startTransition] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeChildGroup, setActiveChildGroup] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MegaMenuItem | null>(null);
  const [menuCategories, setMenuCategories] = useState<MegaMenuCategory[]>([]);
  const [previewSections, setPreviewSections] = useState<MegaMenuPreviewSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Load menu data from API
  const loadMenuData = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true);
      const url = bypassCache 
        ? `/api/mega-menu?t=${Date.now()}` 
        : '/api/mega-menu';
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        const mapGroup = (g: any): MegaMenuGroup => ({
          id: g.id || g.title,
          title: g.title,
          slug: g.slug || g.title.replace(/\s+/g, '-').toLowerCase(),
          items: (g.items || []).map((it: any) => ({
            id: it.id || it.title,
            title: it.title,
            href: it.href || '#',
            image: it.image,
            price: it.price,
            discount: it.discount,
            isNew: it.isNew,
            isPopular: it.isPopular
          })),
          ...(Array.isArray(g.children) && g.children.length > 0
            ? { children: g.children.map(mapGroup) }
            : {})
        });

        const categories: MegaMenuCategory[] = json.data.map((cat: any) => {
          // استفاده از title به صورت kebab-case به عنوان slug پیش‌فرض
          const defaultSlug = cat.title ? cat.title.replace(/\s+/g, '-').toLowerCase() : 'category';
          const categorySlug = cat.slug || defaultSlug;
          
          console.log('Category:', cat.title, 'Slug:', categorySlug);
          
          return {
            id: cat.id || cat.title,
            title: cat.title,
            slug: categorySlug,
            icon: categoryIcons[cat.title] || categoryIcons['default'],
            color: categoryColors[cat.title] || 'purple',
            groups: (cat.groups || []).map(mapGroup)
          };
        }).filter((c: MegaMenuCategory) => c.groups.length > 0);

        setMenuCategories(categories);
        
        // Load preview sections
        if (Array.isArray(json.previewSections)) {
          const sections = json.previewSections.map((ps: any) => ({
            id: ps.id || ps._id,
            title: ps.title,
            description: ps.description,
            image: ps.image,
            buttonText: ps.buttonText,
            buttonLink: ps.buttonLink,
            position: ps.position || 'top',
            order: ps.order ?? 0
          }));
          setPreviewSections(sections);
          console.log('Preview sections loaded:', sections.length);
        }
      }
    } catch (e) {
      console.error('MegaMenu load error:', e);
      setMenuCategories([]);
      setPreviewSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // Auto-select first category on menu open
  useEffect(() => {
    if (isMenuOpen && menuCategories.length > 0 && !activeCategory) {
      setActiveCategory(menuCategories[0].id);
    }
  }, [isMenuOpen, menuCategories]);

  // Get active category data (memoized)
  const activeCat = useMemo(() => {
    return menuCategories.find(cat => cat.id === activeCategory) || null;
  }, [menuCategories, activeCategory]);

  // Get active group data (memoized)
  const activeGrp = useMemo(() => {
    if (!activeCat || !activeGroup) return null;
    return activeCat.groups.find(g => g.id === activeGroup) || null;
  }, [activeCat, activeGroup]);

  const activeChildGrp = useMemo(() => {
    if (!activeGrp || !activeChildGroup) return null;
    return activeGrp.children?.find(c => c.id === activeChildGroup) || null;
  }, [activeGrp, activeChildGroup]);

  // Get popular items across all categories (memoized)
  const popularItems = useMemo(() => {
    const items: MegaMenuItem[] = [];
    menuCategories.forEach(cat => {
      cat.groups.forEach(group => {
        group.items.forEach(item => {
          if (item.isPopular) items.push(item);
        });
      });
    });
    return items.slice(0, 4);
  }, [menuCategories]);

  // Category hover handler (memoized)
  const handleCategoryHover = useCallback((categoryId: string) => {
    startTransition(() => {
      setActiveCategory(categoryId);
      setActiveGroup(null);
      setActiveChildGroup(null);
      setPreviewItem(null);
    });
  }, []);

  // Group hover handler (memoized)
  const handleGroupHover = useCallback((groupId: string) => {
    startTransition(() => {
      setActiveGroup(groupId);
      setActiveChildGroup(null);
    });
  }, []);


  // Desktop Mega Menu Panel (4-Level Advanced) - با React.memo برای جلوگیری از re-render
  const DesktopMegaMenuPanel = React.memo(() => {
    return (
      <div
        className="fixed top-20 z-[9997] pt-0"
        style={{ 
          opacity: 1,
          right: '2%',
          width: '76%',
          maxWidth: '1200px'
        }}
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => {
          startTransition(() => {
            setIsMenuOpen(false);
            setActiveCategory(null);
            setActiveGroup(null);
            setActiveChildGroup(null);
            setPreviewItem(null);
          });
        }}
      >
        <div 
          className="rounded-[28px] overflow-hidden shadow-2xl"
          style={{
            backdropFilter: 'blur(60px) saturate(180%)',
            WebkitBackdropFilter: 'blur(60px) saturate(180%)',
            background: 'linear-gradient(135deg, rgba(20, 15, 45, 0.95) 0%, rgba(30, 20, 60, 0.97) 50%, rgba(20, 15, 45, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Main Grid: Sidebar + Content + Preview */}
          <div className="grid grid-cols-12 overflow-hidden">
            
            {/* LEVEL 1: Categories Sidebar */}
            <div className="col-span-2 bg-black/20 border-l border-white/5 p-3">
              <div className="mb-3 px-2">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">دسته‌بندی اصلی</h3>
              </div>
              
              <div className="flex flex-col gap-0.5">
                {menuCategories.map((category, idx) => {
                  const Icon = category.icon || Grid;
                  const isActive = activeCategory === category.id;
                  const categoryHref = category.slug ? `/products/${category.slug}` : '/products';
                  
                  console.log('Desktop Category Link:', category.title, '→', categoryHref);
                  
                  return (
                    <Link
                      key={category.id}
                      href={categoryHref}
                      onMouseEnter={() => handleCategoryHover(category.id)}
                      className={`
                        group relative flex items-center gap-2 px-3 py-2.5 rounded-lg
                        transition-all duration-200 text-right w-full
                        ${isActive 
                          ? 'bg-gradient-to-l from-purple-600/30 to-purple-500/20 border-r-2 border-purple-400' 
                          : 'hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive ? 'text-purple-300' : 'text-white/50 group-hover:text-white/80'
                      }`} />
                      <span className={`text-xs font-semibold transition-colors ${
                        isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                      }`}>
                        {category.title}
                      </span>
                      {isActive && (
                        <ChevronLeft className="w-4 h-4 text-purple-300 mr-auto" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Popular Items Quick Access */}
              {popularItems.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                    <Star className="w-3 h-3" />
                    محبوب‌ترین‌ها
                  </h4>
                  <div className="space-y-1">
                    {popularItems.map(item => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-all group"
                      >
                        <span className="text-xs text-white/60 group-hover:text-purple-300 transition-colors line-clamp-1">
                          {item.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* LEVEL 2 & 3: Groups and Items */}
            <div className="col-span-6 p-6 flex flex-col min-h-0">
              {activeCat ? (
                <div className="transition-opacity duration-150 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Category Header */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-1">
                        {activeCat.icon && React.createElement(activeCat.icon, { className: "w-6 h-6 text-purple-400" })}
                        <h2 className="text-2xl font-bold text-white">{activeCat.title}</h2>
                      </div>
                      <p className="text-xs text-white/50">{activeCat.groups.length} گروه محصول</p>
                    </div>

                    {/* LEVEL 2: Groups Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {activeCat.groups.map((group, idx) => {
                        const isActiveGrp = activeGroup === group.id;
                        const groupHref = `/products/${activeCat.slug}/${group.slug}`;
                        
                        return (
                          <div
                            key={group.id}
                            onMouseEnter={() => handleGroupHover(group.id)}
                            className={`
                              group relative p-4 rounded-xl border transition-all duration-200 text-right
                              ${isActiveGrp
                                ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/40'
                                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <Link 
                                href={groupHref}
                                className="flex items-center gap-2 z-10 hover:opacity-80 transition-opacity"
                              >
                                <Layers className={`w-4 h-4 ${isActiveGrp ? 'text-blue-300' : 'text-white/50'}`} />
                                <h3 className={`font-bold text-sm ${isActiveGrp ? 'text-white' : 'text-white/80'}`}>
                                  {group.title}
                                </h3>
                              </Link>
                              <button
                                onClick={() => {
                                  startTransition(() => {
                                    setActiveGroup(isActiveGrp ? null : group.id);
                                  });
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                isActiveGrp ? 'bg-blue-500/30 text-blue-200' : 'bg-white/10 text-white/50'
                              }`}>
                                {group.items.length}
                              </button>
                            </div>
                            
                            <div 
                              className="cursor-pointer"
                              onClick={() => {
                                startTransition(() => {
                                  setActiveGroup(isActiveGrp ? null : group.id);
                                });
                              }}
                            >
                              <p className="text-xs text-white/50 mb-3">
                                {group.items.slice(0, 2).map(i => i.title).join(' • ')}
                              </p>

                              <ChevronLeft className={`w-4 h-4 transition-all ${
                                isActiveGrp 
                                  ? 'text-blue-300 -translate-x-1' 
                                  : 'text-white/30 group-hover:-translate-x-1'
                              }`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* LEVEL 3: Child Groups (when group has children) OR Items List */}
                    {activeGrp && (
                      activeGrp.children && activeGrp.children.length > 0 ? (
                        <div
                          key={activeGrp.id}
                          className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Layers className="w-4 h-4 text-purple-300" />
                            <Link 
                              href={`/products/${activeCat.slug}/${activeGrp.slug}`}
                              className="font-bold text-base text-white hover:text-purple-300 transition-colors"
                            >
                              زیرگروه‌های {activeGrp.title}
                            </Link>
                            <span className="text-[10px] text-white/40">({activeGrp.children.length} مورد)</span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {activeGrp.children.map(child => {
                              const isActiveChild = activeChildGroup === child.id;
                              const childHref = `/products/${activeCat.slug}/${activeGrp.slug}/${child.slug}`;
                              
                              return (
                                <div
                                  key={child.id}
                                  onMouseEnter={() => {
                                    startTransition(() => {
                                      setActiveChildGroup(child.id);
                                    });
                                  }}
                                  className={`
                                    group flex items-center justify-between p-3 rounded-xl border transition-all text-right
                                    ${isActiveChild
                                      ? 'bg-gradient-to-l from-blue-600/20 to-purple-600/20 border-blue-400/40'
                                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Link 
                                      href={childHref}
                                      className={`text-sm font-bold truncate hover:text-purple-300 transition-colors z-10 ${isActiveChild ? 'text-white' : 'text-white/80'}`}
                                    >
                                      {child.title}
                                    </Link>
                                  </div>
                                  <div 
                                    className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
                                    onClick={() => {
                                      startTransition(() => {
                                        setActiveChildGroup(isActiveChild ? null : child.id);
                                      });
                                    }}
                                  >
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                      isActiveChild ? 'bg-blue-500/30 text-blue-200' : 'bg-white/10 text-white/50'
                                    }`}>
                                      {child.items.length}
                                    </span>
                                    <ChevronLeft className={`w-4 h-4 transition-all ${
                                      isActiveChild ? 'text-blue-300 -translate-x-1' : 'text-white/30 group-hover:-translate-x-1'
                                    }`} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {activeChildGrp && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <div className="flex items-center gap-2 mb-3">
                                <Package className="w-4 h-4 text-purple-300" />
                                <h5 className="font-bold text-sm text-white">{activeChildGrp.title}</h5>
                                <span className="text-[10px] text-white/40">({activeChildGrp.items.length} محصول)</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2.5">
                                {activeChildGrp.items.map(item => (
                                  <Link
                                    key={item.id}
                                    href={item.href}
                                    onMouseEnter={() => {
                                      startTransition(() => {
                                        setPreviewItem(item);
                                      });
                                    }}
                                    onMouseLeave={() => {
                                      startTransition(() => {
                                        setPreviewItem(null);
                                      });
                                    }}
                                    className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-purple-400/30 transition-all"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {item.isNew && (
                                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-bold">
                                          جدید
                                        </span>
                                      )}
                                      <span className="text-sm text-white/90 group-hover:text-white truncate">
                                        {item.title}
                                      </span>
                                    </div>
                                    <Eye className="w-4 h-4 text-white/30 group-hover:text-purple-300 flex-shrink-0" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          key={activeGrp.id}
                          className="mt-4 p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-purple-300" />
                            <Link 
                              href={`/products/${activeCat.slug}/${activeGrp.slug}`}
                              className="font-bold text-base text-white hover:text-purple-300 transition-colors"
                            >
                              {activeGrp.title}
                            </Link>
                            <span className="text-[10px] text-white/40">({activeGrp.items.length} محصول)</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            {activeGrp.items.map(item => (
                              <Link
                                key={item.id}
                                href={item.href}
                                onMouseEnter={() => {
                                  startTransition(() => {
                                    setPreviewItem(item);
                                  });
                                }}
                                onMouseLeave={() => {
                                  startTransition(() => {
                                    setPreviewItem(null);
                                  });
                                }}
                                className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-purple-400/30 transition-all"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {item.isNew && (
                                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-bold">
                                      جدید
                                    </span>
                                  )}
                                  <span className="text-sm text-white/90 group-hover:text-white truncate">
                                    {item.title}
                                  </span>
                                </div>
                                <Eye className="w-4 h-4 text-white/30 group-hover:text-purple-300 flex-shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white/40">
                      <Grid className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>یک دسته‌بندی را انتخاب کنید</p>
                    </div>
                  </div>
              )}
            </div>

            {/* LEVEL 4: Live Preview Panel */}
            <div className="col-span-4 bg-gradient-to-br from-purple-900/10 to-blue-900/10 border-r border-white/5 p-5 transition-opacity duration-200 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">پیش‌نمایش سریع</h3>
                </div>

                {previewItem ? (
                  <div
                    key={previewItem.id}
                    className="flex-1 transition-opacity duration-150 overflow-hidden"
                    style={{ opacity: 1 }}
                  >
                      {/* Product Preview Card */}
                      <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-5 border border-purple-400/30 h-full flex flex-col">
                        {/* Product Image */}
                        {previewItem.image && (
                          <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-black/20">
                            <Image
                              src={previewItem.image}
                              alt={previewItem.title}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%232d1b4e" width="300" height="200"/%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        )}

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-3">
                            {previewItem.isNew && (
                              <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                جدید
                              </span>
                            )}
                            {previewItem.isPopular && (
                              <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs font-bold flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                محبوب
                              </span>
                            )}
                          </div>

                          <h4 className="text-xl font-bold text-white mb-3 leading-tight">
                            {previewItem.title}
                          </h4>

                          {/* Price Info */}
                          {previewItem.price && (
                            <div className="mb-4">
                              {previewItem.discount ? (
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl font-bold text-green-400">
                                    {(previewItem.price * (1 - previewItem.discount / 100)).toLocaleString('fa-IR')} تومان
                                  </span>
                                  <span className="text-sm text-white/40 line-through">
                                    {previewItem.price.toLocaleString('fa-IR')}
                                  </span>
                                  <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold">
                                    {previewItem.discount}٪
                                  </span>
                                </div>
                              ) : (
                                <span className="text-2xl font-bold text-white">
                                  {previewItem.price.toLocaleString('fa-IR')} تومان
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <Link
                          href={previewItem.href}
                          className="mt-auto w-full bg-gradient-to-l from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-purple-500/20"
                        >
                          <span>مشاهده جزئیات</span>
                          <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                      </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {previewSections.length > 0 ? (
                      <div className="space-y-4">
                        {previewSections.map(section => (
                          <div
                            key={section.id}
                            className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-5 border border-purple-400/30 hover:border-purple-400/50 transition-all group"
                          >
                            {/* Section Image */}
                            {section.image && (
                              <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 bg-black/20">
                                <Image
                                  src={section.image}
                                  alt={section.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%232d1b4e" width="300" height="200"/%3E%3C/svg%3E';
                                  }}
                                />
                              </div>
                            )}

                            {/* Section Info */}
                            <h4 className="text-lg font-bold text-white mb-2 leading-tight">
                              {section.title}
                            </h4>
                            
                            {section.description && (
                              <p className="text-sm text-white/70 mb-4 line-clamp-2">
                                {section.description}
                              </p>
                            )}

                            {/* CTA Button */}
                            <Link
                              href={section.buttonLink}
                              className="w-full bg-gradient-to-l from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 group"
                            >
                              <span>{section.buttonText}</span>
                              <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-white/30">
                          <Eye className="w-20 h-20 mx-auto opacity-20" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Access Footer */}
          <div className="border-t border-white/5 bg-black/30 backdrop-blur-xl">
            <div className="px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <Link href="/products" className="flex items-center gap-2 text-white/60 hover:text-white transition group">
                  <Grid className="w-4 h-4" />
                  <span>همه محصولات</span>
                  <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <Link href="/new" className="flex items-center gap-2 text-white/60 hover:text-green-300 transition group">
                  <Sparkles className="w-4 h-4" />
                  <span>جدیدترین‌ها</span>
                </Link>
                <Link href="/popular" className="flex items-center gap-2 text-white/60 hover:text-yellow-300 transition group">
                  <TrendingUp className="w-4 h-4" />
                  <span>پرفروش‌ترین‌ها</span>
                </Link>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>{menuCategories.reduce((acc, cat) => acc + cat.groups.reduce((a, g) => a + g.items.length, 0), 0)} محصول</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Mobile Menu Panel
  const MobileMegaMenuPanel = () => (
    <div
      className="mega-menu-animated overflow-hidden"
      style={{ 
        animation: 'slideDownFadeIn 0.2s ease-out forwards'
      }}
    >
      <div 
        className="rounded-2xl mx-2 my-2 overflow-hidden max-h-[80vh] overflow-y-auto"
        style={{
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          background: 'rgba(30, 20, 60, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="p-4 space-y-3">
          {/* Search Box */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="جستجو در محصولات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-400/50 focus:outline-none transition-all"
            />
          </div>

          {/* Categories Accordion */}
          {menuCategories.map((category, idx) => {
            const Icon = category.icon || Grid;
            const isActive = activeCategory === category.id;
            const categoryHref = category.slug ? `/products/${category.slug}` : '/products';
            
            console.log('Mobile Category Link:', category.title, '→', categoryHref);
            
            return (
              <div key={category.id} className="border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-stretch">
                  <Link
                    href={categoryHref}
                    className="flex-1 p-4 flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <Icon className="w-5 h-5 text-purple-300" />
                    <span className="font-bold text-white">{category.title}</span>
                    <span className="text-xs text-white/40">({category.groups.length})</span>
                  </Link>
                  <button
                    onClick={() => setActiveCategory(isActive ? null : category.id)}
                    className="px-4 flex items-center bg-white/5 hover:bg-white/10 transition-all border-r border-white/10"
                  >
                    <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isActive && (
                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{ maxHeight: isActive ? '1000px' : '0' }}
                  >
                      <div className="p-3 space-y-2 bg-black/20">
                        {category.groups.map(group => (
                          <div key={group.id} className="space-y-1">
                            <div className="font-semibold text-sm text-purple-300 px-3 py-2">
                              {group.title}
                            </div>
                            {group.items.map(item => (
                              <Link
                                key={item.id}
                                href={item.href}
                                className="block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <span>{item.title}</span>
                                  {item.isNew && (
                                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-bold">
                                      جدید
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}

          {/* Quick Links */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
            <Link href="/products" className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition">
              <Grid className="w-4 h-4" />
              <span>همه محصولات</span>
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/new" className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition">
              <Sparkles className="w-4 h-4" />
              <span>جدیدها</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Menu Trigger */}
      <div className="hidden lg:flex h-full items-center relative">
        <button
          onMouseEnter={() => setIsMenuOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white hover:text-purple-300 transition-all duration-200 font-semibold rounded-xl hover:bg-white/10 backdrop-blur-sm"
        >
          <Grid className="w-5 h-5" />
          <span>دسته بندی ها</span>
          <div
            className="transition-transform duration-200"
            style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>
        
        {/* Desktop Mega Menu Panel - absolute positioned relative to trigger */}
        {isMenuOpen && menuCategories.length > 0 && <DesktopMegaMenuPanel />}
      </div>

      {/* Mobile Menu */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="flex items-center gap-2 px-4 py-2 text-white hover:text-purple-300 transition-all duration-200 font-semibold rounded-xl hover:bg-white/10 backdrop-blur-sm"
        >
          <Grid className="w-5 h-5" />
          <span>دسته بندی ها</span>
          <div
            className="transition-transform duration-200"
            style={{ transform: isMobileExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {/* Mobile Mega Menu Panel */}
        {isMobileExpanded && <MobileMegaMenuPanel />}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed top-20 left-0 right-0 flex justify-center py-4 pointer-events-none z-[9999]">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/20 backdrop-blur-xl border border-purple-400/30">
            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white/80 text-sm">در حال بارگذاری...</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MegaMenu;