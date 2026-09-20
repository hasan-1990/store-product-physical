import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || 'home-top';

    const db = await connectDB();
    
    // Fetch sections from database
    const sections = await db.discountSections.find({
      position: position,
      active: true
    }).sort({ order: 1 }).toArray();

    if (sections.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sections: [], 
        products: [] 
      });
    }

    // Transform sections
    const transformedSections = sections.map(section => ({
      id: section._id?.toString() || section.id || '',
      title: section.title || '',
      subtitle: section.subtitle || '',
      active: section.active || false,
      maxProducts: section.maxProducts || 6,
      showDiscountBadge: section.showDiscountBadge || true,
      position: section.position || position,
      productType: section.productType || 'newest',
      selectedCategories: section.selectedCategories || [],
      order: section.order || 0
    }));

    // Fetch products for sections
    const allProducts = [];

    for (const section of transformedSections) {
      let query: any = { 
        active: true,
        // Always filter for discounted products only
        $and: [
          { originalPrice: { $exists: true } },
          { $expr: { $gt: ['$originalPrice', '$price'] } }
        ]
      };
      let sort: any = { createdAt: -1 };

      // Apply filters based on section configuration
      if (section.selectedCategories && section.selectedCategories.length > 0) {
        query.categoryId = { $in: section.selectedCategories };
      }

      // Apply sorting based on productType
      switch (section.productType) {
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'latest':
          sort = { updatedAt: -1 };
          break;
        case 'discounted':
          // Already filtered for discounted products above
          sort = { createdAt: -1 };
          break;
        case 'random':
          // MongoDB $sample for random selection
          break;
        default:
          sort = { createdAt: -1 };
      }

      let sectionProducts;

      if (section.productType === 'random') {
        sectionProducts = await db.products.aggregate([
          { $match: query },
          { $sample: { size: section.maxProducts } }
        ]).toArray();
      } else {
        sectionProducts = await db.products
          .find(query)
          .sort(sort)
          .limit(section.maxProducts)
          .toArray();
      }

      // Transform products to match interface
      const transformedProducts = sectionProducts.map(product => {
        // Calculate discount percentage if not present
        let discountPercentage = product.discountPercentage || 0;
        if (!discountPercentage && product.originalPrice && product.price && product.originalPrice > product.price) {
          discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        }

        return {
          id: product._id?.toString() || product.id || '',
          sequentialId: product.sequentialId || product.id || product._id?.toString(),
          name: product.name || '',
          price: product.price || 0,
          originalPrice: product.originalPrice,
          discountPercentage,
          imageUrl: product.imageUrl || product.image || '',
          slug: product.slug || '',
          category: product.category || '',
          categoryPath: product.categoryPath || [],
          sectionId: section.id
        };
      });

      allProducts.push(...transformedProducts);
    }

    return NextResponse.json({
      success: true,
      sections: transformedSections,
      products: allProducts
    });

  } catch (error) {
    console.error('Error fetching discount sections with products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch discount sections',
        sections: [],
        products: []
      },
      { status: 500 }
    );
  }
}