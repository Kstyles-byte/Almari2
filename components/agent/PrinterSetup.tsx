'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bluetooth, Printer, Smartphone, CheckCircle2, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { toESCPOS } from '@/lib/utils/thermal-printer';

interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: any;
}

export default function PrinterSetup() {
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(false);
  const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [printerCharacteristic, setPrinterCharacteristic] = useState<any | null>(null);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Detect platform and Bluetooth support
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) {
      setPlatform('android');
      // Check if Web Bluetooth API is available
      if ('bluetooth' in navigator) {
        setIsBluetoothSupported(true);
      }
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setPlatform('ios');
      setIsBluetoothSupported(false); // Web Bluetooth not supported on iOS
    } else {
      setPlatform('desktop');
      setIsBluetoothSupported(false); // Generally not supported on desktop
    }
  }, []);

  const connectPrinter = async () => {
    if (!isBluetoothSupported) {
      toast.error('Web Bluetooth is only supported on Chrome for Android. Please use the mobile app method below.');
      return;
    }

    try {
      // Request Bluetooth device
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'XP' }, // XPrinter devices
          { namePrefix: 'POS' }, // Generic POS printers
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] } // Common thermal printer service UUID
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      // Connect to GATT server and get characteristic for writing
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      setPrinterDevice(device);
      setPrinterCharacteristic(characteristic);
      setIsConnected(true);
      toast.success(`Connected to ${device.name || 'Thermal Printer'}`);

      // Store device info in localStorage for reconnection (experimental)
      localStorage.setItem('thermal_printer_id', device.id);
      localStorage.setItem('thermal_printer_name', device.name || 'Thermal Printer');

      // Expose characteristic to window
      (window as any).__almariPrinterChar = characteristic;
    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      if (error.name === 'NotFoundError') {
        toast.error('No printer selected. Make sure your printer is on and try again.');
      } else if (error.message?.includes('globally disabled')) {
        toast.error('Web Bluetooth is not available. Please use the mobile app method below.');
      } else {
        toast.error('Failed to connect to printer. Make sure your printer is on and in pairing mode.');
      }
    }
  };

  const testPrint = async () => {
    if (!printerCharacteristic) {
      toast.error('No printer connected');
      return;
    }

    try {
      const testLabel = toESCPOS('*** TEST PRINT ***\nHello from Almari!');
      await printerCharacteristic.writeValueWithoutResponse(testLabel);
      toast.success('Test print sent');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print test page');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Printer Setup</CardTitle>
        <CardDescription>
          Connect your Bluetooth thermal printer to print labels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Support Check */}
        <div className="flex items-center gap-3">
          {isBluetoothSupported ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="text-sm">
            {isBluetoothSupported
              ? 'Your browser supports Bluetooth printing'
              : 'Bluetooth printing not supported. Use Chrome on Android or the mobile app.'}
          </span>
        </div>

        {/* Connection Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium">
                  {printerDevice ? printerDevice.name : 'No printer connected'}
                </p>
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Ready to print' : 'Click connect to set up printer'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected && <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={connectPrinter}
            disabled={isConnected || !isBluetoothSupported}
            className="flex items-center gap-2"
          >
            <Bluetooth className="h-4 w-4" />
            {isConnected ? 'Connected' : 'Connect Printer'}
          </Button>
          <Button
            variant="outline"
            onClick={testPrint}
            disabled={!isConnected}
          >
            Test Print
          </Button>
        </div>

        {/* Mobile App Alternative */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile App Alternative
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            For better printing experience, you can use a thermal printer app on your phone:
          </p>
          <ol className="text-sm space-y-2 text-gray-600">
            <li>1. Download a thermal printer app (e.g., "Thermal Printer" or "RawBT")</li>
            <li>2. Connect your XPrinter via Bluetooth in the app</li>
            <li>3. Click "Generate Label" below to create printable text</li>
            <li>4. Copy the text and paste it in your printer app</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
