import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import prisma from "../../../lib/server/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { UpdateStoreDetails } from "../../../actions/vendor-settings";

export default async function StoreSettings() {
  const session = await auth();

  if (!session || session.user.role !== "VENDOR") {
    redirect("/");
  }

  const vendor = await prisma.vendor.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
    },
  });

  if (!vendor) {
    redirect("/");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Store Settings</h1>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Store Profile</TabsTrigger>
          <TabsTrigger value="appearance">Store Appearance</TabsTrigger>
          <TabsTrigger value="policies">Store Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your store's basic information</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={UpdateStoreDetails}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input 
                      id="storeName" 
                      name="storeName" 
                      defaultValue={vendor.storeName || ""} 
                      placeholder="Your Store Name"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="storeDescription">Store Description</Label>
                    <Textarea 
                      id="storeDescription" 
                      name="storeDescription" 
                      defaultValue={vendor.storeDescription || ""} 
                      placeholder="Describe your store and what you sell"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input 
                      id="contactEmail" 
                      name="contactEmail" 
                      type="email" 
                      defaultValue={vendor.contactEmail || vendor.user.email || ""} 
                      placeholder="contact@example.com"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input 
                      id="contactPhone" 
                      name="contactPhone" 
                      defaultValue={vendor.contactPhone || ""} 
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="storeTagline">Store Tagline</Label>
                    <Input 
                      id="storeTagline" 
                      name="storeTagline" 
                      defaultValue={vendor.storeTagline || ""} 
                      placeholder="A short catchy phrase for your store"
                    />
                  </div>
                  
                  <input type="hidden" name="vendorId" value={vendor.id} />
                  
                  <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your store with your social media accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={UpdateStoreDetails}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="instagramHandle">Instagram</Label>
                    <Input 
                      id="instagramHandle" 
                      name="instagramHandle" 
                      defaultValue={vendor.instagramHandle || ""} 
                      placeholder="@yourhandle"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="twitterHandle">Twitter</Label>
                    <Input 
                      id="twitterHandle" 
                      name="twitterHandle" 
                      defaultValue={vendor.twitterHandle || ""} 
                      placeholder="@yourhandle"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="facebookUrl">Facebook</Label>
                    <Input 
                      id="facebookUrl" 
                      name="facebookUrl" 
                      defaultValue={vendor.facebookUrl || ""} 
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="websiteUrl">External Website</Label>
                    <Input 
                      id="websiteUrl" 
                      name="websiteUrl" 
                      defaultValue={vendor.websiteUrl || ""} 
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  
                  <input type="hidden" name="vendorId" value={vendor.id} />
                  <input type="hidden" name="section" value="social" />
                  
                  <Button type="submit" className="w-full sm:w-auto">Save Social Links</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Banner</CardTitle>
              <CardDescription>Customize your store's banner image</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={UpdateStoreDetails}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bannerImage">Banner Image URL</Label>
                    <Input 
                      id="bannerImage" 
                      name="bannerImage" 
                      defaultValue={vendor.bannerImage || ""} 
                      placeholder="https://example.com/your-banner.jpg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended size: 1200 x 300 pixels
                    </p>
                  </div>
                  
                  {vendor.bannerImage && (
                    <div className="relative aspect-[4/1] overflow-hidden rounded-lg border">
                      <img 
                        src={vendor.bannerImage} 
                        alt="Store Banner" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="logoImage">Logo Image URL</Label>
                    <Input 
                      id="logoImage" 
                      name="logoImage" 
                      defaultValue={vendor.logoImage || ""} 
                      placeholder="https://example.com/your-logo.jpg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended size: 300 x 300 pixels, square format
                    </p>
                  </div>
                  
                  {vendor.logoImage && (
                    <div className="relative w-24 h-24 overflow-hidden rounded-lg border">
                      <img 
                        src={vendor.logoImage} 
                        alt="Store Logo" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="accentColor">Store Accent Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="accentColor" 
                        name="accentColor" 
                        type="color"
                        defaultValue={vendor.accentColor || "#3b82f6"} 
                        className="w-12 h-10 p-1"
                      />
                      <Input 
                        id="accentColorHex" 
                        defaultValue={vendor.accentColor || "#3b82f6"} 
                        className="flex-1"
                        readOnly
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This color will be used as an accent throughout your store
                    </p>
                  </div>
                  
                  <input type="hidden" name="vendorId" value={vendor.id} />
                  <input type="hidden" name="section" value="appearance" />
                  
                  <Button type="submit" className="w-full sm:w-auto">Save Appearance</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Policies</CardTitle>
              <CardDescription>Define your store's policies for customers</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={UpdateStoreDetails}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="returnPolicy">Return Policy</Label>
                    <Textarea 
                      id="returnPolicy" 
                      name="returnPolicy" 
                      defaultValue={vendor.returnPolicy || ""} 
                      placeholder="Describe your return and refund policy"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="shippingPolicy">Shipping Policy</Label>
                    <Textarea 
                      id="shippingPolicy" 
                      name="shippingPolicy" 
                      defaultValue={vendor.shippingPolicy || ""} 
                      placeholder="Describe your shipping and delivery policy"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                    <Textarea 
                      id="privacyPolicy" 
                      name="privacyPolicy" 
                      defaultValue={vendor.privacyPolicy || ""} 
                      placeholder="Describe how you handle customer data"
                      rows={4}
                    />
                  </div>
                  
                  <input type="hidden" name="vendorId" value={vendor.id} />
                  <input type="hidden" name="section" value="policies" />
                  
                  <Button type="submit" className="w-full sm:w-auto">Save Policies</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 