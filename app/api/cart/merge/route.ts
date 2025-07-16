import { NextResponse } from 'next/server';
import { mergeGuestCart } from '@/lib/services/cart';

export async function POST(req: Request) {
  console.log('[API] /api/cart/merge called');
  try {
    const { items } = await req.json();
    console.log('[API] Payload items:', items);
    if (!Array.isArray(items)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    const merged = await mergeGuestCart(items);
    return NextResponse.json({ success: merged });
  } catch (err: any) {
    console.error('[API] /api/cart/merge error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 