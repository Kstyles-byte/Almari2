"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWishlistItem } from "@/actions/wishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  initialInWishlist: boolean;
  className?: string;
  variant?: "icon" | "button";
}

export function WishlistButton({
  productId,
  initialInWishlist,
  className = "",
  variant = "icon"
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(initialInWishlist);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggleWishlist = async () => {
    try {
      setIsLoading(true);
      setIsAnimating(true);
      const result = await toggleWishlistItem(productId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setIsInWishlist(!isInWishlist);
      
      if (isInWishlist) {
        toast.success("Removed from wishlist");
      } else {
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error("Error updating wishlist");
      console.error("Wishlist toggle error:", error);
    } finally {
      setIsLoading(false);
      // Reset animation state after animation completes
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggleWishlist}
        disabled={isLoading}
        className={cn(
          "relative p-2.5 rounded-full transition-all duration-200 shadow-sm",
          isInWishlist
            ? "bg-white text-red-500 hover:bg-red-50 hover:shadow-md"
            : "bg-white/90 text-gray-400 hover:bg-white hover:text-red-500 hover:shadow-md",
          isAnimating && "scale-110",
          className
        )}
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-all duration-300",
            isInWishlist ? "fill-red-500 stroke-red-500" : "stroke-current",
            isAnimating && (isInWishlist ? "scale-90" : "scale-110")
          )}
        />
      </button>
    );
  }

  return (
    <Button
      onClick={handleToggleWishlist}
      variant="outline"
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        isInWishlist
          ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
          : "border-gray-200 text-gray-700 hover:bg-gray-50",
        isAnimating && "scale-105",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 mr-2 transition-all duration-300",
          isInWishlist ? "fill-red-500 stroke-red-500" : "stroke-current",
          isAnimating && "scale-110"
        )}
      />
      {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    </Button>
  );
} 