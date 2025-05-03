import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Star, X, Heart, ShoppingCart, Truck } from 'lucide-react';
import { Badge } from '../ui/badge';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description?: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  vendor: string;
  slug: string;
  inStock?: boolean;
  colors?: string[];
  sizes?: string[];
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: number) => void;
  onAddToWishlist: (productId: number) => void;
}

export function QuickViewModal({ product, isOpen, onClose, onAddToCart, onAddToWishlist }: QuickViewModalProps) {
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    if (product && product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product && product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    setQuantity(1);
  }, [product]);

  if (!product) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-4 top-4 z-10" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="relative h-80 md:h-full bg-zervia-50">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
            {product.isNew && (
              <Badge className="absolute top-4 left-4 bg-zervia-600">New</Badge>
            )}
          </div>
          
          {/* Product Details */}
          <div className="p-6 space-y-4">
            <DialogTitle className="text-xl md:text-2xl font-bold text-zervia-900">
              {product.name}
            </DialogTitle>
            
            <div className="flex items-center">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-zervia-500 text-zervia-500" />
                <span className="ml-1 text-sm font-medium text-zervia-700">{product.rating}</span>
              </div>
              <span className="mx-2 text-zervia-300">•</span>
              <span className="text-sm text-zervia-500">{product.reviews} reviews</span>
              <span className="mx-2 text-zervia-300">•</span>
              <span className="text-sm text-zervia-600">By {product.vendor}</span>
            </div>
            
            <div className="text-xl font-semibold text-zervia-900">₦{product.price.toFixed(2)}</div>
            
            {product.description && (
              <p className="text-zervia-600 text-sm line-clamp-3">{product.description}</p>
            )}
            
            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zervia-900 mb-2">Color</h4>
                <div className="flex space-x-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color
                          ? 'border-zervia-600'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select ${color} color`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zervia-900 mb-2">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`px-3 py-1 border rounded text-sm ${
                        selectedSize === size
                          ? 'border-zervia-600 bg-zervia-50 text-zervia-900'
                          : 'border-gray-200 text-zervia-600'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity & Add to Cart */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                {/* Quantity Selector */}
                <div className="flex items-center border rounded-md">
                  <button
                    className="w-8 h-8 flex items-center justify-center text-zervia-600"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{quantity}</span>
                  <button
                    className="w-8 h-8 flex items-center justify-center text-zervia-600"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 flex-1">
                  <Button
                    className="flex-1"
                    onClick={() => onAddToCart(product.id)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onAddToWishlist(product.id)}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Delivery Info */}
              <div className="flex items-center mt-4 text-sm text-zervia-600">
                <Truck className="w-4 h-4 mr-2" />
                <span>Available for agent pickup</span>
              </div>
            </div>
            
            {/* View Full Details Link */}
            <div className="pt-4 text-center">
              <Link
                href={`/product/${product.slug}`}
                className="text-sm text-zervia-600 font-medium hover:text-zervia-700"
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 