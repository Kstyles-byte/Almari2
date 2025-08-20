'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Printer, Smartphone, Info } from 'lucide-react';
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
  const [platform, setPlatform] = useState<string>('');

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
    if (typeof window !== 'undefined') {
      if ((window as any).__almariPrinterChar) {
        setHasBluetoothChar(true);
      }
      
      // Detect platform
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('android')) {
        setPlatform('android');
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        setPlatform('ios');
      } else {
        setPlatform('desktop');
      }
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

  const openInRawBT = () => {
    // URL scheme for RawBT app
    const encodedText = encodeURIComponent(labelText);
    const rawbtUrl = `rawbt://print?text=${encodedText}`;
    
    // Try to open RawBT app
    window.location.href = rawbtUrl;
    
    // Fallback: copy to clipboard if app not installed
    setTimeout(() => {
      navigator.clipboard.writeText(labelText);
      toast.success('Label copied! Paste in your printer app if RawBT didn\'t open.');
    }, 1000);
  };

  const openInThermalPrinter = () => {
    // For iOS thermal printer apps that accept text via URL schemes
    // Some apps accept data:// URLs or custom schemes
    const encodedText = encodeURIComponent(labelText);
    const thermalUrl = `thermal://print?data=${encodedText}`;
    
    window.location.href = thermalUrl;
    
    // Fallback: copy to clipboard
    setTimeout(() => {
      navigator.clipboard.writeText(labelText);
      toast.success('Label copied! Paste in your thermal printer app if it didn\'t open automatically.');
    }, 1000);
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
              {platform === 'ios' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">iOS Printing Method</p>
                      <p>Web Bluetooth isn't supported on iOS. Use a thermal printer app from the App Store.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">
                  {platform === 'ios' ? 'iOS Printing Instructions:' : 'Mobile Printing Instructions:'}
                </h3>
                {platform === 'ios' ? (
                  <ol className="text-sm space-y-1 text-gray-600">
                    <li>1. Download "RawBT" or "Thermal Printer" from App Store</li>
                    <li>2. Pair your XPrinter in iOS Settings → Bluetooth</li>
                    <li>3. Open the printer app and connect to your paired printer</li>
                    <li>4. Copy the label text below and paste in the app</li>
                    <li>5. Print directly from the app</li>
                  </ol>
                ) : (
                  <ol className="text-sm space-y-1 text-gray-600">
                    <li>1. Make sure your XPrinter is connected via Bluetooth to your phone</li>
                    <li>2. Open your thermal printer app (e.g., "Thermal Printer" or "RawBT")</li>
                    <li>3. Copy or download the label text below</li>
                    <li>4. Paste the text in your printer app and print</li>
                  </ol>
                )}
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
              <div className="space-y-3">
                {platform === 'ios' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button onClick={openInRawBT} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                      <Smartphone className="h-4 w-4" />
                      Open in RawBT
                    </Button>
                    <Button onClick={openInThermalPrinter} variant="outline" className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Open in Thermal App
                    </Button>
                  </div>
                )}
                
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
          @page { size: 50mm 30mm; margin: 0; }
          @media print {
            body * { visibility: hidden !important; }
            #printable-label, #printable-label * { visibility: visible !important; }
            #printable-label { 
              display: block !important; 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 50mm;
              height: 30mm;
              font-family: monospace;
              padding: 1mm;
              font-size: 8px;
              line-height: 1.1;
            }
          }
        `}</style>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '9px', margin: '0' }}>DROP-OFF #{order.id.slice(0, 6)}</div>
          <div style={{ fontSize: '8px', margin: '1px 0' }}>VDC:{order.dropoff_code}</div>
          <div style={{ fontSize: '8px', margin: '1px 0' }}>
            {order.customer?.user?.name?.split(' ')[0]?.slice(0, 12)}
          </div>
          <div style={{ fontSize: '8px', margin: '1px 0', borderTop: '1px dashed #000', paddingTop: '1px' }}>
            ------------------------
          </div>
          <div style={{ fontSize: '8px', margin: '1px 0' }}>PICKUP:{order.pickup_code}</div>
        </div>
      </div>
    </div>
  );
}
