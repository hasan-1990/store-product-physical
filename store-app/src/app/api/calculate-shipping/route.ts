import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, provinceId, cityId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, cost: 0, error: 'No items provided' });
    }

    if (!provinceId) {
      return NextResponse.json({ success: false, cost: 0, error: 'Province ID is required' });
    }

    const db = await connectDB();

    // 1. Fetch products to get weights
    const productIds = items.map((item: any) => new ObjectId(item.productId));
    const products = await db.products.find({ _id: { $in: productIds } }).toArray();

    // 2. Calculate total weight
    let totalWeight = 0;
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (product) {
        const weight = product.weight || 0; // Weight in Kg
        totalWeight += weight * item.quantity;
      }
    }

    // 3. Find matching Shipping Zone
    // First try to find by City, then by Province
    // We need to fetch province/city names to match with zone strings
    // Or assuming zone stores IDs? The admin UI stores names (strings).
    // So we need to resolve IDs to Names first.

    const province = await db.provinces.findOne({ _id: new ObjectId(provinceId) });
    const provinceName = province ? province.province : '';
    
    // City might be an ID or name depending on frontend. 
    // In checkout, cityId is passed.
    // But cities collection might not exist or be used differently.
    // Let's assume we can get city name from province.cities if it's an index or ID.
    // In checkout page: cityId: `${formData.provinceId}-${index}`
    
    let cityName = '';
    if (cityId && province && province.cities) {
        // If cityId is like "provinceId-index"
        const parts = cityId.split('-');
        if (parts.length === 2) {
            const index = parseInt(parts[1]);
            if (!isNaN(index) && province.cities[index]) {
                cityName = province.cities[index];
            }
        }
    }

    // Fetch all zones
    const zones = await db.shippingZones.find({}).toArray();
    
    let matchedZone = null;

    // Priority 1: Match by City
    if (cityName) {
        matchedZone = zones.find(z => z.cities && z.cities.includes(cityName));
    }

    // Priority 2: Match by Province
    if (!matchedZone && provinceName) {
        matchedZone = zones.find(z => z.provinces && z.provinces.includes(provinceName));
    }

    // Priority 3: Default Zone (e.g. "Other Cities")
    if (!matchedZone) {
        matchedZone = zones.find(z => z.name === 'سایر شهرها' || z.name === 'سایر مناطق کشور');
    }

    // If still no zone, use a default fallback or the first one
    if (!matchedZone && zones.length > 0) {
        matchedZone = zones[0];
    }

    if (!matchedZone) {
         // Fallback if no zones defined at all
         return NextResponse.json({ success: true, cost: 0, weight: totalWeight, message: 'No shipping zones defined' });
    }

    // 4. Calculate Cost
    const pricePerKg = matchedZone.pricePerKg || 0;
    const multiplier = matchedZone.multiplier || 1;
    
    // Formula: Weight * PricePerKg * Multiplier
    // Ensure minimum weight of 1Kg if weight is small? Or just pure calculation.
    // Let's use pure calculation but maybe round up to 1000 Tomans?
    
    let shippingCost = totalWeight * pricePerKg * multiplier;
    
    // Minimum shipping cost? Maybe base price from shipping methods?
    // The user wants "Price per Kg".
    // If weight is 0 (e.g. digital), cost is 0.
    
    return NextResponse.json({ 
        success: true, 
        cost: Math.round(shippingCost), 
        weight: totalWeight,
        zone: matchedZone.name
    });

  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json({ success: false, cost: 0, error: 'Calculation failed' }, { status: 500 });
  }
}
