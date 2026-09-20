import { Product } from '@/types';

/**
 * تولید خودکار محتوای مخفی SEO برای محصولات
 */
export class HiddenSEOGenerator {
  
  /**
   * تولید کلمات کلیدی برای محصول
   */
  static generateProductKeywords(product: Product): string[] {
    const keywords: string[] = [];
    
    // نام محصول
    if (product.name) {
      keywords.push(
        product.name,
        `خرید ${product.name}`,
        `قیمت ${product.name}`,
        `${product.name} اورجینال`,
        `فروش ${product.name}`
      );
    }
    
    // برند
    const brand = product.technicalSpecs?.brand;
    if (brand) {
      keywords.push(
        brand,
        `${brand} ${product.name}`,
        `محصولات ${brand}`,
        `خرید ${brand}`
      );
    }
    
    // دسته‌بندی
    const categoryName = typeof product.category === 'object' 
      ? product.category?.name 
      : product.category;
    if (categoryName) {
      keywords.push(
        categoryName,
        `خرید ${categoryName}`,
        `قیمت ${categoryName}`,
        `بهترین ${categoryName}`
      );
    }
    
    // کلمات عمومی سئو
    keywords.push(
      'خرید آنلاین',
      'ارسال رایگان',
      'بهترین قیمت',
      'کیفیت عالی',
      'ضمانت اصالت',
      'پشتیبانی آنلاین',
      'پرداخت امن'
    );
    
    return keywords.filter(Boolean);
  }

  /**
   * تولید توضیحات مخفی برای محصول
   */
  static generateProductDescription(product: Product): string {
    const brand = product.technicalSpecs?.brand || 'برند معتبر';
    const categoryName = typeof product.category === 'object' 
      ? product.category?.name 
      : product.category || 'محصولات';
    
    let description = `در فروشگاه آنلاین ما می‌توانید ${product.name} را با بهترین قیمت ${product.price?.toLocaleString()} تومان خریداری کنید. `;
    
    description += `این محصول از برند ${brand} در دسته‌بندی ${categoryName} قرار دارد. `;
    
    description += `ما ضمانت اصالت کالا، ارسال سریع و رایگان، پشتیبانی ۲۴ ساعته و بهترین قیمت بازار را به شما ارائه می‌دهیم. `;
    
    if (product.description) {
      description += `توضیحات کامل: ${product.description} `;
    }
    
    if (product.keyFeatures && product.keyFeatures.length > 0) {
      description += `ویژگی‌های کلیدی: ${product.keyFeatures.join(', ')}. `;
    }
    
    description += `برای خرید این محصول کافی است روی دکمه افزودن به سبد خرید کلیک کنید.`;
    
    return description;
  }

  /**
   * تولید دسته‌بندی‌های مخفی
   */
  static generateProductCategories(product: Product): string[] {
    const categories: string[] = [];
    
    const categoryName = typeof product.category === 'object' 
      ? product.category?.name 
      : product.category;
    
    if (categoryName) {
      categories.push(categoryName);
    }
    
    categories.push(
      'فروشگاه آنلاین',
      'کالای اصل',
      'محصولات با کیفیت',
      'ارسال سریع'
    );
    
    if (product.featured) {
      categories.push('پرفروش‌ترین محصولات', 'محصولات ویژه');
    }
    
    return categories.filter(Boolean);
  }

  /**
   * تولید ویژگی‌های مخفی
   */
  static generateProductFeatures(product: Product): string[] {
    const features: string[] = [
      'ضمانت اصالت کالا',
      'ارسال سریع و رایگان',
      'پشتیبانی ۲۴ ساعته',
      'قیمت رقابتی',
      'کیفیت بالا'
    ];
    
    const brand = product.technicalSpecs?.brand;
    if (brand) {
      features.push(`برند ${brand}`);
    }
    
    if (product.technicalSpecs?.warranty) {
      features.push(`ضمانت ${product.technicalSpecs.warranty}`);
    }
    
    if (product.keyFeatures) {
      features.push(...product.keyFeatures);
    }
    
    if (product.inStock) {
      features.push('موجود در انبار');
    }
    
    return features.filter(Boolean);
  }

  /**
   * تولید عنوان مخفی
   */
  static generateProductTitle(product: Product): string {
    const brand = product.technicalSpecs?.brand;
    let title = `خرید ${product.name}`;
    
    if (brand) {
      title += ` ${brand}`;
    }
    
    title += ' - بهترین قیمت و کیفیت';
    
    return title;
  }

