import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = supabaseAdmin;

  const groupId = params.id;
  if (!groupId) {
    return NextResponse.json({ error: 'Missing group id' }, { status: 400 });
  }

  const { data: orders, error } = await supabase
    .from('Order')
    .select('*')
    .eq('order_group_id', groupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders });
} 