"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Upload } from "lucide-react";

// Define the HeroBanner type
interface HeroBanner {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  priority: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

// Define the action function (to be created in /actions/content.ts)
const createHeroBanner = async (data: HeroBanner): Promise<void> => {
  // This is a placeholder function until the actual API call is implemented
  const response = await fetch('/api/hero-banners', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create hero banner');
  }
};

export default function HeroBannerForm() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonText, setButtonText] = useState("Shop Now");
  const [buttonLink, setButtonLink] = useState("/products");
  const [priority, setPriority] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("upload_preset", "zerviaupload");
      
      const response = await fetch("https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      const data = await response.json();
      setImageUrl(data.secure_url);
      
      toast({
        title: "Image uploaded successfully",
        description: "Your hero banner image has been uploaded to Cloudinary.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl) {
      toast({
        title: "Image required",
        description: "Please upload an image for the hero banner.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Format dates for the database
      const formattedStartDate = startDate ? startDate.toISOString() : null;
      const formattedEndDate = endDate ? endDate.toISOString() : null;
      
      await createHeroBanner({
        imageUrl,
        title,
        subtitle,
        buttonText,
        buttonLink,
        priority,
        isActive,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });
      
      toast({
        title: "Hero banner created",
        description: "The hero banner has been created successfully.",
      });
      
      router.push("/admin/content/hero-banners");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to create hero banner",
        description: "There was an error creating the hero banner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Banner Image</Label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 h-64 relative">
            {imageUrl ? (
              <div className="relative w-full h-full">
                <Image 
                  src={imageUrl}
                  alt="Hero banner preview"
                  fill
                  className="object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => setImageUrl("")}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-500">Drag and drop an image or click to upload</p>
                <p className="text-xs text-gray-400">Recommended size: 1600 x 600 pixels</p>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("image")?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Select Image"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter banner title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Enter banner subtitle"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="buttonText">Button Text</Label>
            <Input
              id="buttonText"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Enter button text"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buttonLink">Button Link</Label>
            <Input
              id="buttonLink"
              value={buttonLink}
              onChange={(e) => setButtonLink(e.target.value)}
              placeholder="Enter button link URL"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Display Priority</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              placeholder="Enter display priority"
            />
            <p className="text-xs text-gray-500">Lower numbers display first</p>
          </div>

          <div className="space-y-2 flex items-center pt-8">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive" className="ml-2">Active</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date: Date) => 
                    (startDate ? date < startDate : false) || 
                    date < new Date()
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/content/hero-banners")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading ? "Creating..." : "Create Hero Banner"}
        </Button>
      </div>
    </form>
  );
} 