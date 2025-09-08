import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DollarSign, ArrowDownCircle, Filter, ChevronDown, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import PayoutRequestForm from '@/components/vendor/payout-request-form';

export const dynamic = 'force-dynamic';

export default async function VendorPayoutsPage() {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  // Fetch vendor ID, commission rate, and bank details
  const { data: vendorData, error: vendorError } = await supabase
    .from('Vendor')
    .select('id, commission_rate, bank_name, account_number, account_name')
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
    return <div>Error loading vendor data</div>;
  }

  // Use service-role key to bypass RLS for vendor's own data
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // We are only reading with the service role so cookie helpers can be no-ops
        get() { return undefined },
        set() {},
        remove() {},
      },
    }
  );

  // Fetch completed orders to calculate total earnings
  const { data: completedOrderItems, error: earningsError } = await supabaseAdmin
    .from('OrderItem')
    .select('price_at_purchase, quantity, commission_amount')
    .eq('vendor_id', vendorData.id)
    .eq('status', 'DELIVERED');

  if (earningsError) {
    console.error('Error fetching earnings data:', earningsError);
    return <div>Error fetching earnings data: {earningsError.message}</div>;
  }

  // Calculate total earnings and commissions
  let totalEarnings = 0;
  let totalCommission = 0;

  if (completedOrderItems) {
    completedOrderItems.forEach(item => {
      const itemTotal = item.price_at_purchase * item.quantity;
      totalEarnings += itemTotal;
      totalCommission += item.commission_amount || (itemTotal * 0.05); // Default 5% if not specified
    });
  }

  // Calculate net earnings
  const netEarnings = totalEarnings - totalCommission;

  // Fetch payout history
  const { data: payouts, error: payoutsError } = await supabase
    .from('Payout')
    .select('*')
    .eq('vendor_id', vendorData.id)
    .order('created_at', { ascending: false });

  if (payoutsError) {
    console.error('Error fetching payout history:', payoutsError);
  }

  // Calculate total paid out
  const totalPaidOut = payouts
    ? payouts
        .filter(payout => payout.status === 'COMPLETED')
        .reduce((sum, payout) => sum + payout.amount, 0)
    : 0;

  // Calculate available balance
  const availableBalance = netEarnings - totalPaidOut;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color and icon
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-4 h-4 mr-1" />
        };
      case 'PENDING':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="w-4 h-4 mr-1" />
        };
      case 'PROCESSING':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <Clock className="w-4 h-4 mr-1" />
        };
      case 'FAILED':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="w-4 h-4 mr-1" />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertTriangle className="w-4 h-4 mr-1" />
        };
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Earnings & Payouts</h1>
      
      {/* Commission Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Commission Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Your current commission rate is <span className="font-semibold">{vendorData.commission_rate || 5}%</span>. This is automatically deducted from your sales when calculating available balance.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3 rounded-lg text-white">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500">Total Earnings</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(totalEarnings)}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-500 p-3 rounded-lg text-white">
              <ArrowDownCircle size={20} />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500">Platform Commission</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(totalCommission)}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500 p-3 rounded-lg text-white">
              <ArrowDownCircle size={20} />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500">Total Paid Out</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(totalPaidOut)}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500 p-3 rounded-lg text-white">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500">Available Balance</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(availableBalance)}</div>
        </div>
      </div>
      
      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payout form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Request Payout</h2>
            </div>
            <div className="p-6">
              <PayoutRequestForm 
                availableBalance={availableBalance} 
                vendorData={{
                  bank_name: vendorData.bank_name,
                  account_number: vendorData.account_number,
                  account_name: vendorData.account_name
                }}
              />
            </div>
          </div>
          
          {/* Payout Information */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">How Payouts Work</h2>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-zervia-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-zervia-600">1</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Complete Orders</p>
                  <p>Earnings are added to your balance when orders are marked as delivered.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-zervia-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-zervia-600">2</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Request Payout</p>
                  <p>Submit a payout request with your bank details (minimum ₦5,000).</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-zervia-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-zervia-600">3</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Admin Review</p>
                  <p>Your request will be reviewed and processed within 1-2 business days.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-zervia-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-zervia-600">4</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Receive Payment</p>
                  <p>Funds will be transferred to your bank account upon approval.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payout history */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Payout History</h2>
              
              <div className="flex space-x-2">
                <button className="flex items-center px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50">
                  <Filter size={14} className="mr-1 text-gray-500" />
                  <span>Filter</span>
                  <ChevronDown size={14} className="ml-1 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts && payouts.length > 0 ? (
                    payouts.map((payout) => {
                      const { color, icon } = getStatusConfig(payout.status);
                      return (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payout.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${color}`}>
                              {icon}
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.reference || `REF-${payout.id.substring(0, 8)}`}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No payout records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {payouts && payouts.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="text-sm text-gray-700">
                  Showing {payouts.length} payout record(s)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 