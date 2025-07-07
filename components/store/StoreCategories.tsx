"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface CategoryNavProps {
  categories: { id: string; name: string; slug: string }[];
}

export default function StoreCategories({ categories }: CategoryNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSlug = searchParams.get('category') || '';

  function buildUrl(newSlug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (newSlug) {
      params.set('category', newSlug);
    } else {
      params.delete('category');
    }
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      <Link
        href={buildUrl(null)}
        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
          currentSlug === ''
            ? 'bg-zervia-600 text-white border-zervia-600'
            : 'bg-white text-zervia-700 border-zervia-300 hover:bg-zervia-50'
        }`}
      >
        All Products
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={buildUrl(cat.slug)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            currentSlug === cat.slug
              ? 'bg-zervia-600 text-white border-zervia-600'
              : 'bg-white text-zervia-700 border-zervia-300 hover:bg-zervia-50'
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
} 