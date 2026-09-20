import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const settingsPath = path.join(process.cwd(), 'data', 'url-settings.json');
    const redirectsPath = path.join(process.cwd(), 'data', 'redirects.json');
    
    let urlSettings = {
      urlStructure: 'default', // default, custom, category-product
      categoryPrefix: '',
      productPrefix: '',
      removeStopWords: false,
      slugLanguage: 'persian', // persian, english, mixed
      maxSlugLength: 50,
      separatorType: '-', // -, _
      includeId: false,
      removeNumbers: false
    };

    let redirects = [];

    try {
      if (fs.existsSync(settingsPath)) {
        urlSettings = { ...urlSettings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
      }
    } catch (error) {
      console.error('خطا در خواندن تنظیمات URL:', error);
    }

    try {
      if (fs.existsSync(redirectsPath)) {
        redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
      }
    } catch (error) {
      console.error('خطا در خواندن ریدایرکت‌ها:', error);
    }

    return NextResponse.json({
      urlSettings,
      redirects: redirects || []
    });

  } catch (error) {
    console.error('خطا در بارگیری تنظیمات URL:', error);
    return NextResponse.json(
      { error: 'خطا در بارگیری تنظیمات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'update-url-settings':
        return await updateUrlSettings(data);
      case 'add-redirect':
        return await addRedirect(data);
      case 'update-redirect':
        return await updateRedirect(data);
      case 'delete-redirect':
        return await deleteRedirect(data.id);
      case 'test-redirect':
        return await testRedirect(data.from);
      default:
        return NextResponse.json(
          { error: 'عملیات نامشخص' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('خطا در پردازش درخواست:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}

async function updateUrlSettings(settings: any) {
  try {
    const settingsPath = path.join(process.cwd(), 'data', 'url-settings.json');
    const dataDir = path.dirname(settingsPath);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    return NextResponse.json({
      success: true,
      message: 'تنظیمات URL به‌روزرسانی شد'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}

async function addRedirect(redirect: any) {
  try {
    const redirectsPath = path.join(process.cwd(), 'data', 'redirects.json');
    const dataDir = path.dirname(redirectsPath);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let redirects = [];
    if (fs.existsSync(redirectsPath)) {
      redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
    }

    const newRedirect = {
      id: Date.now().toString(),
      from: redirect.from,
      to: redirect.to,
      type: redirect.type || '301',
      isActive: redirect.isActive !== false,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      hitCount: 0,
      description: redirect.description || ''
    };

    redirects.push(newRedirect);
    fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2));

    return NextResponse.json({
      success: true,
      message: 'ریدایرکت اضافه شد',
      redirect: newRedirect
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در اضافه کردن ریدایرکت' },
      { status: 500 }
    );
  }
}

async function updateRedirect(redirect: any) {
  try {
    const redirectsPath = path.join(process.cwd(), 'data', 'redirects.json');
    
    if (!fs.existsSync(redirectsPath)) {
      return NextResponse.json(
        { error: 'فایل ریدایرکت‌ها یافت نشد' },
        { status: 404 }
      );
    }

    let redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
    const index = redirects.findIndex((r: any) => r.id === redirect.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'ریدایرکت یافت نشد' },
        { status: 404 }
      );
    }

    redirects[index] = {
      ...redirects[index],
      ...redirect,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2));

    return NextResponse.json({
      success: true,
      message: 'ریدایرکت به‌روزرسانی شد',
      redirect: redirects[index]
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی ریدایرکت' },
      { status: 500 }
    );
  }
}

async function deleteRedirect(id: string) {
  try {
    const redirectsPath = path.join(process.cwd(), 'data', 'redirects.json');
    
    if (!fs.existsSync(redirectsPath)) {
      return NextResponse.json(
        { error: 'فایل ریدایرکت‌ها یافت نشد' },
        { status: 404 }
      );
    }

    let redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
    redirects = redirects.filter((r: any) => r.id !== id);

    fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2));

    return NextResponse.json({
      success: true,
      message: 'ریدایرکت حذف شد'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در حذف ریدایرکت' },
      { status: 500 }
    );
  }
}

async function testRedirect(fromUrl: string) {
  try {
    const redirectsPath = path.join(process.cwd(), 'data', 'redirects.json');
    
    if (!fs.existsSync(redirectsPath)) {
      return NextResponse.json({
        found: false,
        message: 'هیچ ریدایرکتی تعریف نشده'
      });
    }

    const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
    const redirect = redirects.find((r: any) => 
      r.from === fromUrl && r.isActive
    );

    if (redirect) {
      return NextResponse.json({
        found: true,
        redirect: {
          from: redirect.from,
          to: redirect.to,
          type: redirect.type,
          description: redirect.description
        }
      });
    } else {
      return NextResponse.json({
        found: false,
        message: 'ریدایرکت یافت نشد'
      });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در تست ریدایرکت' },
      { status: 500 }
    );
  }
}