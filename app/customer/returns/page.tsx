import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { format } from "date-fns";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";

import { getCustomerReturnsAction } from "@/actions/returns";
import CustomerReturnsHistory from "@/components/customer/customer-returns-history";
import EmptyState from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your Returns | Zervia",
  description: "View and manage your return requests",
};

export default async function CustomerReturnsPage() {
  // Create the Supabase server client
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
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Get session to ensure user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // If no session, redirect to login
    return redirect("/auth/signin?returnTo=/customer/returns");
  }

  // Now that we know the user is authenticated, get returns data
  const result = await getCustomerReturnsAction({ page: 1, limit: 10 });

  // Format the returns data for display
  const formattedReturns = result && 'success' in result && result.success && 'data' in result && result.data ? 
    result.data.map((returnItem: any) => ({
      id: returnItem.id,
      orderId: returnItem.orderId || returnItem.order_id,
      orderDate: returnItem.order ? format(new Date(returnItem.order.createdAt || returnItem.order.created_at), 'MMM d, yyyy') : 'N/A',
      productName: returnItem.product?.name || 'Product unavailable',
      productImage: returnItem.product?.ProductImage?.length > 0 
        ? returnItem.product.ProductImage[0].url 
        : (returnItem.product?.images?.length > 0 ? returnItem.product.images[0].url : '/placeholder-product.png'),
      status: returnItem.status,
      requestDate: format(new Date(returnItem.requestDate || returnItem.request_date || returnItem.createdAt || returnItem.created_at), 'MMM d, yyyy'),
      refundAmount: formatCurrency(returnItem.refundAmount || returnItem.refund_amount || 0),
      refundStatus: returnItem.refundStatus || returnItem.refund_status,
      reason: returnItem.reason,
      processDate: returnItem.processDate || returnItem.process_date
        ? format(new Date(returnItem.processDate || returnItem.process_date), 'MMM d, yyyy') 
        : undefined,
    })) : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center text-sm text-muted-foreground mb-4">
        <Link href="/customer/dashboard" className="hover:text-zervia-600">Dashboard</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground">Returns</span>
      </nav>
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Returns</h1>
        <p className="text-muted-foreground">View and manage your return requests</p>
      </div>

      {result && 'error' in result ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {result.error || "An error occurred while fetching your returns"}
        </div>
      ) : formattedReturns.length === 0 ? (
        <EmptyState 
          title="No returns yet" 
          description="You haven't made any return requests yet."
          icon="package-x"
          action={{
            href: "/products",
            label: "Browse Products"
          } as unknown as React.ReactNode}
        />
      ) : (
        <CustomerReturnsHistory returns={formattedReturns} />
      )}
    </div>
  );
} 