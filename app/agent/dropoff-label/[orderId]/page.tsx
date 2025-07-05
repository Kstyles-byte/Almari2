'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';

interface OrderPayload {
  id: string;
  dropoff_code?: string;
  pickup_code?: string;
  customer?: {
    user?: { name?: string };
    phone?: string;
  };
  // You may adapt field names if your supabase schema differs
}

export default function DropoffLabelPage() {
  const { orderId } = useParams() as { orderId: string };
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Fetch order once
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setOrder(json as OrderPayload);
      }
    })();
  }, [orderId]);

  // Build QR once we have pickup code
  useEffect(() => {
    if (order?.pickup_code) {
      QRCode.toDataURL(order.pickup_code, { margin: 0, scale: 6 }).then(setQrDataUrl);
    }
  }, [order?.pickup_code]);

  // Auto-print once everything ready
  useEffect(() => {
    if (order && qrDataUrl) {
      setTimeout(() => {
        window.print();
      }, 200);
    }
  }, [order, qrDataUrl]);

  if (!order) return null; // could render skeleton

  const maskedPhone = order.customer?.phone
    ? order.customer.phone.replace(/(\d{3})\d+(\d{3})/, '$1*****$2')
    : '';

  return (
    <div id="printable-label" style={{ width: '58mm', fontFamily: 'monospace', padding: 4 }}>
      <style>{`
        @page { size: 58mm auto; margin: 0; }
        body { margin: 0; }
        @media print {
          body * { visibility: hidden; }
          #printable-label, #printable-label * { visibility: visible; }
          #printable-label { position: absolute; left: 0; top: 0; }
        }
        h1 { font-size: 20px; text-align: center; margin: 4px 0; }
        .big { font-size: 26px; font-weight: 700; text-align: center; margin: 6px 0; }
        .code { font-size: 18px; text-align: center; margin: 6px 0; }
        hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
        small { font-size: 10px; text-align: center; display: block; }
      `}</style>

      <h1>AGENT DROP-OFF</h1>
      <div className="big">ORDER {order.id.slice(0, 8)}</div>
      <hr />
      <div>CUSTOMER: {order.customer?.user?.name ?? ''} {maskedPhone}</div>
      <hr />
      <div className="code">PICK-UP CODE: {order.pickup_code}</div>
      {qrDataUrl && (
        <div style={{ textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} style={{ width: 160, height: 160 }} alt="QR" />
        </div>
      )}
      <hr />
      <small>Printed {new Date().toLocaleString()}</small>
    </div>
  );
} 