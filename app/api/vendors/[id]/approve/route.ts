import { NextRequest, NextResponse } from 'next/server';
import { approveVendor } from '@/actions/admin-vendors';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id;
    
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const result = await approveVendor(vendorId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to approve vendor' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving vendor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
