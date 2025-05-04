import { getActiveHeroBanner } from '@/lib/services/content';
import { AdminHeroImageForm } from '@/components/admin/content/AdminHeroImageForm';
import { createServerActionClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, RefreshCw, ArrowRight } from 'lucide-react';
import { DeleteBannerForm } from '@/components/admin/content/HeroClientComponents';

// Add dynamic export
export const dynamic = 'force-dynamic';

// Helper function for authorization - runs on server
async function checkAdminAuth() {
    const supabase = await createServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: userProfile } = await supabase.from('User').select('role').eq('id', user.id).single();
    return userProfile?.role === 'ADMIN';
}

// --- Server Component Logic starts here ---
export default async function AdminHeroContentPage() {
    // --- Authorization ---
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        return (
            <div className="p-6 md:p-8">
                <Card className="max-w-md mx-auto border-red-100">
                    <CardHeader className="bg-red-50 border-b border-red-100">
                      <CardTitle className="text-red-700 font-heading flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Unauthorized Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-red-700">You do not have permission to access this admin page.</p>
                    </CardContent>
                    <CardFooter className="bg-red-50 border-t border-red-100 p-4">
                      <Button className="bg-zervia-500 hover:bg-zervia-600 text-white w-full" asChild>
                        <a href="/">
                          Return to Homepage <ArrowRight className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    // --- End Authorization ---

    // Fetch the *highest priority* active banner to manage initially
    const bannerToManage = await getActiveHeroBanner();

    return (
        <div className="p-6 md:p-8 space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
             <div>
               <h1 className="text-2xl md:text-3xl font-heading text-zervia-900 mb-1">Manage Hero Banners</h1>
               <p className="text-zervia-600">Update, control and create hero banners for your storefront.</p>
             </div>
             
             <div className="flex gap-3">
               <Button 
                 className="bg-white text-zervia-700 border border-zervia-200 hover:bg-zervia-50 hover:text-zervia-800 transition-all"
               >
                 <RefreshCw className="mr-2 h-4 w-4" /> Refresh
               </Button>
               <Button 
                 className="bg-zervia-500 hover:bg-zervia-600 text-white transition-all"
                 asChild
               >
                 <a href="/admin/content/hero/new">
                   <Plus className="mr-2 h-4 w-4" /> New Banner
                 </a>
               </Button>
             </div>
           </div>
            
            {bannerToManage ? (
              <div className="space-y-6">
                <div className="bg-zervia-50 border border-zervia-100 rounded-lg p-4 text-zervia-700">
                  <p className="flex items-center">
                    <ArrowRight className="h-4 w-4 mr-2 text-zervia-500" />
                    Currently managing: <span className="font-medium ml-1">"{bannerToManage.title}"</span>
                  </p>
                </div>
                
                <AdminHeroImageForm banner={bannerToManage} /> 
                <DeleteBannerForm bannerId={bannerToManage.id} />
              </div>
            ) : (
              <Card className="shadow-md border-zervia-100">
                <CardHeader className="bg-gradient-to-r from-zervia-50 to-zervia-100 border-b border-zervia-100">
                  <CardTitle className="text-zervia-800 font-heading">No Banners Found</CardTitle>
                  <CardDescription className="text-zervia-600">
                    Create your first hero banner to showcase on your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center p-8 bg-zervia-50 rounded-lg">
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-zervia-100">
                      <Plus className="h-8 w-8 text-zervia-600" />
                    </div>
                    <p className="text-lg text-zervia-700 font-medium mb-2">No Hero Banners Available</p>
                    <p className="text-zervia-500 text-center max-w-md mb-6">
                      Get started by creating your first hero banner to showcase on your website's homepage.
                    </p>
                    <Button 
                      className="bg-zervia-500 hover:bg-zervia-600 text-white transition-all"
                      asChild
                    >
                      <a href="/admin/content/hero/new">
                        <Plus className="mr-2 h-4 w-4" /> Create First Banner
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TODO: Add list of all banners (active and inactive) for management */}
        </div>
    );
} 