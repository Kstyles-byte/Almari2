import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { RefundAnalyticsDashboard } from '@/components/admin/RefundAnalyticsDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Refund Analytics | Admin Dashboard',
  description: 'Comprehensive analytics and insights for refund management',
};

export default async function RefundAnalyticsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check for active session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userProfile, error: profileError } = await supabase
    .from('User')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profileError || !userProfile || userProfile.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <PageWrapper>
      <RefundAnalyticsDashboard />
    </PageWrapper>
  );
}