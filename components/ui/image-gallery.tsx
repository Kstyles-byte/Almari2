"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Dialog, DialogContent, DialogTrigger } from "./dialog"

interface ImageGalleryProps {
  images: {
    id: string
    url: string
    alt: string
  }[]
  className?: string
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = React.useState(0)
  const [fullScreen, setFullScreen] = React.useState(false)
  
  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }
  
  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }
  
  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullScreen) {
        if (e.key === "ArrowRight") nextImage()
        if (e.key === "ArrowLeft") prevImage()
        if (e.key === "Escape") setFullScreen(false)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [fullScreen])
  
  // If no images provided, show placeholder
  if (!images.length) {
    return (
      <div 
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-md bg-muted/50 flex items-center justify-center",
          className
        )}
      >
        <p className="text-muted-foreground text-sm">No images available</p>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-md">
        <Image
          src={images[selectedImage].url}
          alt={images[selectedImage].alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={selectedImage === 0}
        />
        
        <div className="absolute inset-0 flex items-center justify-between p-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/80 text-foreground backdrop-blur-sm"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous image</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/80 text-foreground backdrop-blur-sm"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next image</span>
          </Button>
        </div>
        
        <Dialog open={fullScreen} onOpenChange={setFullScreen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 rounded-full bg-background/80 text-foreground backdrop-blur-sm"
            >
              <Expand className="h-4 w-4" />
              <span className="sr-only">View full screen</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] p-0 bg-transparent border-0">
            <div className="relative flex items-center justify-center min-h-[85vh]">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10 rounded-full bg-background/80 text-foreground backdrop-blur-sm"
                onClick={() => setFullScreen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 z-10 rounded-full bg-background/80 text-foreground backdrop-blur-sm"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous image</span>
              </Button>
              
              <div className="relative h-full w-full">
                <Image
                  src={images[selectedImage].url}
                  alt={images[selectedImage].alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 z-10 rounded-full bg-background/80 text-foreground backdrop-blur-sm"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next image</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={cn(
                "relative h-16 w-16 overflow-hidden rounded-md border-2",
                selectedImage === index
                  ? "border-primary"
                  : "border-transparent hover:border-muted"
              )}
              onClick={() => setSelectedImage(index)}
              aria-label={`View ${image.alt}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100px, 80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 