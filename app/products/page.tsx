'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Filter, Grid2X2, List, Search as SearchIcon, ArrowDown, ArrowUp, Star, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Breadcrumb } from '../../components/ui/breadcrumb';
import { EmptyState } from '../../components/ui/empty-state';
import { Search } from '../../components/ui/search';
import { ProductFilters } from '../../components/products/product-filters';
import { MobileFilters } from '../../components/products/mobile-filters';
import { RecentlyViewedProducts } from '../../components/products/recently-viewed-products';

// Mock product data
const allProducts = [
  {
    id: 1,
    name: "Structured Cotton Blouse",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?q=80&w=3270&auto=format&fit=crop",
    category: "women",
    rating: 4.8,
    reviews: 124,
    isNew: true,
    vendor: "Emporium Elegance",
    slug: "structured-cotton-blouse",
    colors: ["white", "blue"],
    sizes: ["S", "M", "L"],
    brand: "Emporium Elegance"
  },
  {
    id: 2,
    name: "Classic Leather Sneakers",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&auto=format&fit=crop",
    category: "accessories",
    rating: 4.5,
    reviews: 86,
    isNew: false,
    vendor: "Urban Threads",
    slug: "classic-leather-sneakers",
    colors: ["white", "black"],
    sizes: ["40", "41", "42", "43"],
    brand: "Urban Threads"
  },
  {
    id: 3,
    name: "Relaxed Fit Denim Jacket",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&auto=format&fit=crop",
    category: "men",
    rating: 4.6,
    reviews: 62,
    isNew: true,
    vendor: "Urban Threads",
    slug: "relaxed-fit-denim-jacket",
    colors: ["blue", "black"],
    sizes: ["S", "M", "L", "XL"],
    brand: "Urban Threads"
  },
  {
    id: 4,
    name: "Summer Floral Dress",
    price: 65.99,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop",
    category: "women",
    rating: 4.9,
    reviews: 42,
    isNew: true,
    vendor: "Velvet Vault",
    slug: "summer-floral-dress",
    colors: ["green", "pink", "blue"],
    sizes: ["XS", "S", "M", "L"],
    brand: "Velvet Vault"
  },
  {
    id: 5,
    name: "Minimalist Wrist Watch",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=800&auto=format&fit=crop",
    category: "accessories",
    rating: 5.0,
    reviews: 18,
    isNew: false,
    vendor: "Emporium Elegance",
    slug: "minimalist-wrist-watch",
    colors: ["silver", "gold", "black"],
    sizes: ["one-size"],
    brand: "Emporium Elegance"
  },
  {
    id: 6,
    name: "Organic Cotton T-shirt",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop",
    category: "men",
    rating: 4.4,
    reviews: 76,
    isNew: false,
    vendor: "Urban Threads",
    slug: "organic-cotton-tshirt",
    colors: ["white", "black", "gray"],
    sizes: ["S", "M", "L", "XL"],
    brand: "Urban Threads"
  },
  {
    id: 7,
    name: "Designer Sunglasses",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop",
    category: "accessories",
    rating: 4.7,
    reviews: 53,
    isNew: true,
    vendor: "Emporium Elegance",
    slug: "designer-sunglasses",
    colors: ["brown", "black"],
    sizes: ["one-size"],
    brand: "Emporium Elegance"
  },
  {
    id: 8,
    name: "High-Waisted Jeans",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop",
    category: "women",
    rating: 4.6,
    reviews: 94,
    isNew: false,
    vendor: "Velvet Vault",
    slug: "high-waisted-jeans",
    colors: ["blue", "black"],
    sizes: ["26", "28", "30", "32"],
    brand: "Velvet Vault"
  }
];

// Initial filter data
const initialFilterData = {
  categories: {
    id: "categories",
    name: "Categories",
    options: [
      { id: "women", label: "Women's Fashion", count: 124 },
      { id: "men", label: "Men's Fashion", count: 98 },
      { id: "electronics", label: "Electronics", count: 56 },
      { id: "accessories", label: "Accessories", count: 87 },
      { id: "home", label: "Home & Living", count: 43 },
      { id: "beauty", label: "Beauty", count: 35 }
    ]
  },
  colors: {
    id: "colors",
    name: "Colors",
    options: [
      { id: "black", label: "Black", count: 32 },
      { id: "white", label: "White", count: 45 },
      { id: "blue", label: "Blue", count: 28 },
      { id: "green", label: "Green", count: 19 },
      { id: "pink", label: "Pink", count: 13 },
      { id: "gray", label: "Gray", count: 21 },
      { id: "brown", label: "Brown", count: 17 },
      { id: "gold", label: "Gold", count: 8 },
      { id: "silver", label: "Silver", count: 9 }
    ]
  },
  sizes: {
    id: "sizes",
    name: "Sizes",
    options: [
      { id: "XS", label: "XS", count: 15 },
      { id: "S", label: "S", count: 48 },
      { id: "M", label: "M", count: 52 },
      { id: "L", label: "L", count: 47 },
      { id: "XL", label: "XL", count: 30 },
      { id: "one-size", label: "One Size", count: 25 }
    ]
  },
  brands: {
    id: "brands",
    name: "Brands",
    options: [
      { id: "emporium-elegance", label: "Emporium Elegance", count: 32 },
      { id: "urban-threads", label: "Urban Threads", count: 45 },
      { id: "velvet-vault", label: "Velvet Vault", count: 28 },
      { id: "tech-elite", label: "TechElite", count: 19 },
      { id: "eco-ware", label: "EcoWare", count: 13 }
    ]
  }
};

