# Copilot Instructions for Store-App

## Project Overview
This is a **Next.js 15.5.0 e-commerce application** built with TypeScript, MongoDB, and Redis. The project follows Persian/Farsi localization conventions and implements a modern full-stack architecture.

**Key Technologies:**
- **Frontend:** Next.js 15.5.0, React 19, TypeScript, Tailwind CSS
- **Backend:** MongoDB, Redis (optional), NextAuth.js
- **UI/UX:** Persian/Farsi RTL design, responsive layouts
- **Performance:** Bundle analyzer, image optimization, caching

## Architecture Patterns

### 1. File Structure Convention
```
src/
├── app/                    # App Router (Next.js 13+)
├── components/            # Reusable UI components
├── lib/                   # Database connections, utilities
├── types/                 # TypeScript type definitions
├── utils/                 # Helper functions
├── contexts/              # React contexts
└── hooks/                 # Custom React hooks
```

### 2. Database Schema Patterns
- **MongoDB Collections:** Follow camelCase naming (e.g., `discountSections`, `blogPosts`)
- **Connection Singleton:** Use `src/lib/mongodb.ts` global instance pattern
- **Type Safety:** All MongoDB operations use TypeScript interfaces from `src/types/`

### 3. Component Architecture
- **Server Components:** Default for data fetching and static content
- **Client Components:** Use `"use client"` for interactivity
- **Conditional Rendering:** Components like `ConditionalNavFooter.tsx` for layout logic

## Development Workflows

### 1. Adding New Features
1. **Define Types First:** Update `src/types/index.ts` with new interfaces
2. **Create Database Collections:** Add collection getters to `mongodb.ts`
3. **Build API Endpoints:** Create routes in `src/app/api/`
4. **Implement UI Components:** Follow existing component patterns
5. **Test Integration:** Verify data flow from DB → API → UI

### 2. Product & E-commerce Logic
- **Product Display:** Use `MultipleDiscountSections.tsx` pattern for product grids
- **Admin Settings:** Respect collection settings (e.g., `discountSections`)
- **Responsive Design:** Always implement mobile-first responsive layouts
- **Persian/Farsi:** Support RTL text direction and Persian number formatting

### 3. API Development
- **Route Structure:** Follow Next.js App Router conventions (`src/app/api/`)
- **Error Handling:** Use consistent error response patterns
- **Authentication:** Admin routes require NextAuth.js role checking
- **Database Queries:** Use MongoDB aggregation pipelines for complex queries

## Code Standards & Conventions

### 1. TypeScript Guidelines
```typescript
// ✅ Good: Explicit interface definitions
interface Product {
  _id?: string;
  sequentialId?: number;
  name: string;
  price: number;
  category?: string | Category;
}

// ✅ Good: Proper error handling
try {
  const products = await db.products.find().toArray();
  return Response.json({ products });
} catch (error) {
  console.error('Database error:', error);
  return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
}
```

### 2. Component Patterns
```typescript
// ✅ Good: Server Component with proper data fetching
async function ProductSection() {
  const db = await connectDB();
  const products = await db.products.find({ active: true }).toArray();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}

// ✅ Good: Client Component with state management
"use client";
function InteractiveSlider({ products }: { products: Product[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Implementation...
}
```

### 3. Database Operations
```typescript
// ✅ Good: Using type-safe MongoDB operations
const products = await db.products.aggregate<Product>([
  { $match: { active: true } },
  { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
  { $sort: { createdAt: -1 } }
]).toArray();

// ✅ Good: Proper error handling and validation
if (!Array.isArray(products)) {
  console.warn('Products array is invalid:', products);
  return [];
}
```

## Critical Configuration Files

### 1. `next.config.ts`
- **Bundle Analyzer:** Enabled with `ANALYZE=true`
- **Image Optimization:** Custom domains and formats
- **Caching Headers:** Aggressive caching for static assets
- **Experimental Features:** `optimizePackageImports`, `turbo`

