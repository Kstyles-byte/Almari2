import { listVendorCoupons, createVendorCoupon } from "@/actions/vendor-coupons";
import { createSupabaseServerActionClient } from "@/lib/supabase/action";
import { revalidatePath } from "next/cache";

export const metadata = { title: "My Coupons" };

export async function createVendorCouponAction(formData: FormData) {
  "use server";
  const payload: Record<string, any> = Object.fromEntries(formData.entries());
  payload.discount_value = Number(payload.discount_value);
  payload.usage_limit = payload.usage_limit ? Number(payload.usage_limit) : null;
  payload.min_purchase_amount = payload.min_purchase_amount ? Number(payload.min_purchase_amount) : null;
  payload.product_id = payload.product_id ? payload.product_id : null;
  await createVendorCoupon(payload);
  revalidatePath("/vendor/coupons");
}

export default async function VendorCouponsPage() {
  const { success, coupons, error } = await listVendorCoupons();
  if (!success) return <div className="p-6 text-red-600">Error: {error}</div>;

  // Fetch vendor products for the dropdown
  const supabase = await createSupabaseServerActionClient(false);
  const { data: { user } } = await supabase.auth.getUser();
  let products: { id: string; name: string }[] = [];
  if (user) {
    const { data: vendorRow } = await supabase
      .from('Vendor')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (vendorRow?.id) {
      const { data: productRows } = await supabase
        .from('Product')
        .select('id, name')
        .eq('vendor_id', vendorRow.id);
      products = productRows ?? [];
    }
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">My Coupons</h1>

      {/* Coupon List */}
      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Code</th>
            <th className="text-left p-2">Discount</th>
            <th className="text-left p-2">Usage</th>
            <th className="text-left p-2">Product</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {coupons?.map((c: any) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.code}</td>
              <td className="p-2">
                {c.discount_type === "PERCENTAGE" ? `${c.discount_value}%` : `₦${c.discount_value}`}
              </td>
              <td className="p-2">
                {c.usage_count}/{c.usage_limit ?? "∞"}
              </td>
              <td className="p-2">{c.product ? c.product.name : "All Products"}</td>
              <td className="p-2">{c.is_active ? "Active" : "Inactive"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Create Coupon Form */}
      <form action={createVendorCouponAction as any} className="space-y-4 border p-4 rounded">
        <h2 className="text-lg font-medium">Create New Coupon</h2>
        <div className="flex flex-wrap gap-4">
          <input type="text" name="code" placeholder="Code" required className="border p-2 flex-1" />
          <select name="discount_type" defaultValue="PERCENTAGE" className="border p-2">
            <option value="PERCENTAGE">% off</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
          </select>
          <input
            type="number"
            name="discount_value"
            step="0.01"
            placeholder="Value"
            required
            className="border p-2 w-32"
          />
        </div>
        {/* Product selector */}
        <div className="flex flex-wrap gap-4">
          <select name="product_id" className="border p-2">
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-4">
          <input type="number" name="usage_limit" placeholder="Usage limit" className="border p-2 w-40" />
          <input
            type="number"
            name="min_purchase_amount"
            step="0.01"
            placeholder="Min purchase"
            className="border p-2 w-40"
          />
        </div>
        <button type="submit" className="bg-zervia-500 text-white px-6 py-2 rounded">
          Create Coupon
        </button>
      </form>
    </div>
  );
} 