/**
 * Thermal printer utility functions for 50mm x 30mm paper
 * 50mm thermal printers typically support 24-26 characters per line
 * 30mm height requires minimal content for readability
 */

const LINE_WIDTH = 24; // Reduced for 50mm width
const DIVIDER = '='.repeat(LINE_WIDTH);
const DASHED_DIVIDER = '-'.repeat(LINE_WIDTH);

export interface LabelData {
  type: 'dropoff' | 'pickup';
  orderId: string;
  location?: string;
  dropoffCode?: string;
  pickupCode?: string;
  customerName?: string;
  customerPhone?: string;
  items?: Array<{ name: string; quantity: number }>;
  timestamp?: Date;
}

/**
 * Centers text within the line width
 */
export function centerText(text: string, width: number = LINE_WIDTH): string {
  if (text.length >= width) return text.substring(0, width);
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text;
}

/**
 * Formats text to fit within line width
 */
export function wrapText(text: string, width: number = LINE_WIDTH): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= width) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Masks phone number for privacy
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + '*****' + phone.substring(phone.length - 3);
}

/**
 * Generates compact dropoff label text for 50mm x 30mm paper
 */
export function generateDropoffLabel(data: LabelData): string {
  const lines: string[] = [];
  
  // Header with order ID on same line
  lines.push(`DROP-OFF #${data.orderId.slice(0, 6)}`);
  
  // VDC (Vendor Drop Code) instead of CODE
  if (data.dropoffCode) {
    lines.push(`VDC:${data.dropoffCode}`);
  }
  
  // Customer info (first name only)
  if (data.customerName) {
    const firstName = data.customerName.split(' ')[0];
    lines.push(firstName.slice(0, 12)); // Max 12 chars for better fit
  }
  
  lines.push(DASHED_DIVIDER);
  
  // Pickup code on same line as label
  if (data.pickupCode) {
    lines.push(`PICKUP:${data.pickupCode}`);
  }
  
  return lines.join('\n');
}

/**
 * Generates compact pickup receipt text for 50mm x 30mm paper
 */
export function generatePickupReceipt(data: LabelData): string {
  const lines: string[] = [];
  
  // Very compact header
  lines.push(centerText('PICKUP'));
  lines.push(`#${data.orderId.slice(0, 6)}`);
  
  // Just date, no time to save space
  const date = data.timestamp ? data.timestamp.toLocaleDateString() : new Date().toLocaleDateString();
  lines.push(date);
  
  // Customer name (first name only)
  if (data.customerName) {
    const firstName = data.customerName.split(' ')[0];
    lines.push(firstName.slice(0, 12));
  }
  
  // Only show first 2-3 items to fit on small paper
  if (data.items && data.items.length > 0) {
    lines.push(DASHED_DIVIDER);
    const maxItems = 3;
    data.items.slice(0, maxItems).forEach(item => {
      const itemName = item.name.slice(0, 16); // Truncate long names
      const qtyText = `x${item.quantity}`;
      lines.push(`${itemName} ${qtyText}`);
    });
    
    if (data.items.length > maxItems) {
      lines.push(`+${data.items.length - maxItems} more`);
    }
  }
  
  lines.push(DASHED_DIVIDER);
  lines.push(centerText('THANK YOU!'));
  
  return lines.join('\n');
}

/**
 * Converts label text to ESC/POS commands for direct printing
 * Note: This is a basic implementation. Actual ESC/POS implementation
 * would require a more comprehensive command set
 */
export function toESCPOS(text: string): Uint8Array {
  const encoder = new TextEncoder();
  const commands: number[] = [];
  
  // Initialize printer
  commands.push(0x1B, 0x40); // ESC @
  
  // Set character code table (UTF-8)
  commands.push(0x1B, 0x74, 0x02);
  
  // Convert text to bytes
  const textBytes = encoder.encode(text + '\n');
  commands.push(...Array.from(textBytes));
  
  // Cut paper
  commands.push(0x1D, 0x56, 0x42, 0x00); // GS V B
  
  return new Uint8Array(commands);
}
