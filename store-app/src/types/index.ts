// Dynamic Content Types
export interface DynamicContent {
  _id?: string;
  key: string; // کلید یکتا برای شناسایی محتوا (مثل 'site_title', 'footer_description')
  value: string; // مقدار محتوا
  category?: string; // دسته‌بندی (مثل 'header', 'footer', 'homepage', 'seo')
  description?: string; // توضیحات برای ادمین
  type?: 'text' | 'textarea' | 'html' | 'json'; // نوع محتوا
  isActive?: boolean; // فعال/غیرفعال
  createdAt?: string;
  updatedAt?: string;
}

// Chatbot Settings Types
export interface ChatbotSettings {
  _id?: string;
  key: string; // کلید تنظیم (مثل 'provider', 'gemini_api_key', 'openai_api_key')
  value: any; // مقدار تنظیم
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessage {
  _id?: string;
  sessionId: string;
  messages: Array<{
    timestamp: Date;
    user: string;
    assistant: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SiteContent {
  header?: {
    site_title?: string;
    site_subtitle?: string;
    logo_text?: string;
  };
  footer?: {
    about_text?: string;
    copyright_text?: string;
    contact_email?: string;
    contact_phone?: string;
  };
  seo?: {
    site_name?: string;
    site_description?: string;
    keywords?: string;
    og_title?: string;
    og_description?: string;
  };
  homepage?: {
    hero_title?: string;
    hero_subtitle?: string;
    hero_button_text?: string;
  };
  [key: string]: any;
}

export interface Product {
  id?: string;
  _id?: string;
  sequentialId?: number; // اضافه کردن sequential ID
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  imageUrl?: string;
  images?: string[];
  gallery?: string[];
  rating?: number;
  reviews?: number;
  reviewsCount?: number;
  ratingCount?: number;
  category?: string | {
    id?: string;
    _id?: string;
    name: string;
    slug?: string;
  };
  categoryId?: string;
  categoryPath?: Array<{ slug: string; name: string }>; // اضافه کردن category path
  isOnSale?: boolean;
  description?: string;
  features?: string[];
  specifications?: Record<string, string>;
  inStock?: boolean;
  stock?: number;
  stockQuantity?: number;
  featured?: boolean;
  active?: boolean;
  slug?: string; // اضافه کردن slug
  views?: number; // اضافه کردن views
  soldCount?: number; // تعداد فروش
  salesCount?: number; // تعداد فروش (جایگزین)
  createdAt?: string; // Only string format for Server Components compatibility
  updatedAt?: string; // Only string format for Server Components compatibility
  version?: string; // نسخه محصول
  updateDate?: string; // تاریخ آخرین بروزرسانی
  
  // فیلدهای جدید برای جزئیات محصول
  keyFeatures?: string[]; // ویژگی‌های کلیدی
  whatIncluded?: string[]; // محتویات جعبه
  technicalSpecs?: {
    weight?: string;
    dimensions?: string;
    material?: string;
    brand?: string;
    warranty?: string;
    origin?: string;
    [key: string]: string | undefined;
  };
  productBenefits?: string[]; // فواید محصول
  shippingInfo?: string; // اطلاعات ارسال
  
  // رنگ‌ها و سایزها
  colors?: Array<{
    id: string;
    name: string;
    value: string; // کد رنگ hex مثل #000000
    available: boolean;
  }>;
  sizes?: Array<{
    id: string;
    name: string;
    value: string;
    available: boolean;
    price?: number; // قیمت اضافه برای این سایز (اختیاری)
  }>;
  
  // برند
  brand?: string | Brand; // می‌تواند ID (string) یا شیء کامل Brand باشد
  brandId?: string;
  
  // وزن محصول برای محاسبه هزینه پست
  weight?: number; // وزن به کیلوگرم

  // نوع محصول - دیجیتال یا فیزیکی
  productType?: 'PHYSICAL' | 'DIGITAL'; // نوع محصول
  isDigital?: boolean; // true برای محصولات دیجیتال (قالب، افزونه، فایل) - false یا undefined برای محصولات فیزیکی
  downloadUrl?: string; // لینک دانلود برای محصولات دیجیتال
  previewUrl?: string; // لینک پیش‌نمایش زنده برای قالب‌های دیجیتال
  previewType?: 'template' | 'plugin' | 'theme' | 'app'; // نوع پیش‌نمایش (قالب، افزونه، تم، اپلیکیشن)
  fileSize?: number; // حجم فایل به مگابایت
  fileFormat?: string; // فرمت فایل (pdf, zip, ...)
  downloadLimit?: number | null; // محدودیت دانلود

  // managed-site provisioning
  provisioningType?: 'download' | 'managed-site';
  templateId?: string;
  templateSlug?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
  stock: number;
  category?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed' | 'refunded';
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  items: CartItem[];
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | 'completed';
}

export interface Category {
  id?: string;
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  parentId?: string | null;
  level?: number;
  active?: boolean;
  order?: number;
  href?: string;
  subcategories?: Category[];
  productCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  inStock?: boolean;
  onSale?: boolean;
}

export interface SortOption {
  label: string;
  value: string;
}

export interface SMSSettings {
  apiKey: string;
  lineNumber: string;
  templateIds: {
    orderConfirmation: number;
    shipping: number;
    verificationCode: number;
  };
  isActive: boolean;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  type: 'order' | 'shipping' | 'verification' | 'marketing';
  active: boolean;
}

// Blog related types
export interface BlogCategory {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogTag {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  color?: string;
}

export interface BlogPost {
  _id?: string;
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  images?: string[];
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  category: BlogCategory | string;
  tags?: BlogTag[] | string[];
  status: 'draft' | 'published' | 'scheduled';
  featured?: boolean;
  views?: number;
  readTime?: number; // in minutes
  publishedAt?: string;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export interface BlogComment {
  _id?: string;
  id?: string;
  postId: string;
  parentId?: string; // for replies
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

// Ticket System Types
export interface Ticket {
  _id?: string;
  ticketNumber: string; // شماره تیکت (مثل: TKT-20251002-0001)
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'technical' | 'sales' | 'payment' | 'shipping' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  messages: TicketMessage[];
  attachments?: TicketAttachment[];
  assignedTo?: string; // Admin user ID
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface TicketMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  attachments?: TicketAttachment[];
  createdAt: string;
}

export interface TicketAttachment {
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  answered: number;
  closed: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface Brand {
  _id?: string;
  id?: string;
  sequentialId?: number;
  name: string;
  slug: string;
  description?: string;
  logo: string; // URL لوگو برند
  imageUrl?: string; // آلترناتیو برای logo
  color?: string; // رنگ برند
  active: boolean;
  order: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  _id?: string;
  id?: string;
  productId: string; // ID محصول
  productSlug?: string; // slug محصول
  userId?: string; // ID کاربر (اختیاری برای مهمان‌ها)
  userName: string; // نام نمایشی
  userEmail?: string; // ایمیل (خصوصی)
  rating: number; // امتیاز 1-5
  title?: string; // عنوان نظر
  comment: string; // متن نظر
  pros?: string[]; // نقاط قوت
  cons?: string[]; // نقاط ضعف
  isVerifiedPurchase?: boolean; // خرید تایید شده
  isApproved: boolean; // تایید شده توسط ادمین
  isReported?: boolean; // گزارش شده
  helpfulCount?: number; // تعداد "مفید بود"
  notHelpfulCount?: number; // تعداد "مفید نبود"
  adminReply?: {
    text: string;
    repliedAt: string;
    repliedBy: string;
  };
  createdAt: string;
  updatedAt?: string;
}

// License System Types
export interface License {
  _id?: string;
  licenseKey: string; // کلید لایسنس منحصر به فرد (مثل: XXXX-XXXX-XXXX-XXXX)
  userId: string; // ID کاربر
  userEmail: string; // ایمیل کاربر
  productId: string; // ID محصول (قالب/افزونه)
  productName: string; // نام محصول
  productSlug?: string; // slug محصول
  orderId: string; // ID سفارش
  
  // اطلاعات فعال‌سازی
  domain: string; // دامنه فعال شده (مثل: example.com)
  activatedAt?: string; // زمان فعال‌سازی
  isActivated: boolean; // آیا فعال شده؟
  
  // وضعیت لایسنس
  status: 'active' | 'inactive' | 'suspended' | 'expired' | 'revoked';
  
  // محدودیت‌ها
  maxActivations: number; // تعداد مجاز فعال‌سازی (معمولاً 1)
  activationCount: number; // تعداد دفعات فعال‌سازی شده
  
  // تاریخ‌ها
  expiresAt?: string; // تاریخ انقضا (null = بدون محدودیت)
  createdAt: string;
  updatedAt: string;
  
  // تاریخچه فعال‌سازی‌ها
  activationHistory?: LicenseActivation[];
  
  // اطلاعات اضافی
  notes?: string; // یادداشت‌های ادمین
  metadata?: Record<string, any>; // داده‌های اضافی
}

export interface LicenseActivation {
  domain: string;
  ipAddress?: string;
  userAgent?: string;
  activatedAt: string;
  deactivatedAt?: string;
  isActive: boolean;
}

export interface LicenseVerifyRequest {
  licenseKey: string;
  domain: string;
  productId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LicenseVerifyResponse {
  valid: boolean;
  license?: License;
  message: string;
  product?: {
    id: string;
    name: string;
    version?: string;
  };
}

export interface LicenseCreateRequest {
  userId: string;
  userEmail: string;
  productId: string;
  orderId: string;
  domain: string;
  maxActivations?: number;
  expiresAt?: string;
}

export interface LicenseStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  expired: number;
  byProduct: Record<string, number>;
}

// Guarantee Section Types
export interface Guarantee {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  icon: string; // آیکون (emoji یا کلاس آیکون)
  iconType?: 'emoji' | 'class'; // نوع آیکون
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuaranteeSettings {
  _id?: string;
  sectionTitle: string; // عنوان بخش
  sectionSubtitle?: string; // زیرعنوان بخش
  showSection: boolean; // نمایش/عدم نمایش بخش
  backgroundColor?: string; // رنگ پس‌زمینه
  guarantees: Guarantee[]; // لیست گارانتی‌ها
  createdAt?: string;
  updatedAt?: string;
}

// Testimonial Section Types
export interface Testimonial {
  _id?: string;
  id?: string;
  customerName: string; // نام مشتری
  customerRole?: string; // نقش/شغل مشتری
  customerAvatar?: string; // تصویر مشتری
  rating: number; // امتیاز 1-5
  comment: string; // متن نظر
  productName?: string; // نام محصول (اختیاری)
  verified: boolean; // نظر تایید شده
  featured: boolean; // نظر ویژه
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestimonialSettings {
  _id?: string;
  sectionTitle: string; // عنوان بخش
  sectionSubtitle?: string; // زیرعنوان بخش
  showSection: boolean; // نمایش/عدم نمایش بخش
  autoPlay: boolean; // اسلاید خودکار
  autoPlayInterval?: number; // فاصله زمانی اسلاید (میلی‌ثانیه)
  backgroundColor?: string; // رنگ پس‌زمینه
  testimonials: Testimonial[]; // لیست نظرات
  createdAt?: string;
  updatedAt?: string;
}

// Features Section Types
export interface Feature {
  _id?: string;
  id?: string;
  title: string; // عنوان ویژگی
  description: string; // توضیحات
  icon: string; // آیکون (emoji یا کلاس آیکون)
  iconType?: 'emoji' | 'class'; // نوع آیکون
  iconColor?: string; // رنگ آیکون
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeaturesSettings {
  _id?: string;
  sectionTitle: string; // عنوان بخش
  sectionSubtitle?: string; // زیرعنوان بخش
  showSection: boolean; // نمایش/عدم نمایش بخش
  layout?: 'grid' | 'list' | 'cards'; // نوع چیدمان
  columns?: number; // تعداد ستون‌ها (2, 3, 4)
  backgroundColor?: string; // رنگ پس‌زمینه
  features: Feature[]; // لیست ویژگی‌ها
  createdAt?: string;
  updatedAt?: string;
}

export interface LatestProductsSettings {
  _id?: string;
  title: string;
  subtitle: string;
  maxProducts: number;
  active: boolean;
  selectionMode: 'manual' | 'latest' | 'random' | 'most_viewed' | 'best_selling' | 'highest_rated';
  autoUpdateInterval: number; // به ساعت
  selectedProducts: string[]; // آرایه IDهای محصولات انتخابی (در حالت manual)
  displayStyle: 'grid' | 'slider' | 'carousel';
  showDiscount: boolean;
  showRating: boolean;
  showQuickView: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// User Behavior Tracking & Recommendations
// ============================================

export interface UserBehaviorEvent {
  type: 'view' | 'cart' | 'purchase' | 'wishlist' | 'search' | 'click';
  productId?: string;
  categoryId?: string;
  searchQuery?: string;
  timestamp: Date;
  duration?: number; // ثانیه (برای view)
  metadata?: Record<string, any>;
}

export interface UserBehavior {
  _id?: string;
  userId?: string; // اگر لاگین باشه
  sessionId: string; // برای کاربران مهمان
  events: UserBehaviorEvent[];
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationScore {
  productId: string;
  score: number;
  reasons: {
    categoryMatch: number;
    behaviorMatch: number;
    popularity: number;
    priceRange: number;
    recency: number;
    complementary: number;     // محصولات مکمل
    collaborative: number;     // فیلتر مشارکتی
  };
}

export interface RecommendationRequest {
  userId?: string;
  sessionId?: string;
  currentProductId?: string;
  limit?: number;
  excludeProductIds?: string[];
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: Product[];
  scores?: RecommendationScore[];
  error?: string;
}
