"use client";
import React, { useEffect, useState } from 'react';
import { Upload, X, Image as ImageIcon, Plus, Trash2, Eye, EyeOff, GripVertical, Save, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface MegaMenuItem {
  id: string;
  title: string;
  href: string;
  image?: string;
  price?: number;
  discount?: number;
  isNew?: boolean;
  isPopular?: boolean;
  description?: string;
  enabled: boolean;
  order: number;
}

interface MegaMenuGroup {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  order: number;
  items: MegaMenuItem[];
  children?: MegaMenuGroup[];  // زیرگروه‌های تودرتو
}

interface MegaMenuCategory {
  id: string;
  title: string;
  slug: string;
  icon: string;
  color?: string;
  description?: string;
  enabled: boolean;
  order: number;
  groups: MegaMenuGroup[];
}

interface PreviewSection {
  id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  enabled: boolean;
  position: 'left' | 'right';
  order: number;
}

interface CategoryFromDB {
  id: string;  // Changed from _id to id
  name: string;
  slug: string;
  active: boolean;
  order: number;
  parentId?: string | null;
}

export default function MegaMenuSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<MegaMenuCategory[]>([]);
  const [previewSections, setPreviewSections] = useState<PreviewSection[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'preview'>('categories');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<CategoryFromDB[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedGroupCategoryId, setSelectedGroupCategoryId] = useState<string>("");
  const [dataSource, setDataSource] = useState<'cache' | 'database' | null>(null);

  useEffect(() => {
    console.log('🚀 MegaMenu page loaded - v2');
    loadData();
  }, []);

  // تابع برای ایجاد نمایش سلسله مراتبی دسته‌ها
  const buildCategoryHierarchy = (categories: CategoryFromDB[]) => {
    // ساخت یک map برای دسترسی سریع به دسته‌ها
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    
    // تابع بازگشتی برای ساخت مسیر دسته
    const buildPath = (catId: string, depth = 0): { category: CategoryFromDB; depth: number; prefix: string } | null => {
      const cat = categoryMap.get(catId);
      if (!cat) return null;
      
      const prefix = '-'.repeat(depth);
      return { category: cat, depth, prefix };
    };
    
    // ساخت لیست سلسله مراتبی
    const hierarchicalList: { category: CategoryFromDB; depth: number; prefix: string }[] = [];
    
    // ابتدا دسته‌های اصلی (بدون parent)
    const rootCategories = categories.filter(cat => !cat.parentId).sort((a, b) => a.order - b.order);
    
    // تابع بازگشتی برای اضافه کردن دسته و زیردسته‌هایش
    const addCategoryAndChildren = (catId: string, depth = 0) => {
      const cat = categoryMap.get(catId);
      if (!cat) return;
      
      const prefix = depth > 0 ? '-'.repeat(depth) + ' ' : '';
      hierarchicalList.push({ category: cat, depth, prefix });
      
      // پیدا کردن و اضافه کردن زیردسته‌ها
      const children = categories
        .filter(c => c.parentId === catId)
        .sort((a, b) => a.order - b.order);
      
      children.forEach(child => {
        addCategoryAndChildren(child.id, depth + 1);
      });
    };
    
    // اضافه کردن همه دسته‌های اصلی و زیردسته‌هایشان
    rootCategories.forEach(cat => {
      addCategoryAndChildren(cat.id, 0);
    });
    
    return hierarchicalList;
  };

  const loadData = async (bypassCache = false) => {
    setLoading(true);
    try {
      // Load mega menu settings
      console.log('🔄 Loading mega menu settings...');
      const res = await fetch('/api/admin/mega-menu-settings');
      const json = await res.json();
      console.log('📦 Mega menu response:', json);
      
      if (json.success && json.data) {
        const cats = json.data.categories || [];
        const previews = json.data.previewSections || [];
        console.log('✅ Loaded categories:', cats.length);
        console.log('✅ Loaded preview sections:', previews.length);
        setCategories(cats);
        setPreviewSections(previews);
      }
      
      // Load available categories from database
      console.log('🔄 Loading available categories...');
      const catUrl = bypassCache ? '/api/admin/categories?bypass=true' : '/api/admin/categories';
      const catRes = await fetch(catUrl);
      const catJson = await catRes.json();
      console.log('📦 Categories API response:', catJson);
      console.log('📦 Response success:', catJson.success);
      console.log('📦 Response data type:', typeof catJson.data);
      console.log('📦 Response data:', catJson.data);
      
      if (catJson.success && catJson.data) {
        const dataArray = Array.isArray(catJson.data) ? catJson.data : [];
        console.log('✅ Available categories count:', dataArray.length);
        console.log('✅ Available categories:', dataArray);
        console.log('📊 Data source:', catJson.source || 'unknown');
        setAvailableCategories(dataArray);
        setDataSource(catJson.source || null);
        
        // Show success message if bypassed cache
        if (bypassCache) {
          setMessage(`✅ ${dataArray.length} دسته‌بندی از دیتابیس بارگذاری شد (کش پاک شد)`);
          setTimeout(() => setMessage(''), 3000);
        }
      } else {
        console.warn('⚠️ Categories API returned no data or failed');
        setAvailableCategories([]);
        setDataSource(null);
      }
    } catch (err) {
      console.error('❌ Error loading mega menu:', err);
      setMessage('❌ خطا در بارگذاری: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Image upload handler - only for preview sections now
  const handleImageUpload = async (file: File, type: 'preview', id: string) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('لطفاً یک تصویر معتبر انتخاب کنید');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'megamenu');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      
      if (json.success && json.url) {
        if (type === 'preview') {
          updatePreviewSection(id, { image: json.url });
        }
      } else {
        alert('خطا در آپلود تصویر');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('خطا در آپلود تصویر');
    } finally {
      setUploadingImage(false);
    }
  };

  // Category operations
  const addCategory = (categoryId: string) => {
    console.log('🔍 addCategory called with:', categoryId);
    const dbCategory = availableCategories.find(c => c.id === categoryId);
    console.log('🔍 Found DB category:', dbCategory);
    
    if (!dbCategory) {
      console.error('❌ Category not found in availableCategories');
      alert('دسته‌بندی یافت نشد');
      return;
    }
    
    // Check if already added
    if (categories.find(c => c.id === categoryId)) {
      console.warn('⚠️ Category already exists');
      alert('این دسته‌بندی قبلاً اضافه شده است');
      return;
    }

    // مهم: هنگام افزودن دسته اصلی، گروه‌ها به صورت خودکار از زیردسته‌ها ساخته نشوند.
    // کاربر باید گروه‌ها/زیردسته‌ها را دستی و یکی‌یکی اضافه کند.
    
    const newCat: MegaMenuCategory = {
      id: dbCategory.id,
      title: dbCategory.name,
      slug: dbCategory.slug,
      icon: 'Package',
      color: 'purple',
      description: '',
      enabled: true,
      order: categories.length,
      groups: []
    };
    
    console.log('✅ Adding new category:', newCat);
    setCategories(prev => {
      const updated = [...prev, newCat];
      console.log('📝 Updated categories:', updated);
      return updated;
    });
    setExpandedCategory(newCat.id);
  };

  const updateCategory = (id: string, updates: Partial<MegaMenuCategory>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  };

  const deleteCategory = (id: string) => {
    if (!confirm('آیا از حذف این دسته مطمئن هستید?')) return;
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  // Group operations - پشتیبانی از چند سطح
  const addGroup = (catId: string, selectedSubCatId?: string, parentGroupId?: string) => {
    console.log('🔍 addGroup called for category:', catId, 'with subcategory:', selectedSubCatId, 'parent:', parentGroupId);
    
    // پیدا کردن دسته انتخاب شده برای گروه
    const selectedSubCat = selectedSubCatId 
      ? availableCategories.find(c => c.id === selectedSubCatId)
      : null;
    
    const newGroup: MegaMenuGroup = {
      id: `group_${Date.now()}`,
      title: selectedSubCat?.name || 'گروه جدید',
      description: selectedSubCat ? `/${selectedSubCat.slug}` : '',
      enabled: true,
      order: 0,
      items: [],
      children: []
    };

    // تابع بازگشتی برای افزودن زیرگروه به هر سطح
    const addChildToGroup = (groups: MegaMenuGroup[], targetId: string): MegaMenuGroup[] => {
      return groups.map(group => {
        if (group.id === targetId) {
          newGroup.order = (group.children || []).length;
          return { ...group, children: [...(group.children || []), newGroup] };
        }
        if (group.children && group.children.length > 0) {
          return { ...group, children: addChildToGroup(group.children, targetId) };
        }
        return group;
      });
    };

    setCategories(prev => {
      const updated = prev.map(cat => {
        if (cat.id === catId) {
          if (parentGroupId) {
            // افزودن به یک گروه والد
            return { ...cat, groups: addChildToGroup(cat.groups, parentGroupId) };
          } else {
            // افزودن به سطح اول
            newGroup.order = cat.groups.length;
            console.log('✅ Adding group to category:', cat.title);
            return { ...cat, groups: [...cat.groups, newGroup] };
          }
        }
        return cat;
      });
      console.log('📝 Updated categories after adding group:', updated);
      return updated;
    });
    setExpandedGroup(newGroup.id);
  };

  // تابع بازگشتی برای آپدیت گروه در هر سطح
  const updateGroupRecursive = (groups: MegaMenuGroup[], groupId: string, updates: Partial<MegaMenuGroup>): MegaMenuGroup[] => {
    return groups.map(group => {
      if (group.id === groupId) {
        return { ...group, ...updates };
      }
      if (group.children && group.children.length > 0) {
        return { ...group, children: updateGroupRecursive(group.children, groupId, updates) };
      }
      return group;
    });
  };

  const updateGroup = (catId: string, groupId: string, updates: Partial<MegaMenuGroup>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === catId ? {
        ...cat,
        groups: updateGroupRecursive(cat.groups, groupId, updates)
      } : cat
    ));
  };

  // تابع بازگشتی برای حذف گروه از هر سطح
  const deleteGroupRecursive = (groups: MegaMenuGroup[], groupId: string): MegaMenuGroup[] => {
    return groups
      .filter(group => group.id !== groupId)
      .map(group => ({
        ...group,
        children: group.children ? deleteGroupRecursive(group.children, groupId) : []
      }));
  };

  const deleteGroup = (catId: string, groupId: string) => {
    if (!confirm('آیا از حذف این گروه مطمئن هستید?')) return;
    setCategories(prev => prev.map(cat => 
      cat.id === catId ? {
        ...cat,
        groups: deleteGroupRecursive(cat.groups, groupId)
      } : cat
    ));
  };

  // Preview Section operations
  const addPreviewSection = () => {
    const newSection: PreviewSection = {
      id: `preview_${Date.now()}`,
      title: 'پیش‌نمایش سریع',
      description: 'مدل نمایشی طرح جدید • تست جدید',
      image: '',
      buttonText: 'مشاهده جزئیات',
      buttonLink: '#',
      enabled: true,
      position: 'left',
      order: previewSections.length
    };
    setPreviewSections(prev => [...prev, newSection]);
  };

  const updatePreviewSection = (id: string, updates: Partial<PreviewSection>) => {
    setPreviewSections(prev => prev.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ));
  };

  const deletePreviewSection = (id: string) => {
    if (!confirm('آیا از حذف این بخش مطمئن هستید?')) return;
    setPreviewSections(prev => prev.filter(section => section.id !== id));
  };

  // state برای انتخاب زیرگروه در هر سطح
  const [subGroupSelections, setSubGroupSelections] = useState<Record<string, string>>({});

  // تابع برای گرفتن همه گروه‌های یک category به صورت فلت
  const getAllGroupsFlat = (groups: MegaMenuGroup[]): { id: string; title: string; description?: string }[] => {
    let result: { id: string; title: string; description?: string }[] = [];
    for (const group of groups) {
      result.push({ id: group.id, title: group.title, description: group.description });
      if (group.children && group.children.length > 0) {
        result = [...result, ...getAllGroupsFlat(group.children)];
      }
    }
    return result;
  };

  // تابع بازگشتی برای رندر گروه‌ها در چند سطح
  const renderGroups = (groups: MegaMenuGroup[], catId: string, level: number, allCategoryGroups: { id: string; title: string; description?: string }[]): React.ReactNode => {
    console.log(`🔍 renderGroups called - level: ${level}, allCategoryGroups:`, allCategoryGroups);
    
    const levelColors = [
      'border-blue-500/30 bg-blue-900/10',
      'border-green-500/30 bg-green-900/10', 
      'border-yellow-500/30 bg-yellow-900/10',
      'border-pink-500/30 bg-pink-900/10',
      'border-cyan-500/30 bg-cyan-900/10'
    ];
    const colorClass = levelColors[level % levelColors.length];

    return groups.map((group) => {
      // Find the category corresponding to this group to show its subcategories
      const currentGroupSlug = group.description?.replace(/^\/+|\/+$/g, '');
      const currentGroupCategory = availableCategories.find(c => c.slug === currentGroupSlug);
      const availableSubCategories = currentGroupCategory 
        ? availableCategories.filter(c => c.parentId === currentGroupCategory.id)
        : [];

      // فقط گروه‌های هم‌سطح (مرتبط با همین parent) برای انتخاب/کپی در سطوح > 0
      const peerGroups = groups
        .filter(g => g.id !== group.id)
        .map(g => ({ id: g.id, title: g.title, description: g.description }));

      // فقط فرزندان همین گروه برای «کپی از گروه‌های موجود» هنگام افزودن زیرگروه
      const childGroupsFlat = getAllGroupsFlat(group.children || []).filter(g => g.id !== group.id);

      return (
      <div 
        key={group.id} 
        className={`rounded-xl p-4 border ${colorClass}`}
        style={{ marginRight: `${level * 20}px` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {level === 0 ? 'گروه سطح اول' : `زیرگروه سطح ${level + 1}`}
              </label>
              {level === 0 ? (
                // سطح اول: از دسته‌های دیتابیس با نمایش سلسله مراتبی
                <select
                  value={currentGroupCategory?.id || ''}
                  onChange={(e) => {
                    const selectedCat = availableCategories.find(c => c.id === e.target.value);
                    if (selectedCat) {
                      updateGroup(catId, group.id, { 
                        title: selectedCat.name,
                        description: `/${selectedCat.slug}`
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  <option value="" className="bg-gray-800 text-gray-400">انتخاب دسته...</option>
                  {buildCategoryHierarchy(availableCategories).map(({ category, depth, prefix }) => (
                    <option key={category.id} value={category.id} className="bg-gray-800 text-white">
                      {prefix}{category.name}
                    </option>
                  ))}
                </select>
              ) : (
                // سطوح بعدی: فقط از گروه‌های موجود در این category
                <select
                  value={group.id}
                  onChange={(e) => {
                    const selectedGroup = peerGroups.find(g => g.id === e.target.value);
                    if (selectedGroup) {
                      updateGroup(catId, group.id, { 
                        title: selectedGroup.title,
                        description: selectedGroup.description
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  <option value={group.id} disabled className="bg-gray-800 text-gray-400">
                    {group.title}
                  </option>
                  {peerGroups.length > 0 && (
                    <optgroup label="گروه‌های هم‌سطح (مرتبط)">
                      {peerGroups.map(g => (
                        <option key={g.id} value={g.id} className="bg-gray-800 text-white">
                          {g.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">لینک</label>
              <input
                type="text"
                value={group.description || ''}
                onChange={(e) => updateGroup(catId, group.id, { description: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                placeholder="/slug"
                readOnly
              />
            </div>
          </div>
          <button
            onClick={() => updateGroup(catId, group.id, { enabled: !group.enabled })}
            className={`p-2 rounded-lg ${group.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
          >
            {group.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => deleteGroup(catId, group.id)}
            className="p-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* بخش افزودن زیرگروه - از دیتابیس یا کپی از موجود */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
          <label className="text-xs text-gray-400">افزودن زیرگروه:</label>
          <select
            value={subGroupSelections[group.id] || ''}
            onChange={(e) => setSubGroupSelections(prev => ({ ...prev, [group.id]: e.target.value }))}
            className="flex-1 px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm [&>option]:bg-gray-800 [&>option]:text-white"
          >
            <option value="" className="bg-gray-800 text-gray-400">انتخاب زیرگروه...</option>
            
            {/* Option 1: Available Sub-categories from Database */}
            {availableSubCategories.length > 0 && (
              <optgroup label="زیردسته‌های موجود در دیتابیس">
                {availableSubCategories.map(subCat => (
                  <option key={subCat.id} value={subCat.id} className="bg-gray-800 text-white">
                    {subCat.name} ({subCat.slug})
                  </option>
                ))}
              </optgroup>
            )}

            {/* Option 2: Existing Groups (Copy) */}
            {childGroupsFlat.length > 0 && (
              <optgroup label="کپی از گروه‌های موجود">
                {childGroupsFlat.map(g => (
                    <option key={g.id} value={g.id} className="bg-gray-800 text-white">
                      {g.title} {g.description ? `(${g.description})` : ''}
                    </option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            onClick={() => {
              const selectedId = subGroupSelections[group.id];
              if (selectedId) {
                // Check if it's a database category
                const isDbCategory = availableSubCategories.find(c => c.id === selectedId);
                
                if (isDbCategory) {
                  // Add new group from DB category
                  console.log('Adding new subgroup from DB:', isDbCategory);
                  addGroup(catId, selectedId, group.id);
                } else {
                  // Existing logic for copying group
                  const selectedGroup = childGroupsFlat.find(g => g.id === selectedId);
                  if (selectedGroup) {
                    console.log('Copying existing group:', selectedGroup);
                    addGroup(catId, undefined, group.id);
                    // بعد از افزودن، تنظیم title و description
                    setTimeout(() => {
                      setCategories(prev => {
                        const updateNestedGroup = (groups: MegaMenuGroup[]): MegaMenuGroup[] => {
                          return groups.map(g => {
                            if (g.id === group.id && g.children) {
                              const lastChild = g.children[g.children.length - 1];
                              if (lastChild) {
                                return {
                                  ...g,
                                  children: g.children.map((child, idx) => 
                                    idx === g.children!.length - 1 
                                      ? { ...child, title: selectedGroup.title, description: selectedGroup.description }
                                      : child
                                  )
                                };
                              }
                            }
                            if (g.children) {
                              return { ...g, children: updateNestedGroup(g.children) };
                            }
                            return g;
                          });
                        };
                        return prev.map(cat => 
                          cat.id === catId 
                            ? { ...cat, groups: updateNestedGroup(cat.groups) }
                            : cat
                        );
                      });
                    }, 50);
                  }
                }
                setSubGroupSelections(prev => ({ ...prev, [group.id]: '' }));
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-medium"
          >
            <Plus className="w-3 h-3" />
            زیرگروه
          </button>
        </div>

        {/* رندر زیرگروه‌ها به صورت بازگشتی */}
        {group.children && group.children.length > 0 && (
          <div className="mt-3 space-y-2">
            {renderGroups(group.children, catId, level + 1, allCategoryGroups)}
          </div>
        )}
      </div>
      );
    });
  };

  // Save all data
  const saveAll = async () => {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        categories,
        previewSections
      };
      
      console.log('💾 Saving mega menu data:', payload);
      console.log('📊 Categories count:', categories.length);
      console.log('📊 Preview sections count:', previewSections.length);

      const res = await fetch('/api/admin/mega-menu-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      console.log('📦 Save response:', json);
      
      if (json.success) {
        setMessage('✅ تنظیمات با موفقیت ذخیره شد');
        setTimeout(() => setMessage(''), 3000);
      } else {
        console.error('❌ Save failed:', json.error);
        setMessage('❌ خطا در ذخیره: ' + (json.error || 'نامشخص'));
      }
    } catch (err) {
      console.error('❌ Save error:', err);
      setMessage('❌ خطای شبکه: ' + (err as any).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          مدیریت مگامنو
        </h1>
        <p className="text-gray-400">تنظیمات کامل مگامنو با قابلیت آپلود تصویر و مدیریت جزئیات</p>
      </div>

      {/* Debug Info Panel */}
      {availableCategories.length === 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h3 className="text-red-400 font-bold mb-2">⚠️ هشدار: دسته‌بندی‌ها بارگذاری نشدند</h3>
          <div className="text-sm text-red-300 space-y-1">
            <p>• تعداد دسته‌های موجود: {availableCategories.length}</p>
            <p>• وضعیت بارگذاری: {loading ? 'در حال بارگذاری...' : 'تمام شده'}</p>
            <p>• لطفاً کنسول مرورگر (F12) را برای جزئیات بیشتر بررسی کنید</p>
            <button
              onClick={() => loadData(true)}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              بارگذاری مجدد از دیتابیس (دور زدن کش)
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3 font-semibold transition-all relative ${
            activeTab === 'categories'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          دسته‌بندی‌ها و محصولات
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-6 py-3 font-semibold transition-all relative ${
            activeTab === 'preview'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          بخش‌های پیش‌نمایش
        </button>
      </div>

      {/* Categories Tab - Simplified for now, can add full version after */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/30 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  افزودن دسته‌بندی به مگا منو
                  {dataSource && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      dataSource === 'cache' 
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    }`}>
                      {dataSource === 'cache' ? '📦 از کش' : '🔄 از دیتابیس'}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-400">
                  دسته‌بندی‌های موجود در سایت را به مگا منو اضافه کنید
                  {dataSource === 'cache' && (
                    <span className="text-yellow-400 mr-2">
                      (برای دیدن آخرین تغییرات روی "بارگذاری مجدد" کلیک کنید)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    console.log('📌 Select changed to:', e.target.value);
                    console.log('📌 availableCategories length:', availableCategories.length);
                    console.log('📌 availableCategories:', availableCategories);
                    setSelectedCategoryId(e.target.value);
                  }}
                  className="min-w-[280px] px-4 py-3 bg-white/10 border-2 border-purple-500/50 rounded-lg text-white font-medium hover:border-purple-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all cursor-pointer [&>option]:bg-gray-900 [&>option]:text-white [&>option]:py-2"
                >
                  <option value="" className="bg-gray-900 text-gray-400">
                    {availableCategories.length === 0 
                      ? 'در حال بارگذاری دسته‌بندی‌ها...'
                      : `انتخاب دسته‌بندی... (${availableCategories.filter(cat => !categories.find(c => c.id === cat.id)).length} مورد موجود)`
                    }
                  </option>
                  {buildCategoryHierarchy(availableCategories)
                    .filter(({ category }) => !categories.find(c => c.id === category.id))
                    .map(({ category, depth, prefix }) => (
                      <option key={category.id} value={category.id} className="bg-gray-900 text-white py-2">
                        {prefix}{category.name} ({category.slug})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔵 Add button clicked!');
                    console.log('📌 selectedCategoryId:', selectedCategoryId);
                    console.log('📌 availableCategories:', availableCategories);
                    
                    if (selectedCategoryId) {
                      addCategory(selectedCategoryId);
                      setSelectedCategoryId("");
                    } else {
                      alert('لطفاً ابتدا یک دسته‌بندی انتخاب کنید');
                    }
                  }}
                  disabled={availableCategories.filter(cat => !categories.find(c => c.id === cat.id)).length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-bold shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  افزودن به مگا منو
                </button>
                <button
                  type="button"
                  onClick={() => loadData(true)}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-white font-medium shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2"
                  title="بارگذاری مجدد دسته‌بندی‌ها از دیتابیس"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  بارگذاری مجدد
                </button>
              </div>
            </div>
            {availableCategories.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400 flex items-center gap-2">
                  ⚠️ در حال بارگذاری دسته‌بندی‌ها از دیتابیس... اگر این پیام همچنان نمایش داده می‌شود، لطفاً کنسول مرورگر را بررسی کنید.
                </p>
                <p className="text-xs text-yellow-300 mt-2">
                  تعداد دسته‌های موجود: {availableCategories.length}
                </p>
              </div>
            )}
            
            {/* Debug panel - show all categories info */}
            {availableCategories.length > 0 && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
                <details className="cursor-pointer">
                  <summary className="text-sm text-blue-400 font-semibold">
                    🔍 اطلاعات تشخیصی (Debug Info)
                  </summary>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="p-2 bg-white/5 rounded">
                      <p className="text-blue-300 font-medium mb-1">همه دسته‌بندی‌های موجود در دیتابیس ({availableCategories.length}):</p>
                      <div className="text-gray-300 space-y-1">
                        {availableCategories.map(cat => (
                          <div key={cat.id} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${cat.active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                            <span>{cat.name}</span>
                            <span className="text-gray-500">({cat.slug})</span>
                            <span className="text-gray-500">ID: {cat.id}</span>
                            {!cat.active && <span className="text-red-400 text-xs">[غیرفعال]</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-2 bg-white/5 rounded">
                      <p className="text-purple-300 font-medium mb-1">دسته‌های اضافه شده به مگا منو ({categories.length}):</p>
                      <div className="text-gray-300 space-y-1">
                        {categories.length === 0 ? (
                          <p className="text-gray-500">هیچ دسته‌ای به مگا منو اضافه نشده</p>
                        ) : (
                          categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                              <span>{cat.title}</span>
                              <span className="text-gray-500">({cat.slug})</span>
                              <span className="text-gray-500">ID: {cat.id}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div className="p-2 bg-white/5 rounded">
                      <p className="text-green-300 font-medium mb-1">دسته‌های قابل اضافه کردن ({availableCategories.filter(cat => !categories.find(c => c.id === cat.id)).length}):</p>
                      <div className="text-gray-300 space-y-1">
                        {availableCategories.filter(cat => !categories.find(c => c.id === cat.id)).length === 0 ? (
                          <p className="text-gray-500">همه دسته‌ها اضافه شده‌اند</p>
                        ) : (
                          availableCategories
                            .filter(cat => !categories.find(c => c.id === cat.id))
                            .map(cat => (
                              <div key={cat.id} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                <span>{cat.name}</span>
                                <span className="text-gray-500">({cat.slug})</span>
                                <span className="text-gray-500">ID: {cat.id}</span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}
            
            {availableCategories.length > 0 && availableCategories.filter(cat => !categories.find(c => c.id === cat.id)).length === 0 && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 flex items-center gap-2">
                  ✅ همه دسته‌بندی‌های موجود به مگا منو اضافه شده‌اند
                </p>
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-purple-400" />
            دسته‌بندی‌های مگا منو ({categories.length})
          </h2>

          {categories.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-400 mb-4">هیچ دسته‌ای وجود ندارد</p>
              <p className="text-sm text-gray-500">برای شروع یک دسته جدید اضافه کنید</p>
            </div>
          )}

          <div className="space-y-4">
            {categories.map((cat) => {
              // Find this mega-menu category in DB by slug, then get its direct children
              const mainCategory = availableCategories.find(c => c.slug === cat.slug);
              const childCategories = mainCategory
                ? availableCategories.filter(c => c.parentId === mainCategory.id)
                : [];

              // Track which DB categories are already represented as top-level groups
              const usedChildCategoryIds = cat.groups
                .map(g => {
                  const groupSlug = g.description?.replace(/^\/+|\/+$/g, '');
                  if (!groupSlug) return null;
                  return availableCategories.find(c => c.slug === groupSlug)?.id || null;
                })
                .filter((id): id is string => Boolean(id));

              const remainingChildCategories = childCategories.filter(c => !usedChildCategoryIds.includes(c.id));
              const allGroupsFlat = getAllGroupsFlat(cat.groups);

              return (
              <div key={cat.id} className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-semibold">{cat.title}</span>
                      <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">دسته‌بندی اصلی</span>
                      <span className="text-xs text-gray-400">({cat.slug})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => updateCategory(cat.id, { enabled: !cat.enabled })}
                    className={`p-2 rounded-lg ${cat.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                    title={cat.enabled ? 'غیرفعال کردن' : 'فعال کردن'}
                  >
                    {cat.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    title="حذف دسته"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {/* افزودن گروه از گروه‌های موجود در این دسته */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-lg">
                  <label className="text-sm text-gray-300 whitespace-nowrap">افزودن گروه:</label>
                  <select
                    value={selectedGroupCategoryId}
                    onChange={(e) => {
                      console.log('Selected:', e.target.value);
                      console.log('Available categories:', availableCategories);
                      console.log('Current groups:', allGroupsFlat);
                      setSelectedGroupCategoryId(e.target.value);
                    }}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white [&>option]:bg-gray-800 [&>option]:text-white"
                  >
                    <option value="" className="bg-gray-800 text-gray-400">
                      {availableCategories.length === 0
                        ? 'در حال بارگذاری دسته‌ها...'
                        : !mainCategory
                          ? 'این دسته در دیتابیس یافت نشد'
                          : remainingChildCategories.length > 0
                            ? `انتخاب زیردسته (${remainingChildCategories.length} مورد)`
                            : allGroupsFlat.length > 0
                              ? `کپی از گروه‌های موجود (${allGroupsFlat.length} مورد)`
                              : 'این دسته زیردسته‌ای ندارد'
                      }
                    </option>
                    {/* Option 1: Remaining sub-categories from Database */}
                    {remainingChildCategories.length > 0 && (
                      <optgroup label="زیردسته‌های موجود در دیتابیس">
                        {childCategories.map(category => {
                          const displayName = category.name || category.slug || 'بدون نام';
                          const alreadyAdded = usedChildCategoryIds.includes(category.id);
                          return (
                            <option
                              key={category.id}
                              value={category.id}
                              disabled={alreadyAdded}
                              className="bg-gray-800 text-white"
                            >
                              {displayName} ({category.slug}){alreadyAdded ? ' (اضافه شده)' : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}

                    {/* Option 2: Existing Groups (Copy) */}
                    {allGroupsFlat.length > 0 && (
                      <optgroup label="کپی از گروه‌های موجود">
                        {allGroupsFlat.map(g => (
                          <option key={g.id} value={g.id} className="bg-gray-800 text-white">
                            {g.title} {g.description ? `(${g.description})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedGroupCategoryId) {
                        // چک کنیم آیا از دسته‌های دیتابیس انتخاب شده یا از گروه‌های موجود
                        const selectedDbCategory = availableCategories.find(c => c.id === selectedGroupCategoryId);
                        const selectedExistingGroup = allGroupsFlat.find(g => g.id === selectedGroupCategoryId);

                        if (selectedDbCategory) {
                          // جلوگیری از افزودن تکراری
                          if (usedChildCategoryIds.includes(selectedDbCategory.id)) {
                            alert('این زیردسته قبلاً به صورت گروه اضافه شده است');
                          } else {
                            addGroup(cat.id, selectedDbCategory.id);
                          }
                        } else if (selectedExistingGroup) {
                          // کپی از گروه موجود
                          addGroup(cat.id, undefined);
                          setTimeout(() => {
                            setCategories(prev => prev.map(c => {
                              if (c.id === cat.id && c.groups.length > 0) {
                                const lastGroup = c.groups[c.groups.length - 1];
                                return {
                                  ...c,
                                  groups: c.groups.map((g, idx) => 
                                    idx === c.groups.length - 1
                                      ? { ...g, title: selectedExistingGroup.title, description: selectedExistingGroup.description }
                                      : g
                                  )
                                };
                              }
                              return c;
                            }));
                          }, 50);
                        }
                        setSelectedGroupCategoryId('');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {cat.groups.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">
                      هیچ گروهی وجود ندارد. روی "افزودن گروه" کلیک کنید.
                    </p>
                  )}
                  {/* رندر بازگشتی گروه‌ها */}
                  {renderGroups(cat.groups, cat.id, 0, getAllGroupsFlat(cat.groups))}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview Sections Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">بخش‌های پیش‌نمایش</h2>
              <p className="text-sm text-gray-400 mt-1">بخش‌های تبلیغاتی که در سمت چپ مگامنو نمایش داده می‌شوند</p>
            </div>
            <button
              onClick={addPreviewSection}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              افزودن بخش
            </button>
          </div>

          {previewSections.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-gray-400">هیچ بخش پیش‌نمایشی وجود ندارد</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {previewSections.map((section) => (
              <div key={section.id} className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-white">پیش‌نمایش #{section.order + 1}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updatePreviewSection(section.id, { enabled: !section.enabled })}
                      className={`p-2 rounded-lg ${section.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deletePreviewSection(section.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">عنوان</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updatePreviewSection(section.id, { title: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white"
                      placeholder="عنوان بخش"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">توضیحات</label>
                    <textarea
                      value={section.description}
                      onChange={(e) => updatePreviewSection(section.id, { description: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">تصویر</label>
                    {section.image ? (
                      <div className="relative h-32 bg-white/5 rounded-lg overflow-hidden">
                        <Image src={section.image} alt={section.title} fill className="object-cover" />
                        <button
                          onClick={() => updatePreviewSection(section.id, { image: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/10">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">آپلود تصویر</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'preview', section.id);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">متن دکمه</label>
                      <input
                        type="text"
                        value={section.buttonText}
                        onChange={(e) => updatePreviewSection(section.id, { buttonText: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">لینک</label>
                      <input
                        type="text"
                        value={section.buttonLink}
                        onChange={(e) => updatePreviewSection(section.id, { buttonLink: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="sticky bottom-4 mt-8 flex items-center justify-center gap-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-xl p-4 rounded-2xl border border-purple-500/30">
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 rounded-xl text-white font-bold text-lg transition shadow-lg"
        >
          <Save className="w-5 h-5" />
          {saving ? 'در حال ذخیره...' : 'ذخیره تمام تغییرات'}
        </button>
        {message && (
          <span className={`text-sm font-semibold ${message.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </span>
        )}
      </div>

      {uploadingImage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-purple-900/90 p-6 rounded-2xl border border-purple-500/30">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-white text-center">در حال آپلود تصویر...</p>
          </div>
        </div>
      )}
    </div>
  );
}
