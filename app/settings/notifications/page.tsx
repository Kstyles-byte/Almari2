import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import NotificationPreferences from '@/components/settings/notification-preferences';
import { Database } from '@/types/supabase';

// Add dynamic export configuration
export const dynamic = 'force-dynamic';

async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

async function getUserPreferences(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('NotificationPreference')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching preferences:', error);
    return [];
  }
  
  return data || [];
}

async function getUserRole(userId: string) {
  // Use service role to get user role from User table
  const cookieStore = await cookies();
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
  
  const { data, error } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user role:', error);
    return 'CUSTOMER';
  }
  
  return data?.role || 'CUSTOMER';
}

export default async function NotificationSettingsPage() {
  const supabase = await createSupabaseServerClient();
  
  // Get user session using Supabase SSR client
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login?message=Please+log+in+to+access+notification+settings');
  }
  
  // Get user preferences and role
  const [preferences, userRole] = await Promise.all([
    getUserPreferences(user.id),
    getUserRole(user.id)
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your notification preferences and control how you receive updates.
          </p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg">
          <NotificationPreferences 
            initialPreferences={preferences}
            userRole={userRole as Database['public']['Enums']['UserRole']}
            userId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
