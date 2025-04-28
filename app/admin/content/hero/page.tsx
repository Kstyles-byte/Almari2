import { getActiveHeroBanner } from '@/lib/services/content';
import { AdminHeroImageForm } from '@/components/admin/content/AdminHeroImageForm';
import { createClient } from '@/lib/supabase/server'; // Assuming path is correct
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // For error display

// Helper function for authorization (replace with your actual logic)
async function checkAdminAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: userProfile } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    return userProfile?.role === 'ADMIN';
}


export default async function AdminHeroContentPage() {
    // --- Authorization ---
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        // Redirect non-admins or show an unauthorized message
        // redirect('/login'); // Or your login page
        // For now, just show an error message on the page
         return (
            <div className="p-4 md:p-6">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-red-600">Unauthorized</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You do not have permission to access this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    // --- End Authorization ---

    const activeBanner = await getActiveHeroBanner();

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Manage Hero Banner Content</h1>
            
            {/* Use the AdminHeroImageForm component */}
            <AdminHeroImageForm banner={activeBanner} />

            {/* TODO: Add components/forms here later for creating new banners or managing inactive ones */}
        </div>
    );
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'Admin: Hero Content',
}; 