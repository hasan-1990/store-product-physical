import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// مدیریت state فونت‌های سیستم
interface SystemFontState {
  fontId: string;
  isActive: boolean;
  isDefault: boolean;
  updatedAt: Date;
}

// Cache برای فونت‌های سیستم
const systemFontsState = new Map<string, SystemFontState>();

// مقداردهی اولیه فونت‌های سیستم
const initializeSystemFonts = () => {
  if (systemFontsState.size === 0) {
    systemFontsState.set('system-tahoma', {
      fontId: 'system-tahoma',
      isActive: true,
      isDefault: true,
      updatedAt: new Date()
    });
    
    systemFontsState.set('system-vazirmatn', {
      fontId: 'system-vazirmatn',
      isActive: false,
      isDefault: false,
      updatedAt: new Date()
    });
    
    systemFontsState.set('system-arial', {
      fontId: 'system-arial',
      isActive: false,
      isDefault: false,
      updatedAt: new Date()
    });
    
    systemFontsState.set('system-yekan', {
      fontId: 'system-yekan',
      isActive: false,
      isDefault: false,
      updatedAt: new Date()
    });
  }
};

// GET - دریافت وضعیت فونت‌های سیستم
export async function GET() {
  try {
    initializeSystemFonts();
    
    const systemFonts = Array.from(systemFontsState.values());
    
    return NextResponse.json({
      success: true,
      systemFonts
    });
  } catch (error) {
    console.error('خطا در دریافت وضعیت فونت‌های سیستم:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت وضعیت فونت‌های سیستم' },
      { status: 500 }
    );
  }
}

// PUT - بروزرسانی وضعیت فونت سیستم
export async function PUT(request: Request) {
  try {
    const { fontId, isActive, isDefault } = await request.json();
    
    if (!fontId || !fontId.startsWith('system-')) {
      return NextResponse.json(
        { success: false, error: 'شناسه فونت سیستم نامعتبر است' },
        { status: 400 }
      );
    }

    initializeSystemFonts();

    // اگر فونت باید پیش‌فرض شود، سایر فونت‌ها را غیرپیش‌فرض کن
    if (isDefault) {
      systemFontsState.forEach((state, id) => {
        if (id !== fontId) {
          state.isDefault = false;
          state.isActive = false;
          state.updatedAt = new Date();
        }
      });
    }

    // بروزرسانی فونت مورد نظر
    const currentState = systemFontsState.get(fontId);
    if (currentState) {
      systemFontsState.set(fontId, {
        fontId,
        isActive,
        isDefault,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'وضعیت فونت سیستم بروزرسانی شد',
      fontId,
      isActive,
      isDefault
    });

  } catch (error) {
    console.error('خطا در بروزرسانی فونت سیستم:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی فونت سیستم' },
      { status: 500 }
    );
  }
}

// دریافت فونت فعال فعلی (helper function - not exported)
const getActiveSystemFont = () => {
  initializeSystemFonts();
  
  for (const [fontId, state] of systemFontsState.entries()) {
    if (state.isDefault && state.isActive) {
      return {
        id: fontId,
        ...state
      };
    }
  }
  
  // پیش‌فرض تاهوما
  return {
    fontId: 'system-tahoma',
    family: 'Tahoma',
    isActive: true,
    isDefault: true
  };
};