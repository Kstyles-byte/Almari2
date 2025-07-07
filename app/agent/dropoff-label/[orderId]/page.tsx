'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Printer, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { generateDropoffLabel, LabelData, toESCPOS } from '@/lib/utils/thermal-printer';

interface OrderPayload {
  id: string;
  dropoff_code?: string;
  pickup_code?: string;
  customer?: {
    user?: { name?: string };
    phone?: string;
  };
  agent?: {
    location?: string;
  };
}

export default function DropoffLabelPage() {
  const { orderId } = useParams() as { orderId: string };
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [labelText, setLabelText] = useState<string>('');
  const [printMethod, setPrintMethod] = useState<'browser' | 'mobile'>('mobile');
  const [hasBluetoothChar, setHasBluetoothChar] = useState(false);

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

  // Generate label text for thermal printer
  useEffect(() => {
    if (order) {
      const labelData: LabelData = {
        type: 'dropoff',
        orderId: order.id,
        location: order.agent?.location,
        dropoffCode: order.dropoff_code,
        pickupCode: order.pickup_code,
        customerName: order.customer?.user?.name,
        customerPhone: order.customer?.phone,
        timestamp: new Date()
      };
      
      const label = generateDropoffLabel(labelData);
      setLabelText(label);
    }
  }, [order]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__almariPrinterChar) {
      setHasBluetoothChar(true);
    }
  }, []);

  const copyLabelText = () => {
    navigator.clipboard.writeText(labelText);
    toast.success('Label text copied to clipboard');
  };

  const downloadLabelText = () => {
    const blob = new Blob([labelText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label-${order?.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Label downloaded');
  };

  const printBrowser = () => {
    window.print();
  };

  const printBluetooth = async () => {
    const characteristic = (window as any).__almariPrinterChar;
    if (!characteristic) {
      toast.error('No Bluetooth printer connected');
      return;
    }
    try {
      const data = toESCPOS(labelText);
      await characteristic.writeValueWithoutResponse(data);
      toast.success('Label sent to printer');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send label');
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-zervia-600 rounded-full mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  const maskedPhone = order.customer?.phone
    ? order.customer.phone.replace(/(\d{3})\d+(\d{3})/, '$1*****$2')
    : '';

  return (
    <div className="container mx-auto p-4 max-w-full">
      <Card>
        <CardHeader>
          <CardTitle>Drop-off Label - Order #{order.id.slice(0, 8)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Print Method Selection */}
          <div className="flex gap-4 mb-6">
            <Button
              variant={printMethod === 'mobile' ? 'default' : 'outline'}
              onClick={() => setPrintMethod('mobile')}
              className="flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              Mobile Printer
            </Button>
            <Button
              variant={printMethod === 'browser' ? 'default' : 'outline'}
              onClick={() => setPrintMethod('browser')}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Browser Print
            </Button>
          </div>

          {/* Mobile Printing Section */}
          {printMethod === 'mobile' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Mobile Printing Instructions:</h3>
                <ol className="text-sm space-y-1 text-gray-600">
                  <li>1. Make sure your XPrinter is connected via Bluetooth to your phone</li>
                  <li>2. Open your thermal printer app (e.g., "Thermal Printer" or "RawBT")</li>
                  <li>3. Copy or download the label text below</li>
                  <li>4. Paste the text in your printer app and print</li>
                </ol>
              </div>

              {/* Label Preview */}
              <div className="bg-white border rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">{labelText}</pre>
              </div>

              {/* QR Code Display */}
              {qrDataUrl && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">QR Code (save and print separately if needed):</p>
                  <img src={qrDataUrl} className="mx-auto w-40 h-40 object-contain" alt="Pickup QR Code" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button onClick={copyLabelText} className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Label Text
                </Button>
                <Button variant="outline" onClick={downloadLabelText} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download as TXT
                </Button>
                {hasBluetoothChar && (
                  <Button onClick={printBluetooth} className="flex items-center gap-2 bg-zervia-600 text-white hover:bg-zervia-700">
                    <Printer className="h-4 w-4" />
                    Print via Bluetooth
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Browser Printing Section */}
          {printMethod === 'browser' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Browser printing requires a computer with a connected printer. For mobile agents, please use the Mobile Printer option.
                </p>
              </div>
              
              <Button onClick={printBrowser} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print Label
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden printable content for browser printing */}
      <div id="printable-label" style={{ display: 'none' }}>
        <style>{`
          @page { size: 58mm auto; margin: 0; }
          @media print {
            body * { visibility: hidden !important; }
            #printable-label, #printable-label * { visibility: visible !important; }
            #printable-label { 
              display: block !important; 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 58mm;
              font-family: monospace;
              padding: 4px;
            }
          }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '20px', margin: '4px 0' }}>AGENT DROP-OFF</h1>
          <div style={{ fontSize: '26px', fontWeight: 700, margin: '6px 0' }}>ORDER {order.id.slice(0, 8)}</div>
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div>CUSTOMER: {order.customer?.user?.name ?? ''} {maskedPhone}</div>
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ fontSize: '18px', margin: '6px 0' }}>PICK-UP CODE: {order.pickup_code}</div>
          {qrDataUrl && (
            <div style={{ textAlign: 'center' }}>
              <img src={qrDataUrl} style={{ width: '160px', height: '160px' }} alt="QR" />
            </div>
          )}
          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '4px 0' }} />
          <small style={{ fontSize: '10px', display: 'block' }}>Printed {new Date().toLocaleString()}</small>
        </div>
      </div>
    </div>
  );
}
