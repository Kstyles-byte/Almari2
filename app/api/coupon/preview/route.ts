import { NextRequest, NextResponse } from 'next/server';
import { validateCouponForCart, getCouponByCode } from '@/lib/services/coupon';

// POST { code: string, cartSubtotal?: number }
export async function POST(req: NextRequest) {
  try {
    const { code, cartSubtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    // If we have a positive subtotal, calculate the *actual* discount amount
    if (typeof cartSubtotal === 'number' && cartSubtotal >= 0) {
      const result = await validateCouponForCart(code, cartSubtotal);
      if (!result.valid) {
        return NextResponse.json({ valid: false });
      }
      return NextResponse.json({ valid: true, discount: result.discount ?? 0 });
    }

    // Fallback – when subtotal is unknown just return the raw discount_value
    const coupon = await getCouponByCode(code);
    if (!coupon || !coupon.is_active) {
      return NextResponse.json({ valid: false });
    }
    return NextResponse.json({ valid: true, discount: Number(coupon.discount_value) });
  } catch (err) {
    console.error('[coupon/preview] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 