// Server Component

import { listCoupons, createCoupon, toggleCoupon, deleteCoupon } from "@/actions/admin-coupons";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Admin Coupons" };

// --------------------
// Server Actions (module scope)
// --------------------

export async function createCouponAction(formData: FormData) {
  "use server";
  const payload: Record<string, any> = Object.fromEntries(formData.entries());
  payload.discount_value = Number(payload.discount_value);
  payload.usage_limit = payload.usage_limit ? Number(payload.usage_limit) : null;
  payload.min_purchase_amount = payload.min_purchase_amount ? Number(payload.min_purchase_amount) : null;
  const res = await createCoupon(payload);
  if (res.success) {
    revalidatePath("/admin/coupons");
  }
  return res;
}

export async function toggleCouponAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";
  await toggleCoupon(id, !active);
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await deleteCoupon(id);
  revalidatePath("/admin/coupons");
}

// --------------------
export default async function AdminCouponsPage() {
  const { success, coupons, error } = await listCoupons();
  if (!success) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Coupons</h1>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Code</th>
            <th className="text-left p-2">Discount</th>
            <th className="text-left p-2">Usage</th>
            <th className="text-left p-2">Vendor</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Actions</th>
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
              <td className="p-2">{c.vendor_id ? c.vendor_id : "Global"}</td>
              <td className="p-2">{c.is_active ? "Active" : "Inactive"}</td>
              <td className="p-2 space-x-2">
                {/* Toggle */}
                <form action={toggleCouponAction as any} className="inline">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="active" value={String(c.is_active)} />
                  <button className="underline text-blue-600" type="submit">
                    {c.is_active ? "Disable" : "Enable"}
                  </button>
                </form>
                {/* Delete */}
                <form action={deleteCouponAction as any} className="inline ml-2">
                  <input type="hidden" name="id" value={c.id} />
                  <button className="underline text-red-600" type="submit">Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={createCouponAction as any} className="space-y-4 border p-4 rounded">
        <h2 className="text-lg font-medium">Create Coupon</h2>
        <div className="flex flex-wrap gap-4">
          <input type="text" name="code" placeholder="Code" required className="border p-2 flex-1" />
          <select name="discount_type" defaultValue="PERCENTAGE" className="border p-2">
            <option value="PERCENTAGE">% off</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
          </select>
          <input type="number" name="discount_value" step="0.01" placeholder="Value" required className="border p-2 w-32" />
        </div>
        <div className="flex flex-wrap gap-4">
          <input type="number" name="usage_limit" placeholder="Usage limit" className="border p-2 w-40" />
          <input type="number" name="min_purchase_amount" step="0.01" placeholder="Min purchase" className="border p-2 w-40" />
        </div>
        <button type="submit" className="bg-zervia-500 text-white px-6 py-2 rounded">
          Create Coupon
        </button>
      </form>
    </div>
  );
} 