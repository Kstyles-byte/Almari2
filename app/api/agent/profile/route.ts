import { NextRequest, NextResponse } from 'next/server';
import { createServerActionClient } from '@/lib/supabase/server';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createServerActionClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: agentRec, error: agentErr } = await supabase
      .from('Agent')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentErr || !agentRec) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const { error: updErr } = await supabase
      .from('Agent')
      .update(body)
      .eq('id', agentRec.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 