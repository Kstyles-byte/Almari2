import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Heart, MapPin, Clock, User, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { getUserOrders } from '@/actions/orders';
import { getUserAddresses } from '@/actions/profile';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard | My Account | Zervia',
  description: 'View your account dashboard and recent activity',
};

export default async function CustomerDashboardPage() {
  try {
    // Create Supabase client using SSR helper
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    // Check authentication directly via Supabase client
    const { data: { user } } = await supabase.auth.getUser();
  
    // If not authenticated, redirect to login
    if (!user) {
      console.log('CustomerDashboardPage: No user session, redirecting to login.');
      redirect('/login?callbackUrl=/customer/dashboard');
    }
    
    // Get user's name from User table if available
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('name')
      .eq('id', user.id)
      .single();
    
    // Determine the best name to display
    let displayName = 'Customer';
    if (userData?.name) {
      // Use name from User table if available
      displayName = userData.name;
    } else if (user.user_metadata?.name) {
      // Fallback to user_metadata name
      displayName = user.user_metadata.name;
    } else if (user.user_metadata?.full_name) {
      // Try full_name from metadata
      displayName = user.user_metadata.full_name;
    } else if (user.email) {
      // Use email but remove everything after @ as a last resort
      displayName = user.email.split('@')[0];
    }
    
    // Fetch user data
    const { orders = [] } = await getUserOrders();
    const { addresses = [] } = await getUserAddresses();
    
    // Calculate dashboard stats
    const pendingOrders = orders.filter(order => 
      ['pending', 'processing', 'shipped'].includes(order.status)
    ).length;
    
    const addressCount = addresses.length;
    
    // For now, we'll assume wishlist count is 0 since it's not implemented yet
    const wishlistCount = 0;
    
    const dashboardItems = [
      {
        title: 'Pending Orders',
        value: pendingOrders,
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        href: '/customer/orders?status=pending',
      },
      {
        title: 'Total Orders',
        value: orders.length,
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        href: '/customer/orders',
      },
      {
        title: 'Saved Addresses',
        value: addressCount,
        icon: MapPin,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        href: '/customer/addresses',
      },
      {
        title: 'Wishlist Items',
        value: wishlistCount,
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        href: '/customer/wishlist',
      },
    ];

    // Get the latest order
    const latestOrder = orders.length > 0 ? orders[0] : null;
    
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zervia-900">Welcome back, {displayName}</h1>
        
        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardItems.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-zervia-600">{item.title}</p>
                      <p className="text-2xl font-bold text-zervia-900 mt-1">{item.value}</p>
                    </div>
                    <div className={`${item.bgColor} p-3 rounded-full ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        {/* Recent Order */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Package className="h-5 w-5 mr-2 text-zervia-500" /> Recent Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestOrder ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Order #{latestOrder.orderNumber}</p>
                      <p className="text-xs text-zervia-500 mt-1">
                        {new Date(latestOrder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        latestOrder.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        latestOrder.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        latestOrder.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        latestOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {latestOrder.status.charAt(0).toUpperCase() + latestOrder.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 flex justify-between">
                    <div>
                      <p className="text-sm text-zervia-500">Total Amount</p>
                      <p className="text-lg font-semibold">₦{latestOrder.total.toLocaleString()}</p>
                    </div>
                    <Link 
                      href={`/customer/orders/${latestOrder.id}`}
                      className="text-sm text-zervia-600 hover:text-zervia-700 hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ShoppingBag className="h-12 w-12 mx-auto text-zervia-200 mb-3" />
                  <p className="text-zervia-500">You haven't placed any orders yet</p>
                  <Link 
                    href="/products"
                    className="text-sm text-zervia-600 hover:text-zervia-700 hover:underline block mt-2"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="h-5 w-5 mr-2 text-zervia-500" /> Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zervia-500">Name</p>
                  <p className="font-medium">{displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-zervia-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <p className="text-sm text-zervia-500">Need to update your information?</p>
                  <Link 
                    href="/customer/profile"
                    className="text-sm text-zervia-600 hover:text-zervia-700 hover:underline"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error in CustomerDashboardPage:', error);
    // Handle other unexpected errors - redirect to login with a message
    redirect('/login?callbackUrl=/customer/dashboard&message=An+error+occurred+loading+your+dashboard.');
  }
} 