import { NextRequest, NextResponse } from 'next/server';
import { mongodb, connectDB } from '@/lib/mongodb';
import { CacheManager, CACHE_KEYS, CACHE_TTL } from '@/lib/cache-manager';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const updateSliderSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().min(1).optional(),
  backgroundType: z.enum(['image', 'video', 'gradient']).optional(),
  videoUrl: z.string().optional(),
  gradientColors: z.array(z.string()).optional(),
  buttonText: z.string().min(1).optional(),
  buttonLink: z.string().min(1).optional(),
  buttonStyle: z.enum(['default', 'outline', 'ghost', 'gradient']).optional(),
  buttonColor: z.string().optional(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  animation: z.object({
    entrance: z.enum(['fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'bounce', 'flip', 'flipX', 'flipY', 'rotate', 'rotateX', 'rotateY', 'shake', 'pulse', 'swing', 'rubberBand', 'wobble', 'jello']).optional(),
    exit: z.enum(['fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'zoomOut', 'bounce', 'flip', 'flipX', 'flipY', 'rotate', 'rotateX', 'rotateY', 'shake', 'pulse', 'swing', 'rubberBand', 'wobble', 'jello']).optional(),
    duration: z.number().min(0.1).max(5).optional(),
    delay: z.number().min(0).max(10).optional(),
    easing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'bounce', 'elastic', 'back']).optional(),
    loop: z.boolean().optional(),
    direction: z.enum(['normal', 'reverse', 'alternate', 'alternate-reverse']).optional(),
  }).optional(),
  textPosition: z.enum(['left', 'center', 'right', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']).optional(),
  textColor: z.string().optional(),
  textShadow: z.boolean().optional(),
  overlay: z.object({
    enabled: z.boolean().optional(),
    color: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
  }).optional(),
  parallax: z.boolean().optional(),
  autoHeight: z.boolean().optional(),
});

// GET /api/admin/slider/[id] - Get single slider (with Redis cache)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه اسلایدر نامعتبر است' },
        { status: 400 }
      );
    }

    // Try to get from cache first
    const cachedSlider = await CacheManager.getSlider(resolvedParams.id);
    if (cachedSlider) {
      console.log(`⚡ Slider ${resolvedParams.id} served from cache`);
      return NextResponse.json({
        success: true,
        data: cachedSlider,
        source: 'cache'
      });
    }

    // Cache miss - fetch from database
    console.log(`🔄 Fetching slider ${resolvedParams.id} from database`);
    const db = await connectDB();
    const slider = await db.heroSliders.findOne({ _id: new ObjectId(resolvedParams.id) });
    
    if (!slider) {
      return NextResponse.json(
        { success: false, error: 'اسلاید یافت نشد' },
        { status: 404 }
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

    // Store in cache for next time
    await CacheManager.setSlider(resolvedParams.id, transformedSlider);

    return NextResponse.json({
      success: true,
      data: transformedSlider,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching slider:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اسلاید' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/slider/[id] - Update slider (with cache invalidation)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه اسلایدر نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const body = await request.json();
    const validatedData = updateSliderSchema.parse(body);

    const updateData = {
      ...validatedData,
      updatedAt: new Date()
    };

    const result = await db.heroSliders.updateOne(
      { _id: new ObjectId(resolvedParams.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'اسلایدر یافت نشد' },
        { status: 404 }
      );
    }

    const updatedSlider = await db.heroSliders.findOne({ _id: new ObjectId(resolvedParams.id) });

    if (!updatedSlider) {
      return NextResponse.json(
        { success: false, error: 'اسلایدر یافت نشد' },
        { status: 404 }
      );
    }

      const transformedSlider = {
        id: updatedSlider._id.toString(),
        image: updatedSlider.imageUrl,
        imageUrl: updatedSlider.imageUrl,
        title: updatedSlider.title,
        subtitle: updatedSlider.subtitle || '',
        description: updatedSlider.description || '',
        backgroundType: updatedSlider.backgroundType || 'image',
        videoUrl: updatedSlider.videoUrl || '',
        gradientColors: updatedSlider.gradientColors || [],
        buttonText: updatedSlider.buttonText,
        buttonLink: updatedSlider.buttonLink,
        buttonStyle: updatedSlider.buttonStyle || 'default',
        buttonColor: updatedSlider.buttonColor || '',
        theme: updatedSlider.theme || 'dark',
        order: updatedSlider.order,
        active: updatedSlider.active,
        animation: updatedSlider.animation || { entrance: 'fade', exit: 'fade', duration: 1, delay: 0, easing: 'ease', loop: false, direction: 'normal' },
        textPosition: updatedSlider.textPosition || 'center',
        textColor: updatedSlider.textColor || '',
        textShadow: updatedSlider.textShadow || false,
        overlay: updatedSlider.overlay || { enabled: false, color: '#000000', opacity: 0.5 },
        parallax: updatedSlider.parallax || false,
        autoHeight: updatedSlider.autoHeight || false,
        createdAt: updatedSlider.createdAt,
        updatedAt: updatedSlider.updatedAt
      };    
    
    // Invalidate cache after updating
    await CacheManager.invalidateSliders();
    await CacheManager.delete(`${CACHE_KEYS.SLIDERS}${resolvedParams.id}`);
    console.log(`🧹 Slider ${resolvedParams.id} cache invalidated after update`);

    return NextResponse.json({
      success: true,
      data: transformedSlider,
      message: 'اسلایدر با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های ورودی نامعتبر', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating slider:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در به‌روزرسانی اسلایدر' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/slider/[id] - Delete slider (with cache invalidation)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json(
        { success: false, error: 'شناسه اسلایدر نامعتبر است' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const result = await db.heroSliders.deleteOne({ _id: new ObjectId(resolvedParams.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'اسلایدر یافت نشد' },
        { status: 404 }
      );
    }

    // Invalidate cache after deleting
    await CacheManager.invalidateSliders();
    await CacheManager.delete(`${CACHE_KEYS.SLIDERS}${resolvedParams.id}`);
    console.log(`🧹 Slider ${resolvedParams.id} cache invalidated after deletion`);

    return NextResponse.json({
      success: true,
      message: 'اسلایدر با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting slider:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف اسلایدر' },
      { status: 500 }
    );
  }
}
