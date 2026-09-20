import mongoose, { Document, Schema } from 'mongoose';

// Interface برای تنظیمات کلی SEO
export interface IGlobalSEOSettings extends Document {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  siteName: string;
  language: string;
  direction: 'rtl' | 'ltr';
  allowCrawling: boolean;
  googleSiteVerification: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  robotsRules: string[];
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
    telegram: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface برای تنظیمات صفحات SEO
export interface ISEOPage extends Document {
  url: string;
  title: string;
  description: string;
  keywords: string;
  content?: string;
  h1Title?: string;
  h2Title?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robotsContent?: string;
  structuredData?: any;
  customMeta?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema برای تنظیمات کلی SEO
const GlobalSEOSettingsSchema = new Schema<IGlobalSEOSettings>({
  siteTitle: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 60
  },
  siteDescription: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 160
  },
  siteUrl: { 
    type: String, 
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL نامعتبر است'
    }
  },
  siteName: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  language: { 
    type: String, 
    required: true,
    enum: ['fa', 'en'],
    default: 'fa'
  },
  direction: { 
    type: String, 
    required: true,
    enum: ['rtl', 'ltr'],
    default: 'rtl'
  },
  allowCrawling: { 
    type: Boolean, 
    default: true 
  },
  googleSiteVerification: { 
    type: String, 
    default: '',
    trim: true
  },
  googleAnalyticsId: { 
    type: String, 
    default: '',
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^(G-|UA-|GTM-)/.test(v);
      },
      message: 'شناسه Google Analytics نامعتبر است'
    }
  },
  googleTagManagerId: { 
    type: String, 
    default: '',
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^GTM-/.test(v);
      },
      message: 'شناسه Google Tag Manager نامعتبر است'
    }
  },
  robotsRules: [{ 
    type: String,
    trim: true
  }],
  socialMedia: {
    twitter: { type: String, default: '', trim: true },
    facebook: { type: String, default: '', trim: true },
    instagram: { type: String, default: '', trim: true },
    telegram: { type: String, default: '', trim: true }
  },
  contact: {
    email: { 
      type: String, 
      default: '', 
      trim: true,
      validate: {
        validator: function(v: string) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'ایمیل نامعتبر است'
      }
    },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true }
  }
}, {
  timestamps: true,
  collection: 'seo_global_settings'
});

// Schema برای صفحات SEO
const SEOPageSchema = new Schema<ISEOPage>({
  url: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^\//.test(v);
      },
      message: 'URL باید با / شروع شود'
    }
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 60
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 160
  },
  keywords: { 
    type: String, 
    default: '',
    trim: true
  },
  content: {
    type: String,
    default: '',
    trim: true
  },
  h1Title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100
  },
  h2Title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100
  },
  ogTitle: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: 60
  },
  ogDescription: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: 160
  },
  ogImage: { 
    type: String, 
    default: '',
    trim: true
  },
  twitterTitle: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: 60
  },
  twitterDescription: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: 160
  },
  twitterImage: { 
    type: String, 
    default: '',
    trim: true
  },
  canonicalUrl: { 
    type: String, 
    default: '',
    trim: true
  },
  robotsContent: { 
    type: String, 
    default: 'index,follow',
    trim: true
  },
  structuredData: { 
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  customMeta: { 
    type: Map,
    of: String,
    default: {}
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
  collection: 'seo_pages'
});

// Indexes برای بهبود performance  
SEOPageSchema.index({ isActive: 1 });
SEOPageSchema.index({ createdAt: -1 });

// Models
export const GlobalSEOSettings = mongoose.models.GlobalSEOSettings || mongoose.model<IGlobalSEOSettings>('GlobalSEOSettings', GlobalSEOSettingsSchema);
export const SEOPage = mongoose.models.SEOPage || mongoose.model<ISEOPage>('SEOPage', SEOPageSchema);