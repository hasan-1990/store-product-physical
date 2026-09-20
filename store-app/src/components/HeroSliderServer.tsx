import { connectDB } from '@/lib/mongodb';
import HeroSliderClient from './HeroSliderClient';

interface HeroSlide {
  id: string;
  image: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
  description?: string;
  backgroundType?: 'image' | 'video' | 'gradient';
  videoUrl?: string;
  gradientColors?: string[];
  buttonText: string;
  buttonLink: string;
  buttonStyle?: 'default' | 'outline' | 'ghost' | 'gradient';
  buttonColor?: string;
  theme: 'dark' | 'light';
  animation?: {
    entrance: 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'rotate';
    duration: number;
    delay: number;
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  };
  textPosition?: 'left' | 'center' | 'right' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  textColor?: string;
  textShadow?: boolean;
  overlay?: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  parallax?: boolean;
  autoHeight?: boolean;
  active?: boolean;
}

interface HeroSliderServerProps {
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

// Server Component - داده‌ها را از دیتابیس می‌گیرد
export default async function HeroSliderServer({ 
  autoPlay = true, 
  autoPlayInterval = 8000,
  className = ''
}: HeroSliderServerProps) {
  let slides: HeroSlide[] = [];

  try {
    const db = await connectDB();
    
    // دریافت اسلایدهای فعال از دیتابیس
    const slidesData = await db.heroSliders
      .find({ active: true })
      .sort({ order: 1 })
      .toArray();
    
    // تبدیل به فرمت مورد نیاز
    slides = slidesData.map((slide: any) => ({
      id: slide._id?.toString() || slide.id,
      image: slide.image || '',
      imageUrl: slide.imageUrl || slide.image || '',
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      backgroundType: slide.backgroundType || 'image',
      videoUrl: slide.videoUrl || '',
      gradientColors: slide.gradientColors || [],
      buttonText: slide.buttonText || 'مشاهده بیشتر',
      buttonLink: slide.buttonLink || '#',
      buttonStyle: slide.buttonStyle || 'default',
      buttonColor: slide.buttonColor || '',
      theme: slide.theme || 'dark',
      animation: slide.animation,
      textPosition: slide.textPosition,
      textColor: slide.textColor,
      textShadow: slide.textShadow,
      overlay: slide.overlay,
      parallax: slide.parallax,
      autoHeight: slide.autoHeight,
      active: slide.active
    }));
  } catch (error) {
    console.error('Error loading hero slider from database:', error);
    // در صورت خطا، آرایه خالی برمی‌گرداند
    slides = [];
  }

  // wrapper با ارتفاع ثابت برای جلوگیری از Layout Shift
  return (
    <div className="w-full" style={{ minHeight: '500px', height: '60vh', maxHeight: '600px' }}>
      <HeroSliderClient 
        slides={slides}
        autoPlay={autoPlay}
        autoPlayInterval={autoPlayInterval}
        className={className}
      />
    </div>
  );
}
