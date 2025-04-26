'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowUpDown, 
  ChevronDown, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorProductFilters } from '@/components/vendor/product-filters';

// Mock product data
const mockProducts = [
  {
    id: 'prod-001',
    name: 'Premium Cotton T-Shirt',
    sku: 'TSH-001',
    price: 29.99,
    stock: 120,
    category: 'Apparel',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop',
    sold: 128,
    sales: 3839.72,
    variations: [
      { id: 'var-001', color: 'White', size: 'S', stock: 15 },
      { id: 'var-002', color: 'White', size: 'M', stock: 25 },
      { id: 'var-003', color: 'White', size: 'L', stock: 30 },
      { id: 'var-004', color: 'Black', size: 'S', stock: 10 },
      { id: 'var-005', color: 'Black', size: 'M', stock: 20 },
      { id: 'var-006', color: 'Black', size: 'L', stock: 20 },
    ]
  },
  {
    id: 'prod-002',
    name: 'Classic Denim Jacket',
    sku: 'DJK-001',
    price: 89.99,
    stock: 75,
    category: 'Apparel',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=300&h=300&fit=crop',
    sold: 75,
    sales: 6749.25,
    variations: [
      { id: 'var-007', color: 'Blue', size: 'S', stock: 15 },
      { id: 'var-008', color: 'Blue', size: 'M', stock: 25 },
      { id: 'var-009', color: 'Blue', size: 'L', stock: 20 },
      { id: 'var-010', color: 'Blue', size: 'XL', stock: 15 },
    ]
  },
  {
    id: 'prod-003',
    name: 'Vintage Leather Backpack',
    sku: 'BPK-001',
    price: 120.00,
    stock: 42,
    category: 'Accessories',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop',
    sold: 62,
    sales: 7440.00,
    variations: [
      { id: 'var-011', color: 'Brown', size: 'One Size', stock: 22 },
      { id: 'var-012', color: 'Black', size: 'One Size', stock: 20 },
    ]
  },
  {
    id: 'prod-004',
    name: 'Slim Fit Chino Pants',
    sku: 'PNT-001',
    price: 45.99,
    stock: 54,
    category: 'Apparel',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
    sold: 54,
    sales: 2483.46,
    variations: [
      { id: 'var-013', color: 'Khaki', size: '30', stock: 10 },
      { id: 'var-014', color: 'Khaki', size: '32', stock: 15 },
      { id: 'var-015', color: 'Khaki', size: '34', stock: 12 },
      { id: 'var-016', color: 'Navy', size: '30', stock: 5 },
      { id: 'var-017', color: 'Navy', size: '32', stock: 7 },
      { id: 'var-018', color: 'Navy', size: '34', stock: 5 },
    ]
  },
  {
    id: 'prod-005',
    name: 'Premium Wool Blend Coat',
    sku: 'COAT-001',
    price: 189.99,
    stock: 3,
    category: 'Apparel',
    status: 'low-stock',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&h=300&fit=crop',
    sold: 28,
    sales: 5319.72,
    variations: [
      { id: 'var-019', color: 'Camel', size: 'S', stock: 0 },
      { id: 'var-020', color: 'Camel', size: 'M', stock: 1 },
      { id: 'var-021', color: 'Camel', size: 'L', stock: 0 },
      { id: 'var-022', color: 'Gray', size: 'S', stock: 0 },
      { id: 'var-023', color: 'Gray', size: 'M', stock: 1 },
      { id: 'var-024', color: 'Gray', size: 'L', stock: 1 },
    ]
  },
  {
    id: 'prod-006',
    name: 'Cashmere Blend Scarf',
    sku: 'SCARF-003',
    price: 59.99,
    stock: 5,
    category: 'Accessories',
    status: 'low-stock',
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=300&fit=crop',
    sold: 35,
    sales: 2099.65,
    variations: [
      { id: 'var-025', color: 'Gray', size: 'One Size', stock: 2 },
      { id: 'var-026', color: 'Navy', size: 'One Size', stock: 1 },
      { id: 'var-027', color: 'Red', size: 'One Size', stock: 2 },
    ]
  },
  {
    id: 'prod-007',
    name: 'Leather Gloves',
    sku: 'GLOVE-002',
    price: 49.99,
    stock: 2,
    category: 'Accessories',
    status: 'low-stock',
    image: 'https://images.unsplash.com/photo-1613666584591-7d11dcef511b?w=300&h=300&fit=crop',
    sold: 18,
    sales: 899.82,
    variations: [
      { id: 'var-028', color: 'Brown', size: 'S', stock: 0 },
      { id: 'var-029', color: 'Brown', size: 'M', stock: 1 },
      { id: 'var-030', color: 'Brown', size: 'L', stock: 1 },
      { id: 'var-031', color: 'Black', size: 'S', stock: 0 },
      { id: 'var-032', color: 'Black', size: 'M', stock: 0 },
      { id: 'var-033', color: 'Black', size: 'L', stock: 0 },
    ]
  },
  {
    id: 'prod-008',
    name: 'Winter Boots',
    sku: 'BOOT-005',
    price: 129.99,
    stock: 4,
    category: 'Footwear',
    status: 'low-stock',
    image: 'https://images.unsplash.com/photo-1542840843-3349799cded6?w=300&h=300&fit=crop',
    sold: 22,
    sales: 2859.78,
    variations: [
      { id: 'var-034', color: 'Brown', size: '7', stock: 1 },
      { id: 'var-035', color: 'Brown', size: '8', stock: 1 },
      { id: 'var-036', color: 'Brown', size: '9', stock: 1 },
      { id: 'var-037', color: 'Brown', size: '10', stock: 1 },
      { id: 'var-038', color: 'Brown', size: '11', stock: 0 },
    ]
  },
  {
    id: 'prod-009',
    name: 'Minimalist Watch',
    sku: 'WATCH-001',
    price: 89.99,
    stock: 8,
    category: 'Accessories',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300&h=300&fit=crop',
    sold: 42,
    sales: 3779.58,
    variations: [
      { id: 'var-039', color: 'Silver', size: 'One Size', stock: 4 },
      { id: 'var-040', color: 'Gold', size: 'One Size', stock: 4 },
    ]
  },
  {
    id: 'prod-010',
    name: 'Silk Pajama Set',
    sku: 'PJS-001',
    price: 79.99,
    stock: 0,
    category: 'Apparel',
    status: 'out-of-stock',
    image: 'https://images.unsplash.com/photo-1553670160-89fe6bf3fef8?w=300&h=300&fit=crop',
    sold: 30,
    sales: 2399.70,
    variations: [
      { id: 'var-041', color: 'Navy', size: 'S', stock: 0 },
      { id: 'var-042', color: 'Navy', size: 'M', stock: 0 },
      { id: 'var-043', color: 'Navy', size: 'L', stock: 0 },
    ]
  },
];

