import { auth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProfileForm } from '@/components/customer/profile-form';
import { getUserProfile } from '@/actions/profile';

export const metadata = {
  title: 'My Profile | Zervia',
  description: 'Manage your account profile and preferences',
};

export default async function CustomerProfilePage() {
  const session = await auth();
  if (!session?.user) {
    return null; // Should be handled by layout, but just in case
  }
  
  // Fetch additional user profile data if needed
  const { profile, customerProfile } = await getUserProfile();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zervia-900">My Profile</h1>
      
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger 
            value="personal"
            className="data-[state=active]:bg-zervia-100 data-[state=active]:text-zervia-800"
          >
            Personal Information
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="data-[state=active]:bg-zervia-100 data-[state=active]:text-zervia-800"
          >
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm 
                user={session.user} 
                customerProfile={customerProfile}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Manage your password and account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-zervia-500">
                To change your password, please use the "Forgot Password" flow from the login page.
              </p>
              
              {/* Additional security options would go here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 