/**
 * ساخت URLهای دسته‌بندی — منطق واحد برای CategoryCard و تست‌های regression
 */
export function buildCategoryPath(currentPath: string, slug: string): string {
  return currentPath ? `${currentPath}/${slug}` : slug;
}

export function getCategoryHubUrl(
  currentPath: string,
  slug: string,
  subcategoryCount: number
): string {
  const path = buildCategoryPath(currentPath, slug);
  return subcategoryCount > 0 ? `/categories/${path}` : `/products/${path}`;
}

export function getSubcategoryProductUrl(
  currentPath: string,
  parentSlug: string,
  subSlug: string
): string {
  const path = buildCategoryPath(currentPath, parentSlug);
  return `/products/${path}/${subSlug}`;
}
