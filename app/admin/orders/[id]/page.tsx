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
  Package, 
  MapPin, 
  CreditCard, 
  User, 
  Clock,
  ShoppingCart,
  ExternalLink
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
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

  // Fetch order details
  const { data: order, error: orderError } = await supabase
    .from('Order')
    .select(`
      *,
      customer:Customer(
        id,
        phone_number,
        user:User(
          id,
          name,
          email
        )
      ),
      agent:Agent(
        id,
        name,
        email,
        phone_number
      ),
      shipping_address:Address!shipping_address_id(
        address_line1,
        address_line2,
        city,
        state_province,
        postal_code,
        country,
        phone_number
      ),
      billing_address:Address!billing_address_id(
        address_line1,
        address_line2,
        city,
        state_province,
        postal_code,
        country,
        phone_number
      ),
      coupon:Coupon(
        id,
        code,
        discount_type,
        discount_value
      ),
      order_items:OrderItem(
        id,
        quantity,
        price_at_purchase,
        status,
        commission_amount,
        commission_rate,
        product:Product(
          id,
          name,
          slug,
          description,
          price
        ),
        vendor:Vendor(
          id,
          store_name,
          user:User(name, email)
        )
      )
    `)
    .eq('id', id)
    .single();

  if (orderError || !order) {
    notFound();
  }

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
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
              <p className="text-muted-foreground">
                Order #{order.short_id || order.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status}
            </Badge>
            <Badge variant={getPaymentStatusBadge(order.payment_status)}>
              {order.payment_status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Items ({order.order_items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Vendor: {item.vendor?.store_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      <Badge variant={getStatusBadgeVariant(item.status)} className="mt-2">
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(Number(item.price_at_purchase))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatCurrency(Number(item.price_at_purchase) * item.quantity)}
                      </p>
                      {item.commission_amount && (
                        <p className="text-xs text-muted-foreground">
                          Commission: {formatCurrency(Number(item.commission_amount))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">
                      {order.payment_method || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Reference</p>
                    <p className="text-sm text-muted-foreground">
                      {order.payment_reference || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm">{formatCurrency(Number(order.subtotal))}</span>
                  </div>
                  {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Discount</span>
                      <span className="text-sm">-{formatCurrency(Number(order.discount_amount))}</span>
                    </div>
                  )}
                  {Number(order.tax_amount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Tax</span>
                      <span className="text-sm">{formatCurrency(Number(order.tax_amount))}</span>
                    </div>
                  )}
                  {Number(order.shipping_amount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Shipping</span>
                      <span className="text-sm">{formatCurrency(Number(order.shipping_amount))}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(Number(order.total_amount))}</span>
                  </div>
                </div>

                {order.coupon && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Coupon Applied: {order.coupon.code}
                    </p>
                    <p className="text-sm text-green-600">
                      {order.coupon.discount_type === 'PERCENTAGE' 
                        ? `${order.coupon.discount_value}% off` 
                        : `${formatCurrency(Number(order.coupon.discount_value))} off`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Order Placed</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {order.actual_pickup_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">Picked Up</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.actual_pickup_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {order.estimated_pickup_date && !order.actual_pickup_date && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">Estimated Pickup</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.estimated_pickup_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {(order.pickup_code || order.dropoff_code) && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    {order.pickup_code && (
                      <p className="text-sm">
                        <span className="font-medium">Pickup Code:</span> {order.pickup_code}
                      </p>
                    )}
                    {order.dropoff_code && (
                      <p className="text-sm">
                        <span className="font-medium">Dropoff Code:</span> {order.dropoff_code}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{order.customer?.user?.name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer?.user?.email}</p>
                  {order.customer?.phone_number && (
                    <p className="text-sm text-muted-foreground">WhatsApp: {order.customer.phone_number}</p>
                  )}
                </div>
                <Link href={`/admin/customers/${order.customer?.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Customer Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Agent Information */}
            {order.agent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Assigned Agent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{order.agent.name}</p>
                    <p className="text-sm text-muted-foreground">{order.agent.email}</p>
                    {order.agent.phone_number && (
                      <p className="text-sm text-muted-foreground">{order.agent.phone_number}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Address */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p>{order.shipping_address.address_line1}</p>
                    {order.shipping_address.address_line2 && (
                      <p>{order.shipping_address.address_line2}</p>
                    )}
                    <p>
                      {order.shipping_address.city}, {order.shipping_address.state_province} {order.shipping_address.postal_code}
                    </p>
                    <p>{order.shipping_address.country}</p>
                    {order.shipping_address.phone_number && (
                      <p className="mt-2 font-medium">Phone: {order.shipping_address.phone_number}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Address */}
            {order.billing_address && order.billing_address.id !== order.shipping_address?.id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p>{order.billing_address.address_line1}</p>
                    {order.billing_address.address_line2 && (
                      <p>{order.billing_address.address_line2}</p>
                    )}
                    <p>
                      {order.billing_address.city}, {order.billing_address.state_province} {order.billing_address.postal_code}
                    </p>
                    <p>{order.billing_address.country}</p>
                    {order.billing_address.phone_number && (
                      <p className="mt-2 font-medium">Phone: {order.billing_address.phone_number}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