  /**
   * تولید کامل محتوای مخفی برای محصول
   */
  static generateCompleteProductSEO(product: Product) {
    return {
      title: this.generateProductTitle(product),
      description: this.generateProductDescription(product),
      keywords: this.generateProductKeywords(product),
      categories: this.generateProductCategories(product),
      features: this.generateProductFeatures(product)
    };
  }
}

/**
 * تولید محتوای مخفی برای صفحه دسته‌بندی
 */
export class CategoryHiddenSEOGenerator {
  
  static generateCategoryKeywords(categoryName: string, productCount: number = 0): string[] {
    return [
      categoryName,
      `خرید ${categoryName}`,
      `قیمت ${categoryName}`,
      `فروش ${categoryName}`,
      `بهترین ${categoryName}`,
      `${categoryName} اورجینال`,
      'خرید آنلاین',
      'فروشگاه اینترنتی',
      'ارسال رایگان',
      'کیفیت عالی',
      'قیمت مناسب'
    ];
  }
  
  static generateCategoryDescription(categoryName: string, productCount: number = 0): string {
    let description = `در فروشگاه آنلاین ما مجموعه کاملی از ${categoryName} را با بهترین قیمت و کیفیت ارائه می‌دهیم. `;
    
    if (productCount > 0) {
      description += `با انتخاب از میان ${productCount} محصول موجود، `;
    }
    
    description += `بهترین خرید را تجربه کنید. تمامی محصولات دارای ضمانت اصالت، ارسال سریع و رایگان به سراسر کشور و پشتیبانی ۲۴ ساعته می‌باشند. `;
    description += `امکان مقایسه قیمت، مشاهده نظرات سایر خریداران و پرداخت امن آنلاین در دسترس شما قرار دارد.`;
    
    return description;
  }
  
  static generateCompleteCategorySEO(categoryName: string, productCount: number = 0) {
    return {
      title: `فروشگاه آنلاین ${categoryName} - بهترین قیمت و کیفیت`,
      description: this.generateCategoryDescription(categoryName, productCount),
      keywords: this.generateCategoryKeywords(categoryName, productCount),
      categories: [
        'فروشگاه آنلاین',
        categoryName,
        'خرید اینترنتی',
        'کالای اصل'
      ],
      features: [
        'ارسال سریع و رایگان',
        'ضمانت اصالت کالا',
        'پشتیبانی ۲۴ ساعته',
        'تنوع محصولات',
        'قیمت رقابتی',
        'پرداخت امن آنلاین'
      ]
    };
  }
}

/**
 * تولید محتوای مخفی برای صفحه اصلی
 */
export class HomePageHiddenSEOGenerator {
  
  static generateHomepageKeywords(): string[] {
    return [
      'فروشگاه آنلاین',
      'خرید اینترنتی',
      'فروشگاه اینترنتی',
      'کالای اصل',
      'بهترین قیمت',
      'ارسال رایگان',
      'خرید آنلاین',
      'پشتیبانی مشتریان',
      'ضمانت کیفیت',
      'پرداخت امن',
      'تنوع محصولات',
      'خدمات پس از فروش'
    ];
  }
  
  static generateHomepageDescription(): string {
    return `بهترین فروشگاه آنلاین با تنوع بالای محصولات، قیمت‌های رقابتی و کیفیت عالی. ارسال سریع و رایگان به سراسر کشور، ضمانت اصالت کالا، پشتیبانی ۲۴ ساعته و پرداخت امن آنلاین. مجموعه کاملی از محصولات با برندهای معتبر و قیمت مناسب. تجربه خرید راحت و مطمئن با بهترین خدمات پس از فروش.`;
  }
  
  static generateCompleteHomepageSEO() {
    return {
      title: 'فروشگاه آنلاین - خرید آنلاین با بهترین قیمت و کیفیت',
      description: this.generateHomepageDescription(),
      keywords: this.generateHomepageKeywords(),
      categories: [
        'فروشگاه آنلاین',
        'خرید اینترنتی',
        'کالای اصل',
        'بهترین قیمت'
      ],
      features: [
        'ارسال سریع و رایگان',
        'ضمانت اصالت کالا',
        'پشتیبانی ۲۴ ساعته',
        'تنوع محصولات',
        'قیمت رقابتی',
        'پرداخت امن آنلاین',
        'خدمات پس از فروش'
      ]
    };
  }
}