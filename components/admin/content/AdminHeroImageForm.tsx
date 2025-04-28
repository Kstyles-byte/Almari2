'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateHeroImage, updateHeroContent } from '@/actions/content';
import { HeroBanner } from '@/types/content';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Save, Image as ImageIcon, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface AdminHeroImageFormProps {
  banner: HeroBanner | null;
}

function SubmitButton({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      disabled={pending} 
      aria-disabled={pending}
      className="bg-zervia-500 hover:bg-zervia-600 text-white transition-all"
    >
      {pending ? (
        <>
          <div className="h-4 w-4 animate-spin mr-2 border-2 border-zervia-200 border-t-white rounded-full" />
          Saving...
        </>
      ) : (
        <>
          {icon || <Save className="mr-2 h-4 w-4" />}
          {children}
        </>
      )}
    </Button>
  );
}

const formatDateForInput = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'yyyy-MM-dd');
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return '';
  }
};

export function AdminHeroImageForm({ banner }: AdminHeroImageFormProps) {
  const [imageState, imageFormAction] = useFormState(updateHeroImage, { success: false, message: '', error: null });
  const [contentState, contentFormAction] = useFormState(updateHeroContent, { success: false, message: '', error: null });

  useEffect(() => {
    if (imageState?.message) {
      if (imageState.success) {
        toast.success(`Image Update: ${imageState.message}`);
      } else {
        let errorMessage = `Image Update Error: ${imageState.message}`;
        if (imageState.error) {
          const errorDetails = Object.entries(imageState.error)
             .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
             .join('; ');
          errorMessage += ` Details: ${errorDetails}`;
        }
        toast.error(errorMessage);
      }
    }
  }, [imageState]);

  useEffect(() => {
    if (contentState?.message) {
      if (contentState.success) {
        toast.success(`Content Update: ${contentState.message}`);
      } else {
        let errorMessage = `Content Update Error: ${contentState.message}`;
        if (contentState.error) {
           const errorDetails = Object.entries(contentState.error)
             .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
             .join('; ');
          errorMessage += ` Details: ${errorDetails}`;
        }
        toast.error(errorMessage);
      }
    }
  }, [contentState]);

  if (!banner) {
    return (
      <Card className="shadow-sm border-zervia-100">
        <CardHeader>
          <CardTitle className="text-zervia-900 font-heading">Manage Hero Banner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 bg-zervia-50 rounded-lg">
            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-zervia-100">
              <ImageIcon className="h-8 w-8 text-zervia-600" />
            </div>
            <p className="text-lg text-zervia-700 font-medium mb-2">No Active Banner Found</p>
            <p className="text-zervia-500 text-center max-w-md">No active hero banner found to manage. Please create a new one.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-zervia-100 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-zervia-50 to-zervia-100 border-b border-zervia-100">
        <CardTitle className="text-zervia-800 font-heading">Manage Hero Banner</CardTitle>
        <CardDescription className="text-zervia-600">
          Update the content and image for the active hero banner: <span className="font-medium">"{banner.title}"</span>
        </CardDescription>
      </CardHeader>
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-0 bg-zervia-50">
          <TabsTrigger 
            value="content" 
            className="data-[state=active]:bg-white data-[state=active]:text-zervia-700 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-zervia-500 transition-all py-3"
          >
            <FileText className="h-4 w-4 mr-2" />
            Content & Settings
          </TabsTrigger>
          <TabsTrigger 
            value="image" 
            className="data-[state=active]:bg-white data-[state=active]:text-zervia-700 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-zervia-500 transition-all py-3"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Banner Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-0">
          <form action={contentFormAction}>
            <CardContent className="space-y-5 p-6">
              <input type="hidden" name="bannerId" value={banner.id} />
              
              <div className="space-y-1">
                <Label htmlFor="title" className="text-zervia-700 font-medium">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={banner.title} 
                  className="border-zervia-200 focus-visible:ring-zervia-300" 
                  required 
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="subtitle" className="text-zervia-700 font-medium">Subtitle</Label>
                <Textarea 
                  id="subtitle" 
                  name="subtitle" 
                  defaultValue={banner.subtitle || ''} 
                  rows={3} 
                  className="border-zervia-200 focus-visible:ring-zervia-300" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <Label htmlFor="buttonText" className="text-zervia-700 font-medium">Button Text</Label>
                  <Input 
                    id="buttonText" 
                    name="buttonText" 
                    defaultValue={banner.buttonText || ''} 
                    className="border-zervia-200 focus-visible:ring-zervia-300" 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="buttonLink" className="text-zervia-700 font-medium">Button Link</Label>
                  <Input 
                    id="buttonLink" 
                    name="buttonLink" 
                    defaultValue={banner.buttonLink || ''} 
                    placeholder="/products or https://..." 
                    className="border-zervia-200 focus-visible:ring-zervia-300" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6 border-t border-zervia-100">
                <div className="space-y-1">
                  <Label htmlFor="priority" className="text-zervia-700 font-medium">Priority</Label>
                  <Input 
                    id="priority" 
                    name="priority" 
                    type="number" 
                    defaultValue={banner.priority} 
                    required 
                    min="0" 
                    className="border-zervia-200 focus-visible:ring-zervia-300" 
                  />
                  <p className="text-sm text-zervia-500">Higher number means higher priority.</p>
                </div>
                
                <div className="flex items-center space-x-2 pt-8">
                  <Switch 
                    id="isActive" 
                    name="isActive" 
                    defaultChecked={banner.isActive} 
                    className="data-[state=checked]:bg-zervia-500" 
                  />
                  <Label htmlFor="isActive" className="text-zervia-700 font-medium">Active</Label>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-zervia-700 font-medium">Start Date (Optional)</Label>
                  <Input 
                    id="startDate" 
                    name="startDate" 
                    type="date" 
                    defaultValue={formatDateForInput(banner.startDate)} 
                    className="border-zervia-200 focus-visible:ring-zervia-300" 
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-zervia-700 font-medium">End Date (Optional)</Label>
                  <Input 
                    id="endDate" 
                    name="endDate" 
                    type="date" 
                    defaultValue={formatDateForInput(banner.endDate)} 
                    className="border-zervia-200 focus-visible:ring-zervia-300" 
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end p-6 pt-0">
              <SubmitButton>Update Content & Settings</SubmitButton>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="image" className="mt-0">
          <form action={imageFormAction}>
            <CardContent className="space-y-5 p-6">
              <input type="hidden" name="bannerId" value={banner.id} />
              <input type="hidden" name="currentPublicId" value={banner.imagePublicId || ''} />
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="imageFile" className="text-zervia-700 font-medium">New Hero Image</Label>
                  <Input 
                    id="imageFile" 
                    name="imageFile" 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp, image/gif" 
                    required 
                    className="border-zervia-200 focus-visible:ring-zervia-300" 
                  />
                  <p className="text-sm text-zervia-500 mt-1">
                    Max 5MB. Formats: JPG, PNG, WEBP, GIF.
                  </p>
                </div>
                
                {banner.imageUrl && (
                  <div className="space-y-3 mt-6">
                    <Label className="text-zervia-700 font-medium">Current Image</Label>
                    <div className="relative overflow-hidden rounded-lg border border-zervia-200">
                      <Image
                        src={banner.imageUrl}
                        alt={`Current hero image for ${banner.title}`}
                        width={800} 
                        height={400}
                        className="w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zervia-900/30 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end p-6 pt-0">
              <SubmitButton icon={<ImageIcon className="mr-2 h-4 w-4" />}>
                Update Image
              </SubmitButton>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 