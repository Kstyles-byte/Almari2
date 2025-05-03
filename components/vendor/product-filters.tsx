"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface PriceRange {
  min: number;
  max: number;
}

export function VendorProductFilters() {
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 200 });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStockStatus, setSelectedStockStatus] = useState<string[]>([]);
  const [dateAdded, setDateAdded] = useState<string>('');
  const [dateModified, setDateModified] = useState<string>('');

  // Mock category data
  const categories = [
    { id: 'apparel', label: 'Apparel', count: 240 },
    { id: 'accessories', label: 'Accessories', count: 120 },
    { id: 'footwear', label: 'Footwear', count: 85 },
    { id: 'home', label: 'Home & Living', count: 65 },
    { id: 'beauty', label: 'Beauty', count: 42 },
  ];

  // Mock size data
  const sizes = [
    { id: 'xs', label: 'XS', count: 35 },
    { id: 's', label: 'S', count: 95 },
    { id: 'm', label: 'M', count: 120 },
    { id: 'l', label: 'L', count: 110 },
    { id: 'xl', label: 'XL', count: 75 },
    { id: 'xxl', label: 'XXL', count: 45 },
    { id: 'onesize', label: 'One Size', count: 180 },
  ];

  // Mock color data
  const colors = [
    { id: 'black', label: 'Black', count: 145, hex: '#000000' },
    { id: 'white', label: 'White', count: 132, hex: '#FFFFFF' },
    { id: 'gray', label: 'Gray', count: 89, hex: '#808080' },
    { id: 'blue', label: 'Blue', count: 78, hex: '#0000FF' },
    { id: 'red', label: 'Red', count: 56, hex: '#FF0000' },
    { id: 'green', label: 'Green', count: 42, hex: '#008000' },
    { id: 'brown', label: 'Brown', count: 37, hex: '#A52A2A' },
    { id: 'beige', label: 'Beige', count: 31, hex: '#F5F5DC' },
    { id: 'pink', label: 'Pink', count: 28, hex: '#FFC0CB' },
    { id: 'yellow', label: 'Yellow', count: 24, hex: '#FFFF00' },
  ];

  // Stock statuses
  const stockStatuses = [
    { id: 'in-stock', label: 'In Stock', count: 325 },
    { id: 'low-stock', label: 'Low Stock', count: 45 },
    { id: 'out-of-stock', label: 'Out of Stock', count: 85 },
    { id: 'backorder', label: 'On Backorder', count: 32 },
  ];

  // Toggle a category in the selected list
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Toggle a size in the selected list
  const toggleSize = (sizeId: string) => {
    setSelectedSizes(prev => {
      if (prev.includes(sizeId)) {
        return prev.filter(id => id !== sizeId);
      } else {
        return [...prev, sizeId];
      }
    });
  };

  // Toggle a color in the selected list
  const toggleColor = (colorId: string) => {
    setSelectedColors(prev => {
      if (prev.includes(colorId)) {
        return prev.filter(id => id !== colorId);
      } else {
        return [...prev, colorId];
      }
    });
  };

  // Toggle a stock status in the selected list
  const toggleStockStatus = (statusId: string) => {
    setSelectedStockStatus(prev => {
      if (prev.includes(statusId)) {
        return prev.filter(id => id !== statusId);
      } else {
        return [...prev, statusId];
      }
    });
  };

  // Handle price range change
  const handlePriceChange = (value: number[]) => {
    setPriceRange({ min: value[0], max: value[1] });
  };

  // Reset all filters
  const resetFilters = () => {
    setPriceRange({ min: 0, max: 200 });
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedStockStatus([]);
    setDateAdded('');
    setDateModified('');
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Categories */}
        <div>
          <h3 className="text-sm font-medium mb-3">Categories</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer flex-grow"
                >
                  {category.label}
                </label>
                <span className="text-xs text-gray-500">({category.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <h3 className="text-sm font-medium mb-3">Sizes</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {sizes.map((size) => (
              <div key={size.id} className="flex items-center">
                <Checkbox
                  id={`size-${size.id}`}
                  checked={selectedSizes.includes(size.id)}
                  onCheckedChange={() => toggleSize(size.id)}
                />
                <label
                  htmlFor={`size-${size.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer flex-grow"
                >
                  {size.label}
                </label>
                <span className="text-xs text-gray-500">({size.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <h3 className="text-sm font-medium mb-3">Colors</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {colors.map((color) => (
              <div key={color.id} className="flex items-center">
                <Checkbox
                  id={`color-${color.id}`}
                  checked={selectedColors.includes(color.id)}
                  onCheckedChange={() => toggleColor(color.id)}
                />
                <div
                  className="ml-2 w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: color.hex }}
                />
                <label
                  htmlFor={`color-${color.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer flex-grow"
                >
                  {color.label}
                </label>
                <span className="text-xs text-gray-500">({color.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Price Range */}
        <div>
          <h3 className="text-sm font-medium mb-3">Price Range</h3>
          <div className="px-2">
            <Slider
              defaultValue={[priceRange.min, priceRange.max]}
              max={200}
              step={5}
              onValueChange={handlePriceChange}
            />
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{formatPrice(priceRange.min)}</span>
              <span>{formatPrice(priceRange.max)}</span>
            </div>
          </div>
        </div>
        
        {/* Stock Status */}
        <div>
          <h3 className="text-sm font-medium mb-3">Stock Status</h3>
          <div className="space-y-2">
            {stockStatuses.map((status) => (
              <div key={status.id} className="flex items-center">
                <Checkbox
                  id={`status-${status.id}`}
                  checked={selectedStockStatus.includes(status.id)}
                  onCheckedChange={() => toggleStockStatus(status.id)}
                />
                <label
                  htmlFor={`status-${status.id}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer flex-grow"
                >
                  {status.label}
                </label>
                <span className="text-xs text-gray-500">({status.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Date Added */}
        <div>
          <Label htmlFor="date-added" className="text-sm font-medium">Date Added</Label>
          <Input 
            id="date-added"
            type="date"
            value={dateAdded}
            onChange={(e) => setDateAdded(e.target.value)}
            className="mt-1"
          />
        </div>
        
        {/* Date Modified */}
        <div>
          <Label htmlFor="date-modified" className="text-sm font-medium">Date Modified</Label>
          <Input 
            id="date-modified"
            type="date"
            value={dateModified}
            onChange={(e) => setDateModified(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <div className="flex flex-wrap gap-2">
          {selectedCategories.length > 0 && (
            <div className="inline-flex items-center bg-zervia-100 text-zervia-700 px-2 py-1 rounded-md text-xs">
              {selectedCategories.length} Categories
              <button
                onClick={() => setSelectedCategories([])}
                className="ml-1 text-zervia-700 hover:text-zervia-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {selectedSizes.length > 0 && (
            <div className="inline-flex items-center bg-zervia-100 text-zervia-700 px-2 py-1 rounded-md text-xs">
              {selectedSizes.length} Sizes
              <button
                onClick={() => setSelectedSizes([])}
                className="ml-1 text-zervia-700 hover:text-zervia-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {selectedColors.length > 0 && (
            <div className="inline-flex items-center bg-zervia-100 text-zervia-700 px-2 py-1 rounded-md text-xs">
              {selectedColors.length} Colors
              <button
                onClick={() => setSelectedColors([])}
                className="ml-1 text-zervia-700 hover:text-zervia-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {selectedStockStatus.length > 0 && (
            <div className="inline-flex items-center bg-zervia-100 text-zervia-700 px-2 py-1 rounded-md text-xs">
              {selectedStockStatus.length} Stock Statuses
              <button
                onClick={() => setSelectedStockStatus([])}
                className="ml-1 text-zervia-700 hover:text-zervia-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {(priceRange.min > 0 || priceRange.max < 200) && (
            <div className="inline-flex items-center bg-zervia-100 text-zervia-700 px-2 py-1 rounded-md text-xs">
              Price: {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
              <button
                onClick={() => setPriceRange({ min: 0, max: 200 })}
                className="ml-1 text-zervia-700 hover:text-zervia-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {dateAdded && (
            <div className="inline-flex items-center bg-zervia-100 text-zervia-700 px-2 py-1 rounded-md text-xs">
              Added: {dateAdded}
              <button
                onClick={() => setDateAdded('')}
                className="ml-1 text-zervia-700 hover:text-zervia-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {dateModified && (
            <div className="inline-flex items-center bg-zervia-100 text-zervia-700 px-2 py-1 rounded-md text-xs">
              Modified: {dateModified}
              <button
                onClick={() => setDateModified('')}
                className="ml-1 text-zervia-700 hover:text-zervia-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={resetFilters}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
} 