'use client';

import { useEffect, useState } from 'react';
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

interface AdminHeroImageFormProps {
  banner: HeroBanner | null;
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? 'Saving...' : children}
    </Button>
  );
}

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
      <Card>
        <CardHeader><CardTitle>Manage Hero Banner</CardTitle></CardHeader>
        <CardContent><p>No active hero banner found to manage.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Hero Banner</CardTitle>
        <CardDescription>Update the content and image for the active hero banner: "{banner.title}".</CardDescription>
      </CardHeader>
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Text Content</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <form action={contentFormAction}>
            <CardContent className="space-y-4 pt-6">
              <input type="hidden" name="bannerId" value={banner.id} />
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={banner.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Textarea id="subtitle" name="subtitle" defaultValue={banner.subtitle || ''} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="buttonText">Button Text</Label>
                   <Input id="buttonText" name="buttonText" defaultValue={banner.buttonText || ''} />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="buttonLink">Button Link</Label>
                   <Input id="buttonLink" name="buttonLink" defaultValue={banner.buttonLink || ''} placeholder="/products or https://..." />
                 </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <SubmitButton>Update Content</SubmitButton>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="image">
          <form action={imageFormAction}>
            <CardContent className="space-y-4 pt-6">
              <input type="hidden" name="bannerId" value={banner.id} />
              <input type="hidden" name="currentPublicId" value={banner.imagePublicId || ''} />
              <div className="space-y-2">
                <Label htmlFor="imageFile">New Hero Image</Label>
                <Input id="imageFile" name="imageFile" type="file" accept="image/png, image/jpeg, image/webp, image/gif" required />
                <p className="text-sm text-muted-foreground">
                  Max 5MB. Formats: JPG, PNG, WEBP, GIF.
                </p>
              </div>
              {banner.imageUrl && (
                <div className="space-y-2">
                  <Label>Current Image</Label>
                  <Image
                    src={banner.imageUrl}
                    alt={`Current hero image for ${banner.title}`}
                    width={300} 
                    height={150}
                    className="rounded-md border object-cover"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
               <SubmitButton>Update Image</SubmitButton>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 