// Status badge configurations
const statusConfig = {
  'active': { label: 'Active', color: 'bg-green-100 text-green-800' },
  'low-stock': { label: 'Low Stock', color: 'bg-amber-100 text-amber-800' },
  'out-of-stock': { label: 'Out of Stock', color: 'bg-red-100 text-red-800' },
  'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  'archived': { label: 'Archived', color: 'bg-purple-100 text-purple-800' },
};

export default function VendorProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let filtered = [...mockProducts];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.sku.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.status === selectedStatus);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Sort products
    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'stock-asc':
        filtered.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-desc':
        filtered.sort((a, b) => b.stock - a.stock);
        break;
      case 'sold-desc':
        filtered.sort((a, b) => b.sold - a.sold);
        break;
      case 'revenue-desc':
        filtered.sort((a, b) => b.sales - a.sales);
        break;
      default:
        break;
    }
    
    return filtered;
  }, [searchTerm, selectedStatus, selectedCategory, sortBy]);

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id));
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    // In a real app, these would be API calls
    console.log(`Performing ${action} on:`, selectedProducts);
    
    // Reset selection after action
    setSelectedProducts([]);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-zervia-500">Manage your product catalog</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="flex items-center"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/vendor/products/import">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Link>
          </Button>
          <Button asChild>
            <Link href="/vendor/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Search, Filter, and Bulk Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input 
              placeholder="Search products by name or SKU" 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Apparel">Apparel</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Footwear">Footwear</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                <SelectItem value="sold-desc">Best Selling</SelectItem>
                <SelectItem value="revenue-desc">Highest Revenue</SelectItem>
              </SelectContent>
            </Select>
            
            {/* View Toggle */}
            <div className="flex border rounded-md overflow-hidden">
              <Button 
                variant={view === 'grid' ? 'default' : 'ghost'} 
                size="sm" 
                className="rounded-none"
                onClick={() => setView('grid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                </svg>
              </Button>
              <Button 
                variant={view === 'list' ? 'default' : 'ghost'} 
                size="sm" 
                className="rounded-none"
                onClick={() => setView('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters (collapsible) */}
        {isFiltersVisible && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <VendorProductFilters />
            </CardContent>
          </Card>
        )}
        
        {/* Bulk Actions (when products selected) */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center justify-between bg-zervia-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all" 
                checked={selectedProducts.length === filteredProducts.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                {selectedProducts.length} products selected
              </label>
            </div>
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('update-stock')}>
                    Update Stock
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('update-price')}>
                    Update Price
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('archive')} className="text-amber-600">
                    Archive Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600">
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProducts([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Products Display */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Products ({mockProducts.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({mockProducts.filter(p => p.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock ({mockProducts.filter(p => p.status === 'low-stock').length})</TabsTrigger>
          <TabsTrigger value="out-of-stock">Out of Stock ({mockProducts.filter(p => p.status === 'out-of-stock').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative">
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    
                    <div className="absolute top-2 left-2">
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)} 
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        className="h-5 w-5 bg-white/90 border-0"
                      />
                    </div>
                    
                    <div className="absolute top-2 right-2">
                      <Badge className={statusConfig[product.status].color}>
                        {statusConfig[product.status].label}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium truncate" title={product.name}>{product.name}</h3>
                      <div className="flex justify-between text-sm">
                        <span className="text-zervia-500">SKU: {product.sku}</span>
                        <span className="font-semibold">${product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zervia-500">Stock: {product.stock}</span>
                        <span className="text-zervia-500">Sold: {product.sold}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <Link href={`/vendor/products/${product.id}`} className="text-zervia-600 hover:text-zervia-800 text-sm">
                        View Details
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/product/${product.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Product
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/vendor/products/${product.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/vendor/products/${product.id}/inventory`}>
                              <Package className="mr-2 h-4 w-4" />
                              Manage Stock
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-zervia-50">
                    <tr>
                      <th className="pl-4 py-3.5">
                        <Checkbox 
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={handleSelectAll}
                          className="h-4 w-4"
                        />
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-medium text-zervia-900">Product</th>
                      <th className="px-4 py-3.5 text-left text-sm font-medium text-zervia-900">SKU</th>
                      <th className="px-4 py-3.5 text-left text-sm font-medium text-zervia-900">Category</th>
                      <th className="px-4 py-3.5 text-left text-sm font-medium text-zervia-900">Price</th>
                      <th className="px-4 py-3.5 text-left text-sm font-medium text-zervia-900">Stock</th>
                      <th className="px-4 py-3.5 text-left text-sm font-medium text-zervia-900">Status</th>
                      <th className="px-4 py-3.5 text-left text-sm font-medium text-zervia-900">Sold</th>
                      <th className="px-4 py-3.5 text-left text-sm font-medium text-zervia-900">Sales</th>
                      <th className="px-4 py-3.5 text-right text-sm font-medium text-zervia-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-zervia-50">
                        <td className="pl-4 py-4">
                          <Checkbox 
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden mr-3">
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 object-cover"
                              />
                            </div>
                            <div className="truncate max-w-[150px]" title={product.name}>
                              {product.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-zervia-500">{product.sku}</td>
                        <td className="px-4 py-4 text-sm text-zervia-500">{product.category}</td>
                        <td className="px-4 py-4 text-sm font-medium">${product.price.toFixed(2)}</td>
                        <td className="px-4 py-4 text-sm text-zervia-500">{product.stock}</td>
                        <td className="px-4 py-4">
                          <Badge className={statusConfig[product.status].color}>
                            {statusConfig[product.status].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-zervia-500">{product.sold}</td>
                        <td className="px-4 py-4 text-sm font-medium">${product.sales.toFixed(2)}</td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/vendor/products/${product.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/vendor/products/${product.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/vendor/products/${product.id}/inventory`}>
                                  <Package className="mr-2 h-4 w-4" />
                                  Manage Stock
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active">
          {/* Same UI as "all" tab but filtered for active products */}
          <div className="p-8 text-center text-gray-500">
            This tab would show only active products with the same UI as the All Products tab.
          </div>
        </TabsContent>
        
        <TabsContent value="low-stock">
          {/* Same UI as "all" tab but filtered for low-stock products */}
          <div className="p-8 text-center text-gray-500">
            This tab would show only low-stock products with the same UI as the All Products tab.
          </div>
        </TabsContent>
        
        <TabsContent value="out-of-stock">
          {/* Same UI as "all" tab but filtered for out-of-stock products */}
          <div className="p-8 text-center text-gray-500">
            This tab would show only out-of-stock products with the same UI as the All Products tab.
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Export Panel */}
      <Card className="bg-white mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Export Products</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="max-w-lg">
            <p className="text-sm text-zervia-500 mb-4 sm:mb-0">
              Export your product catalog as CSV or Excel file for backup or use with other systems.
              You can export all products or use filters to export specific products.
            </p>
          </div>
          <div className="flex gap-3 self-end sm:self-auto">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export as Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 