import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { redirect, notFound } from 'next/navigation';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  ShoppingCart, 
  Heart,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  Calendar
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CustomerDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const { id } = await params;
  
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

  // Fetch customer details
  const { data: customer, error: customerError } = await supabase
    .from('Customer')
    .select(`
      *,
      user:User(
        id,
        name,
        email,
        role,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (customerError || !customer) {
    notFound();
  }

  // Fetch customer's addresses
  const { data: addresses } = await supabase
    .from('Address')
    .select('*')
    .eq('customer_id', id)
    .order('is_default', { ascending: false });

  // Fetch customer's orders (recent 10)
  const { data: orders } = await supabase
    .from('Order')
    .select(`
      id,
      status,
      payment_status,
      total_amount,
      created_at,
      short_id,
      order_items:OrderItem(
        id,
        quantity,
        product:Product(name)
      )
    `)
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch customer's reviews
  const { data: reviews } = await supabase
    .from('Review')
    .select(`
      id,
      rating,
      comment,
      created_at,
      product:Product(
        id,
        name,
        slug
      )
    `)
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get order statistics
  const { data: orderStats } = await supabase
    .from('Order')
    .select('status, total_amount')
    .eq('customer_id', id);

  const totalOrders = orderStats?.length || 0;
  const totalSpent = orderStats?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
  const completedOrders = orderStats?.filter(order => order.status === 'DELIVERED').length || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'PROCESSING':
        return 'default';
      case 'SHIPPED':
        return 'outline';
      case 'DELIVERED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      case 'READY_FOR_PICKUP':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'COMPLETED':
        return 'default';
      case 'FAILED':
        return 'destructive';
      case 'REFUNDED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>
              <p className="text-muted-foreground">
                {customer.user?.name || 'Customer Profile'}
              </p>
            </div>
          </div>
          <Badge variant="outline">
            {customer.user?.role}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Badge className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{completedOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Recent Orders
                  </span>
                  <Link href={`/admin/orders?customer=${id}`}>
                    <Button variant="outline" size="sm">
                      View All Orders
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">#{order.short_id || order.id.slice(0, 8)}</p>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge variant={getPaymentStatusBadge(order.payment_status)}>
                              {order.payment_status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.order_items?.length || 0} item(s) • {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(Number(order.total_amount))}</p>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="outline" size="sm" className="mt-1">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No orders found for this customer.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Recent Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{review.product?.name}</p>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {review.comment}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{customer.user?.email}</p>
                    </div>
                  </div>
                  
                  {customer.phone_number && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{customer.phone_number}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Customer Since</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(customer.user?.created_at || customer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Customer ID</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {customer.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            {addresses && addresses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Addresses ({addresses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.map((address: any) => (
                    <div key={address.id} className="p-3 border rounded-lg">
                      {address.is_default && (
                        <Badge variant="outline" className="mb-2">
                          Default
                        </Badge>
                      )}
                      <div className="text-sm space-y-1">
                        <p className="font-medium">{address.address_line1}</p>
                        {address.address_line2 && <p>{address.address_line2}</p>}
                        <p className="text-muted-foreground">
                          {address.city}, {address.state_province} {address.postal_code}
                        </p>
                        <p className="text-muted-foreground">{address.country}</p>
                        {address.phone_number && (
                          <p className="text-muted-foreground">
                            Phone: {address.phone_number}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/admin/orders?customer=${id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View All Orders
                  </Button>
                </Link>
                <Link href={`/admin/refunds?customer=${id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Refund Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
