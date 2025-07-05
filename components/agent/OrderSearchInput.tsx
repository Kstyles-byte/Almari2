'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';



interface Props {
  defaultValue?: string;
}

export default function OrderSearchInput({ defaultValue = '' }: Props) {
  const [term, setTerm] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // debounced update
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      // Keep other params untouched (e.g., status)
      if (term) {
        params.set('q', term);
      } else {
        params.delete('q');
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <label className="relative w-full block max-w-xs">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        <Search size={16} />
      </span>
      <input
        className="pl-9 pr-3 py-2 border border-gray-200 rounded-md w-full text-sm"
        placeholder="Search Drop off Id..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
    </label>
  );
} 