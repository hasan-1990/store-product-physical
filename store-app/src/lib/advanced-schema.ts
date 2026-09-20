import { IGlobalSEOSettings } from '@/lib/seo-helpers';

// Schema Types
export type SchemaType = 
  | 'WebSite'
  | 'Organization' 
  | 'LocalBusiness'
  | 'Product'
  | 'Article'
  | 'BlogPosting'
  | 'FAQPage'
  | 'Review'
  | 'Event'
  | 'BreadcrumbList'
  | 'VideoObject'
  | 'ImageObject'
  | 'Question'
  | 'Answer'
  | 'Person'
  | 'Place'
  | 'Thing';

// Schema Interfaces
export interface BaseSchema {
  "@context": "https://schema.org";
  "@type": SchemaType;
  [key: string]: any;
}

export interface WebSiteSchema extends BaseSchema {
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
}

export interface OrganizationSchema extends BaseSchema {
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: ContactPoint[];
  address?: PostalAddress;
  sameAs?: string[];
}

export interface LocalBusinessSchema extends BaseSchema {
  "@type": "LocalBusiness";
  name: string;
  description: string;
  url: string;
  telephone?: string;
  email?: string;
  address: PostalAddress;
  geo?: GeoCoordinates;
  openingHours?: string[];
  priceRange?: string;
  paymentAccepted?: string[];
  currenciesAccepted?: string[];
  aggregateRating?: AggregateRating;
  review?: Review[];
}

export interface FAQSchema extends BaseSchema {
  "@type": "FAQPage";
  mainEntity: FAQItem[];
}

export interface FAQItem {
  "@type": "Question";
  name: string;
  acceptedAnswer: {
    "@type": "Answer";
    text: string;
  };
}

export interface ReviewSchema extends BaseSchema {
  "@type": "Review";
  reviewBody: string;
  reviewRating: Rating;
  author: Person | Organization;
  datePublished?: string;
  itemReviewed: Thing;
}

export interface EventSchema extends BaseSchema {
  "@type": "Event";
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: Place | VirtualLocation;
  organizer?: Organization | Person;
  offers?: Offer[];
  eventStatus?: "EventScheduled" | "EventCancelled" | "EventPostponed" | "EventRescheduled";
  eventAttendanceMode?: "OfflineEventAttendanceMode" | "OnlineEventAttendanceMode" | "MixedEventAttendanceMode";
}

export interface BreadcrumbSchema extends BaseSchema {
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

// Supporting Types
export interface ContactPoint {
  "@type": "ContactPoint";
  telephone?: string;
  contactType: string;
  email?: string;
  availableLanguage?: string[];
}

export interface PostalAddress {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface GeoCoordinates {
  "@type": "GeoCoordinates";
  latitude: number;
  longitude: number;
}

export interface AggregateRating {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface Rating {
  "@type": "Rating";
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
}

export interface Review {
  "@type": "Review";
  reviewBody: string;
  reviewRating: Rating;
  author: Person;
  datePublished: string;
}

export interface Person {
  "@type": "Person";
  name: string;
  url?: string;
}

export interface Organization {
  "@type": "Organization";
  name: string;
  url?: string;
}

export interface Thing {
  "@type": string;
  name: string;
  url?: string;
}

export interface Place {
  "@type": "Place";
  name: string;
  address: PostalAddress;
  geo?: GeoCoordinates;
}

export interface VirtualLocation {
  "@type": "VirtualLocation";
  url: string;
}

export interface Offer {
  "@type": "Offer";
  price: string;
  priceCurrency: string;
  availability?: string;
  validFrom?: string;
  validThrough?: string;
}

// Generator Functions
export class AdvancedSchemaGenerator {
  
