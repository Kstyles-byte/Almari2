'use client';
import { useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const value = term.trim();
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full block max-w-xs">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        <Search size={16} />
      </span>
      <input
        className="pl-9 pr-10 py-2 border border-gray-200 rounded-md w-full text-sm"
        placeholder="Search drop-off/pickup Code..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {/* Submit button (invisible but enables enter key on mobile keyboards) */}
      <button type="submit" className="absolute right-0 top-0 h-full w-9"></button>
    </form>
  );
} 