### 2. `src/app/layout.tsx`
- **Root Layout:** Providers, SEO metadata, performance optimizations
- **Dynamic Imports:** Lazy loading for non-critical components
- **Font Loading:** Custom Persian/Farsi font handling

### 3. `src/lib/mongodb.ts`
- **Global Instance:** Singleton pattern for connection reuse
- **Collection Getters:** Type-safe access to MongoDB collections
- **Connection Management:** Auto-reconnect and error handling

## Common Issues & Solutions

### 1. Frontend Navigation Logic
- **Problem:** Custom slider navigation not behaving correctly
- **Solution:** Validate data arrays before rendering, use responsive grids instead of complex sliders
- **Pattern:** Always implement fallback UI when data is undefined

### 2. MongoDB Connection Issues
- **Problem:** Database connection fails or collections not found
- **Solution:** Check `DATABASE_URL` environment variable, ensure collection names match getters
- **Pattern:** Use `connectDB()` helper function consistently

### 3. TypeScript Type Errors
- **Problem:** MongoDB documents don't match TypeScript interfaces
- **Solution:** Update `src/types/index.ts` to match actual database schema
- **Pattern:** Use optional properties (`?`) for flexible document structures

## Performance Optimization

### 1. Frontend Performance
- Use Next.js Image component for all product images
- Implement lazy loading for below-the-fold content
- Minimize JavaScript bundle size with dynamic imports

### 2. Database Performance
- Use MongoDB aggregation pipelines for complex queries
- Index frequently queried fields (e.g., `active`, `categoryId`)
- Implement pagination for large product lists

### 3. Caching Strategy
- Static assets cached for 1 year
- API responses cached based on data volatility
- Redis integration for session and frequently accessed data

## Security Considerations

### 1. Authentication
- Admin routes protected with NextAuth.js role checking
- Sensitive operations require proper authentication
- Use bcrypt for password hashing

### 2. Data Validation
- Validate all user inputs on both client and server
- Sanitize data before MongoDB operations
- Use TypeScript for compile-time type checking

## Testing & Deployment

### 1. Available Scripts
```bash
npm run dev         # Development server
npm run build       # Production build
npm run lint        # ESLint checking
npm run analyze     # Bundle analysis
npm run seed        # Database seeding
```

### 2. Environment Variables
- `DATABASE_URL`: MongoDB connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `REDIS_URL`: Redis connection (optional)

## AI Agent Guidelines

### 1. When Adding New Features
1. **Understand the existing pattern** - Read related components and API routes
2. **Follow TypeScript conventions** - Update types before implementing
3. **Respect the architecture** - Use Server Components for data, Client for interactivity
4. **Test data flow** - Verify database → API → frontend integration
5. **Consider Persian/Farsi** - Implement RTL support and proper localization

### 2. When Debugging Issues
1. **Check database connections** - Verify MongoDB collections and data structure
2. **Validate component props** - Ensure data is properly typed and validated
3. **Review error logs** - Check both browser console and server logs
4. **Test responsive design** - Verify mobile and desktop layouts
5. **Verify admin settings** - Check if admin configurations are respected

### 3. When Refactoring Code
1. **Maintain backward compatibility** - Don't break existing API contracts
2. **Update related components** - Check for dependencies and update accordingly
3. **Preserve user experience** - Maintain existing functionality while improving code
4. **Document changes** - Update types and comments as needed
5. **Test thoroughly** - Verify all affected features work correctly

## Key Principles
- **Type Safety First:** Use TypeScript interfaces for all data structures
- **Performance Oriented:** Optimize for Core Web Vitals and user experience
- **Persian/Farsi Support:** Maintain RTL design and proper localization
- **Scalable Architecture:** Follow patterns that support future growth
- **Error Resilience:** Handle edge cases and provide fallback UI components

---

*This document should be updated as the project evolves. Always refer to the latest code patterns and architectural decisions when implementing new features.*