  static generateWebSiteSchema(settings: IGlobalSEOSettings): WebSiteSchema {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.siteName,
      url: settings.siteUrl,
      description: settings.siteDescription,
      potentialAction: {
        "@type": "SearchAction",
        target: `${settings.siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
  }

  static generateOrganizationSchema(settings: IGlobalSEOSettings): OrganizationSchema {
    const schema: OrganizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.siteName,
      url: settings.siteUrl,
      description: settings.siteDescription
    };

    // اضافه کردن شبکه‌های اجتماعی
    const sameAs = [];
    if (settings.socialMedia?.facebook) sameAs.push(settings.socialMedia.facebook);
    if (settings.socialMedia?.twitter) sameAs.push(settings.socialMedia.twitter);
    if (settings.socialMedia?.instagram) sameAs.push(settings.socialMedia.instagram);
    if (settings.socialMedia?.telegram) sameAs.push(settings.socialMedia.telegram);
    
    if (sameAs.length > 0) {
      schema.sameAs = sameAs;
    }

    // اضافه کردن اطلاعات تماس
    if (settings.contact?.email || settings.contact?.phone) {
      schema.contactPoint = [];
      
      if (settings.contact.email) {
        schema.contactPoint.push({
          "@type": "ContactPoint",
          email: settings.contact.email,
          contactType: "customer service"
        });
      }
      
      if (settings.contact.phone) {
        schema.contactPoint.push({
          "@type": "ContactPoint",
          telephone: settings.contact.phone,
          contactType: "customer service"
        });
      }
    }

    // اضافه کردن آدرس
    if (settings.contact?.address) {
      schema.address = {
        "@type": "PostalAddress",
        streetAddress: settings.contact.address,
        addressCountry: "IR"
      };
    }

    return schema;
  }

  static generateLocalBusinessSchema(
    settings: IGlobalSEOSettings,
    businessType: string = "Store",
    coordinates?: { lat: number; lng: number },
    openingHours?: string[],
    priceRange?: string
  ): LocalBusinessSchema {
    const schema: LocalBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: settings.siteName,
      description: settings.siteDescription,
      url: settings.siteUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.contact?.address || "",
        addressCountry: "IR"
      }
    };

    if (settings.contact?.phone) {
      schema.telephone = settings.contact.phone;
    }

    if (settings.contact?.email) {
      schema.email = settings.contact.email;
    }

    if (coordinates) {
      schema.geo = {
        "@type": "GeoCoordinates",
        latitude: coordinates.lat,
        longitude: coordinates.lng
      };
    }

    if (openingHours) {
      schema.openingHours = openingHours;
    }

    if (priceRange) {
      schema.priceRange = priceRange;
    }

    schema.paymentAccepted = ["Cash", "Credit Card", "Debit Card"];
    schema.currenciesAccepted = ["IRR"];

    return schema;
  }

  static generateFAQSchema(faqs: { question: string; answer: string }[]): FAQSchema {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(faq => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    };
  }

  static generateBreadcrumbSchema(breadcrumbs: { name: string; url?: string }[]): BreadcrumbSchema {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        ...(crumb.url && { item: crumb.url })
      }))
    };
  }

  static generateEventSchema(
    name: string,
    description: string,
    startDate: string,
    endDate: string,
    location: string,
    organizer: string,
    offers?: { price: string; currency: string }[]
  ): EventSchema {
    const schema: EventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name,
      description,
      startDate,
      endDate,
      location: {
        "@type": "Place",
        name: location,
        address: {
          "@type": "PostalAddress",
          addressCountry: "IR"
        }
      },
      organizer: {
        "@type": "Organization",
        name: organizer
      },
      eventStatus: "EventScheduled",
      eventAttendanceMode: "OfflineEventAttendanceMode"
    };

    if (offers && offers.length > 0) {
      schema.offers = offers.map(offer => ({
        "@type": "Offer",
        price: offer.price,
        priceCurrency: offer.currency,
        availability: "https://schema.org/InStock"
      }));
    }

    return schema;
  }

  static generateReviewSchema(
    reviewText: string,
    rating: number,
    authorName: string,
    itemName: string,
    itemUrl: string,
    datePublished: string
  ): ReviewSchema {
    return {
      "@context": "https://schema.org",
      "@type": "Review",
      reviewBody: reviewText,
      reviewRating: {
        "@type": "Rating",
        ratingValue: rating,
        bestRating: 5,
        worstRating: 1
      },
      author: {
        "@type": "Person",
        name: authorName
      },
      datePublished,
      itemReviewed: {
        "@type": "Thing",
        name: itemName,
        url: itemUrl
      }
    };
  }
}