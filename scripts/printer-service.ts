// @ts-nocheck
import express from 'express';
import {
  ThermalPrinter,
  PrinterTypes,
  BreakLine,
} from 'node-thermal-printer';

// ---------------------------------------------------------------------------
// Helper – create a configured ThermalPrinter instance on-demand
// ---------------------------------------------------------------------------
function createPrinter() {
  const typeEnv = (process.env.PRINTER_TYPE || 'epson').toLowerCase();
  const printerType =
    typeEnv === 'star' ? PrinterTypes.STAR : PrinterTypes.EPSON;

  const iface =
    process.env.PRINTER_INTERFACE ||
    'printer:auto'; /*
      Examples:
      • tcp://192.168.0.99:9100    – network receipt printer
      • printer:My_USB_Printer     – system (CUPS/Windows) printer by name
      • printer:auto               – first system printer
    */

  const widthChars = Number(process.env.PRINTER_WIDTH) || 24; // 50mm paper width

  return new ThermalPrinter({
    type: printerType,
    interface: iface,
    width: widthChars,
    breakLine: BreakLine.WORD,
  });
}

const app = express();
app.use(express.json());

app.post('/print', async (req, res) => {
  const {
    type,
    orderId,
    dropoffCode,
    pickupCode,
    customerFirstName,
    customerMaskedPhone,
    agentLocation,
    timestamp,
  } = req.body as Record<string, string>;

  if (type !== 'dropoff-label') {
    return res.status(400).json({ error: 'Unsupported print type' });
  }

  try {
    const printer = createPrinter();

    // Generate QR code for pickup
    // Node-thermal-printer has built-in QR printing, but we pre-encode to
    // ensure exact contents (supports alphanum perfectly).
    // If the printer supports native QR, we can just call printer.printQR.

    printer.alignLeft(); // Left align for compact format

    // Compact layout for 50mm x 30mm paper
    printer.setTextSize(1, 1);
    printer.println(`DROP-OFF #${orderId.slice(0, 6)}`);
    printer.println(`VDC:${dropoffCode}`);
    
    // Customer first name only
    printer.println(customerFirstName.slice(0, 12));

    printer.println('------------------------');
    
    // Pickup code on same line
    printer.println(`PICKUP:${pickupCode}`);
    
    printer.cut();

    const success = await printer.execute();

    if (!success) {
      return res.status(500).json({ error: 'Printer not connected' });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected print error:', err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = Number(process.env.PRINTER_PORT || 4000);
app.listen(PORT, () => {
  console.log(`📠 Mini-printer service listening on http://localhost:${PORT}`);
}); 