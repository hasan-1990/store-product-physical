import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('🎨 درخواست CSS فونت پویا دریافت شد');
    
    const mongodb = await connectDB();
    
    // دریافت همه فونت‌های فعال
    const activeFonts = await mongodb.fonts.find({ isActive: true }).toArray();
    console.log(`📁 فونت‌های فعال: ${activeFonts.length} فونت`);
    
    // فونت پیش‌فرض را پیدا کن
    let defaultFont = await mongodb.fonts.findOne({ 
      isActive: true, 
      isDefault: true 
    });

    let cssContent = '';
    let fontFamily = 'Tahoma'; // فونت پیش‌فرض fallback

    // اگر فونت‌های آپلود شده فعال هستند
    if (activeFonts.length > 0) {
      console.log('📂 استفاده از فونت‌های آپلود شده');
      
      // تولید @font-face برای همه فونت‌های فعال
      activeFonts.forEach((font: any) => {
        font.weights.forEach((weight: any) => {
          cssContent += `
@font-face {
  font-family: '${font.family}';
  src: url('${weight.url}') format('${getFormat(weight.filename)}');
  font-weight: ${weight.weight};
  font-style: ${weight.style};
  font-display: swap;
}
`;
        });
      });

      // تعیین فونت پیش‌فرض
      if (defaultFont) {
        fontFamily = defaultFont.family;
        console.log(`⭐ فونت پیش‌فرض: ${defaultFont.name} (${defaultFont.family})`);
      } else {
        // اولین فونت فعال را به عنوان پیش‌فرض استفاده کن
        fontFamily = activeFonts[0].family;
        console.log(`🔄 استفاده از اولین فونت فعال: ${activeFonts[0].name} (${activeFonts[0].family})`);
      }
    } else {
      console.log('⚠️ هیچ فونتی فعال نیست - استفاده از Tahoma به عنوان فونت پیش‌فرض');
    }

    // ایجاد font stack - فقط فونت‌های آپلود شده + fallback ساده
    const activeFontFamilies = activeFonts.map((font: any) => `'${font.family}'`).join(', ');
    const fullFontStack = activeFontFamilies 
      ? `${activeFontFamilies}, sans-serif`
      : `'Tahoma', sans-serif`;

    console.log(`🎯 فونت نهایی انتخاب شده: ${fontFamily}`);
    console.log(`📝 Font Stack: ${fullFontStack}`);

    // CSS برای اعمال فونت در کل سایت
    cssContent += `
:root {
  --font-primary: ${fullFontStack};
  --font-main: '${fontFamily}';
}

body,
html,
* {
  font-family: var(--font-primary) !important;
}

/* Tailwind CSS overrides */
.font-sans {
  font-family: var(--font-primary) !important;
}

/* کلاس‌های وزن فونت */
.font-thin { font-weight: 100 !important; }
.font-light { font-weight: 200 !important; }
.font-extralight { font-weight: 300 !important; }
.font-normal { font-weight: 400 !important; }
.font-medium { font-weight: 500 !important; }
.font-semibold { font-weight: 600 !important; }
.font-bold { font-weight: 700 !important; }
.font-extrabold { font-weight: 800 !important; }
.font-black { font-weight: 900 !important; }

/* اعمال فونت روی تمام المان‌ها */
h1, h2, h3, h4, h5, h6,
p, span, div, a, button,
input, textarea, select, option,
label, legend, caption,
th, td, li, dt, dd,
.text-xs, .text-sm, .text-base, .text-lg, .text-xl, 
.text-2xl, .text-3xl, .text-4xl, .text-5xl, .text-6xl, .text-7xl, .text-8xl, .text-9xl {
  font-family: var(--font-primary) !important;
}

/* فونت‌های مخصوص */
.font-primary {
  font-family: var(--font-main) !important;
}

/* سایر کلاس‌های کاربردی */
.rtl {
  direction: rtl;
  text-align: right;
}

.ltr {
  direction: ltr;
  text-align: left;
}
`;

    console.log('✅ CSS تولید شد، طول:', cssContent.length);

    return new NextResponse(cssContent, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
        'Vary': 'Accept-Encoding',
      },
    });

  } catch (error) {
    console.error('❌ خطا در تولید CSS فونت:', error);
    
    // بازگشت CSS پیش‌فرض در صورت خطا
    const fallbackCSS = `
:root {
  --font-primary: 'Tahoma', 'Vazirmatn', 'Arial', system-ui, -apple-system, sans-serif;
  --font-main: 'Tahoma';
}
body, html, * {
  font-family: var(--font-primary) !important;
}
`;
    
    return new NextResponse(fallbackCSS, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// تابع کمکی برای تعیین فرمت فونت
function getFormat(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'woff2':
      return 'woff2';
    case 'woff':
      return 'woff';
    case 'ttf':
      return 'truetype';
    case 'otf':
      return 'opentype';
    default:
      return 'woff2';
  }
}