import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateProductUrl } from '@/lib/url-server';

// Legacy redirect: /products/:id => /products/category/path/slug-:sequentialId
export default async function LegacyIdRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await connectDB();
  let product: any = null;
  if (/^\d+$/.test(id)) {
    product = await db.products.findOne({ sequentialId: parseInt(id, 10) });
  } else if (/^[a-f\d]{24}$/i.test(id)) {
    product = await db.products.findOne({ _id: new ObjectId(id) });
  }
  if (!product) return notFound();
  const url = generateProductUrl(product);
  redirect(url);
}