// Sort options
const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" }
];

const FilterGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-sm font-medium text-zervia-900 mb-3">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

export default function ProductListingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(allProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState("featured");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    category: [],
    color: [],
    size: [],
    brand: []
  });
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 200,
    currentMin: 0,
    currentMax: 200
  });
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<typeof allProducts>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Effect to simulate fetching recently viewed products
  useEffect(() => {
    // In a real app, this would be fetched from an API or local storage
    const randomProducts = [...allProducts]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
    
    setRecentlyViewedProducts(randomProducts);
  }, []);

  // Effect to apply filters and search
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      let filtered = [...allProducts];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(query) || 
          product.vendor.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      }
      
      // Apply category filters
      if (selectedFilters.category.length > 0) {
        filtered = filtered.filter(product => 
          selectedFilters.category.includes(product.category)
        );
      }
      
      // Apply color filters
      if (selectedFilters.color.length > 0) {
        filtered = filtered.filter(product => 
          product.colors.some(color => selectedFilters.color.includes(color))
        );
      }
      
      // Apply size filters
      if (selectedFilters.size.length > 0) {
        filtered = filtered.filter(product => 
          product.sizes.some(size => selectedFilters.size.includes(size))
        );
      }
      
      // Apply brand filters
      if (selectedFilters.brand.length > 0) {
        filtered = filtered.filter(product => 
          selectedFilters.brand.includes(product.brand)
        );
      }
      
      // Apply price range filter
      filtered = filtered.filter(product => 
        product.price >= priceRange.currentMin && 
        product.price <= priceRange.currentMax
      );
      
      // Apply sorting
      switch (sortOption) {
        case 'price-asc':
          filtered = filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered = filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered = filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          filtered = filtered.sort((a, b) => (a.isNew === b.isNew) ? 0 : a.isNew ? -1 : 1);
          break;
        default:
          // 'featured' - no sorting needed, use default order
          break;
      }
      
      setFilteredProducts(filtered);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, selectedFilters, priceRange.currentMin, priceRange.currentMax, sortOption]);

  const handleFilterChange = (filterType: string, value: { id: string, checked: boolean }) => {
    setSelectedFilters(prev => {
      const current = [...prev[filterType]];
      if (value.checked) {
        current.push(value.id);
      } else {
        const index = current.indexOf(value.id);
        if (index > -1) {
          current.splice(index, 1);
        }
      }
      return { ...prev, [filterType]: current };
    });
  };

  const handlePriceChange = (min: number, max: number) => {
    setPriceRange(prev => ({
      ...prev,
      currentMin: min,
      currentMax: max
    }));
  };

  const handleClearFilters = () => {
    setSelectedFilters({
      category: [],
      color: [],
      size: [],
      brand: []
    });
    setPriceRange({
      min: 0,
      max: 200,
      currentMin: 0,
      currentMax: 200
    });
    setSearchQuery("");
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView);
  };

  // Count selected filters
  const selectedFilterCount = Object.values(selectedFilters).flat().length;

  return (
    <div className="bg-zervia-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-zervia-500 hover:text-zervia-600">Home</Link>
              </li>
              <li className="flex items-center">
                <span className="mx-2 text-zervia-400">/</span>
                <span className="font-medium text-zervia-900">Products</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Search 
            placeholder="Search products, brands, categories..." 
            onSearch={handleSearch}
            onClear={() => setSearchQuery("")}
            defaultValue={searchQuery}
            className="max-w-2xl mx-auto"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filters */}
          <MobileFilters
            open={showMobileFilters}
            onOpenChange={setShowMobileFilters}
            categories={initialFilterData.categories}
            colors={initialFilterData.colors}
            sizes={initialFilterData.sizes}
            brands={initialFilterData.brands}
            priceRange={priceRange}
            onFilterChange={handleFilterChange}
            onPriceChange={handlePriceChange}
            onClearFilters={handleClearFilters}
            onApplyFilters={() => {}} // No additional action needed
            selectedFilterCount={selectedFilterCount}
          />
          
          {/* Advanced Filters Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:w-1/4">
            <ProductFilters
              categories={initialFilterData.categories}
              colors={initialFilterData.colors}
              sizes={initialFilterData.sizes}
              brands={initialFilterData.brands}
              priceRange={priceRange}
              onFilterChange={handleFilterChange}
              onPriceChange={handlePriceChange}
              onClearFilters={handleClearFilters}
              className="bg-white rounded-xl p-6 shadow-sm"
            />
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Top Controls */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-zervia-900 mr-3">All Products</h1>
                  <span className="text-sm text-zervia-500">({filteredProducts.length} products)</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Mobile filter toggle button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="lg:hidden flex items-center gap-2"
                    onClick={() => setShowMobileFilters(true)}
                  >
                    <Filter className="h-4 w-4" /> 
                    Filters
                    {selectedFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 text-xs">
                        {selectedFilterCount}
                      </Badge>
                    )}
                  </Button>
                  
                  <div className="relative w-full md:w-auto">
                    <select
                      className="w-full md:w-48 appearance-none bg-zervia-50 border border-zervia-200 rounded-lg py-2 pl-3 pr-10 text-sm text-zervia-700 focus:outline-none focus:ring-2 focus:ring-zervia-500 focus:border-zervia-500"
                      value={sortOption}
                      onChange={handleSortChange}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ArrowDown className="h-4 w-4 text-zervia-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className={view === 'grid' 
                        ? "bg-zervia-50 border-zervia-200 text-zervia-700" 
                        : "bg-white border-zervia-200 text-zervia-500"}
                      onClick={() => handleViewChange('grid')}
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={view === 'list' 
                        ? "bg-zervia-50 border-zervia-200 text-zervia-700" 
                        : "bg-white border-zervia-200 text-zervia-500"}
                      onClick={() => handleViewChange('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zervia-600"></div>
              </div>
            )}

            {/* Products Grid or List */}
            {!isLoading && filteredProducts.length > 0 ? (
              <div className={view === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {filteredProducts.map((product) => (
                  <Card key={product.id} className={`group overflow-hidden ${view === 'list' ? "flex" : ""}`}>
                    <div className={`relative ${view === 'list' ? "w-1/3" : ""}`}>
                      <Link href={`/product/${product.slug}`}>
                        <div className="relative h-60 w-full overflow-hidden">
                          <Image
                            src={product.image || '/images/placeholder.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      </Link>
                      {product.isNew && (
                        <Badge className="absolute top-3 left-3 bg-zervia-600">New</Badge>
                      )}
                      <div className="absolute top-3 right-3 space-y-2">
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full bg-white opacity-90 hover:opacity-100">
                          <Heart className="h-4 w-4 text-zervia-600" />
                        </Button>
                      </div>
                    </div>
                    <div className={`p-4 ${view === 'list' ? "w-2/3" : ""}`}>
                      <Link href={`/product/${product.slug}`} className="group">
                        <h3 className="font-medium text-zervia-900 group-hover:text-zervia-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-zervia-500 mt-1">{product.vendor}</p>
                      <div className="flex items-center mt-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < Math.floor(product.rating)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-zervia-500 ml-1">
                          ({product.reviews})
                        </span>
                      </div>
                      {view === 'list' && (
                        <p className="mt-2 text-sm text-zervia-600 line-clamp-2">
                          A beautiful {product.name.toLowerCase()} made with premium materials. Perfect for any occasion.
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="font-semibold text-zervia-900">${product.price.toFixed(2)}</div>
                        <Button size="sm" className="rounded-lg">
                          <ShoppingCart className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : !isLoading && (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters or search to find what you're looking for."
                icon={<SearchIcon className="h-12 w-12 text-zervia-300" />}
                action={<Button onClick={handleClearFilters}>Clear Filters</Button>}
              />
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="text-zervia-500" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-zervia-600 text-white border-zervia-600">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="text-zervia-700">
                    2
                  </Button>
                  <Button variant="outline" size="sm" className="text-zervia-700">
                    3
                  </Button>
                  <span className="px-2 text-zervia-500">...</span>
                  <Button variant="outline" size="sm" className="text-zervia-700">
                    8
                  </Button>
                  <Button variant="outline" size="sm" className="text-zervia-700">
                    Next
                  </Button>
                </nav>
              </div>
            )}

            {/* Recently Viewed Products */}
            {recentlyViewedProducts.length > 0 && (
              <RecentlyViewedProducts products={recentlyViewedProducts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 