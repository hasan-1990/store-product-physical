import { NextRequest, NextResponse } from 'next/server';
import { RedirectRule } from '@/types/seo';
import fs from 'fs';
import path from 'path';

const REDIRECTS_DATA_PATH = path.join(process.cwd(), 'data', 'redirects.json');

// اطمینان از وجود فایل redirects
const ensureRedirectsFile = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(REDIRECTS_DATA_PATH)) {
    fs.writeFileSync(REDIRECTS_DATA_PATH, JSON.stringify([], null, 2));
  }
};

// خواندن redirects
const readRedirects = (): RedirectRule[] => {
  ensureRedirectsFile();
  try {
    const data = fs.readFileSync(REDIRECTS_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('خطا در خواندن redirects:', error);
    return [];
  }
};

// نوشتن redirects
const writeRedirects = (redirects: RedirectRule[]): boolean => {
  ensureRedirectsFile();
  try {
    fs.writeFileSync(REDIRECTS_DATA_PATH, JSON.stringify(redirects, null, 2));
    return true;
  } catch (error) {
    console.error('خطا در نوشتن redirects:', error);
    return false;
  }
};

// GET - دریافت redirects
export async function GET() {
  try {
    const redirects = readRedirects();
    return NextResponse.json(redirects);
  } catch (error) {
    console.error('خطا در دریافت redirects:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت redirects' },
      { status: 500 }
    );
  }
}

// POST - اضافه کردن redirect جدید
export async function POST(request: NextRequest) {
  try {
    const newRedirect: RedirectRule = await request.json();
    
    // اعتبارسنجی
    if (!newRedirect.from || !newRedirect.to) {
      return NextResponse.json(
        { error: 'مسیر مبدأ و مقصد الزامی است' },
        { status: 400 }
      );
    }
    
    if (![301, 302].includes(newRedirect.type)) {
      return NextResponse.json(
        { error: 'نوع redirect باید 301 یا 302 باشد' },
        { status: 400 }
      );
    }
    
    const redirects = readRedirects();
    
    // بررسی تکراری بودن
    const existingRedirect = redirects.find(r => r.from === newRedirect.from);
    if (existingRedirect) {
      return NextResponse.json(
        { error: 'redirect برای این مسیر قبلاً وجود دارد' },
        { status: 409 }
      );
    }
    
    // اضافه کردن redirect جدید
    const redirect: RedirectRule = {
      id: `redirect_${Date.now()}`,
      from: newRedirect.from,
      to: newRedirect.to,
      type: newRedirect.type,
      isActive: newRedirect.isActive !== false,
      createdAt: new Date().toISOString()
    };
    
    redirects.push(redirect);
    
    const success = writeRedirects(redirects);
    
    if (success) {
      return NextResponse.json(redirect);
    } else {
      return NextResponse.json(
        { error: 'خطا در ذخیره redirect' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('خطا در ایجاد redirect:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد redirect' },
      { status: 500 }
    );
  }
}

// DELETE - حذف redirect
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه redirect الزامی است' },
        { status: 400 }
      );
    }
    
    const redirects = readRedirects();
    const filteredRedirects = redirects.filter(r => r.id !== id);
    
    const success = writeRedirects(filteredRedirects);
    
    if (success) {
      return NextResponse.json({ message: 'redirect با موفقیت حذف شد' });
    } else {
      return NextResponse.json(
        { error: 'خطا در حذف redirect' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('خطا در حذف redirect:', error);
    return NextResponse.json(
      { error: 'خطا در حذف redirect' },
      { status: 500 }
    );
  }
}