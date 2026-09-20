
import { NextRequest, NextResponse } from 'next/server';
import { mongodb, connectDB } from '@/lib/mongodb';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const sliderSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().min(1, 'تصویر الزامی است'),
  backgroundType: z.enum(['image', 'video', 'gradient']).default('image'),
  videoUrl: z.string().optional(),
  gradientColors: z.array(z.string()).optional(),
  buttonText: z.string().min(1, 'متن دکمه الزامی است'),
  buttonLink: z.string().min(1, 'لینک دکمه الزامی است'),
  buttonStyle: z.enum(['default', 'outline', 'ghost', 'gradient']).default('default'),
  buttonColor: z.string().optional(),
  order: z.number().int().min(0).default(1),
  active: z.boolean().default(true),
  theme: z.enum(['light', 'dark']).default('dark'),
  animation: z.object({
    entrance: z.enum(['fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'bounce', 'flip', 'flipX', 'flipY', 'rotate', 'rotateX', 'rotateY', 'shake', 'pulse', 'swing', 'rubberBand', 'wobble', 'jello']).default('fade'),
    exit: z.enum(['fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'bounce', 'flip', 'flipX', 'flipY', 'rotate', 'rotateX', 'rotateY', 'shake', 'pulse', 'swing', 'rubberBand', 'wobble', 'jello']).default('fade'),
    duration: z.number().min(0.1).max(5).default(1),
    delay: z.number().min(0).max(10).default(0),
    easing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'bounce', 'elastic', 'back']).default('ease'),
    loop: z.boolean().default(false),
    direction: z.enum(['normal', 'reverse', 'alternate', 'alternate-reverse']).default('normal'),
  }).optional(),
  textPosition: z.enum(['left', 'center', 'right', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']).default('center'),
  textColor: z.string().optional(),
  textShadow: z.boolean().default(false),
  overlay: z.object({
    enabled: z.boolean().default(false),
    color: z.string().default('#000000'),
    opacity: z.number().min(0).max(1).default(0.5),
  }).optional(),
  parallax: z.boolean().default(false),
  autoHeight: z.boolean().default(false),
});

// GET /api/admin/slider - Get all slider images (with Redis cache)
export async function GET() {
  try {
    // Try to get from cache first
    const cachedSliders = await CacheManager.getSliders();
    if (cachedSliders) {
      console.log('⚡ Sliders served from cache');
      return NextResponse.json({
        success: true,
        data: cachedSliders,
        source: 'cache'
      });
    }

    // Cache miss - fetch from database
    console.log('🔄 Fetching sliders from database');
    const db = await connectDB();
    const sliders = await db.heroSliders.find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    // Transform to match frontend interface
    const transformedSliders = sliders.map(slider => ({
      id: slider._id.toString(),
      image: slider.imageUrl,
      imageUrl: slider.imageUrl,
      title: slider.title,
      subtitle: slider.subtitle || '',
      description: slider.description || '',
      backgroundType: slider.backgroundType || 'image',
      videoUrl: slider.videoUrl || '',
      gradientColors: slider.gradientColors || [],
      buttonText: slider.buttonText,
      buttonLink: slider.buttonLink,
      buttonStyle: slider.buttonStyle || 'default',
      buttonColor: slider.buttonColor || '',
      theme: slider.theme || 'dark',
      order: slider.order,
      active: slider.active,
      animation: slider.animation || { entrance: 'fade', exit: 'fade', duration: 1, delay: 0, easing: 'ease', loop: false, direction: 'normal' },
      textPosition: slider.textPosition || 'center',
      textColor: slider.textColor || '',
      textShadow: slider.textShadow || false,
      overlay: slider.overlay || { enabled: false, color: '#000000', opacity: 0.5 },
      parallax: slider.parallax || false,
      autoHeight: slider.autoHeight || false,
      createdAt: slider.createdAt,
      updatedAt: slider.updatedAt
    }));

    // Store in cache for next time
    await CacheManager.setSliders(transformedSliders);

    return NextResponse.json({
      success: true,
      data: transformedSliders,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching sliders:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اسلایدرها' },
      { status: 500 }
    );
  }
}

// POST /api/admin/slider - Create new slider (with cache invalidation)
export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    const body = await request.json();
    const validatedData = sliderSchema.parse(body);

    const sliderData = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.heroSliders.insertOne(sliderData);
    const slider = await db.heroSliders.findOne({ _id: result.insertedId });

    if (!slider) {
      return NextResponse.json(
        { success: false, error: 'خطا در ایجاد اسلایدر' },
        { status: 500 }
      );
    }

    const transformedSlider = {
      id: slider._id.toString(),
      image: slider.imageUrl,
      imageUrl: slider.imageUrl,
      title: slider.title,
      subtitle: slider.subtitle || '',
      description: slider.description || '',
      backgroundType: slider.backgroundType || 'image',
      videoUrl: slider.videoUrl || '',
      gradientColors: slider.gradientColors || [],
      buttonText: slider.buttonText,
      buttonLink: slider.buttonLink,
      buttonStyle: slider.buttonStyle || 'default',
      buttonColor: slider.buttonColor || '',
      theme: slider.theme || 'dark',
      order: slider.order,
      active: slider.active,
      animation: slider.animation || { entrance: 'fade', exit: 'fade', duration: 1, delay: 0, easing: 'ease', loop: false, direction: 'normal' },
      textPosition: slider.textPosition || 'center',
      textColor: slider.textColor || '',
      textShadow: slider.textShadow || false,
      overlay: slider.overlay || { enabled: false, color: '#000000', opacity: 0.5 },
      parallax: slider.parallax || false,
      autoHeight: slider.autoHeight || false,
      createdAt: slider.createdAt,
      updatedAt: slider.updatedAt
    };

    // Invalidate sliders cache after creating new one
    await CacheManager.invalidateSliders();
    console.log('🧹 Sliders cache invalidated after creation');

    return NextResponse.json({
      success: true,
      data: transformedSlider,
      message: 'اسلایدر با موفقیت ایجاد شد'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های ورودی نامعتبر', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating slider:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد اسلایدر' },
      { status: 500 }
    );
  }
}
