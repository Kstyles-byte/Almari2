/**
 * Thermal printer utility functions for 58mm paper width
 * Standard 58mm thermal printers typically support 32 characters per line
 */

const LINE_WIDTH = 32;
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
 * Generates dropoff label text
 */
export function generateDropoffLabel(data: LabelData): string {
  const lines: string[] = [];
  
  lines.push(DIVIDER);
  lines.push(centerText('AGENT DROP-OFF'));
  lines.push(DIVIDER);
  
  if (data.location) {
    lines.push(centerText(data.location.toUpperCase()));
    lines.push('');
  }
  
  lines.push(`ORDER: ${data.orderId.slice(0, 8).toUpperCase()}`);
  lines.push(DASHED_DIVIDER);
  
  if (data.dropoffCode) {
    lines.push(`DROP-OFF CODE: ${data.dropoffCode}`);
    lines.push('');
  }
  
  if (data.customerName) {
    lines.push(`CUSTOMER: ${data.customerName}`);
  }
  
  if (data.customerPhone) {
    lines.push(`PHONE: ${maskPhone(data.customerPhone)}`);
  }
  
  lines.push(DASHED_DIVIDER);
  
  if (data.pickupCode) {
    lines.push('PICKUP CODE:');
    lines.push(centerText(data.pickupCode));
    lines.push('');
    lines.push(centerText('[QR CODE]'));
  }
  
  lines.push('');
  lines.push(DASHED_DIVIDER);
  lines.push(`Printed: ${data.timestamp ? data.timestamp.toLocaleString() : new Date().toLocaleString()}`);
  lines.push(DIVIDER);
  
  return lines.join('\n');
}

/**
 * Generates pickup receipt text
 */
export function generatePickupReceipt(data: LabelData): string {
  const lines: string[] = [];
  
  lines.push(DIVIDER);
  lines.push(centerText('PICKUP RECEIPT'));
  lines.push(DIVIDER);
  
  if (data.location) {
    lines.push(centerText(data.location));
    lines.push('');
  }
  
  lines.push(`ORDER: ${data.orderId.slice(0, 8).toUpperCase()}`);
  lines.push(`DATE: ${data.timestamp ? data.timestamp.toLocaleDateString() : new Date().toLocaleDateString()}`);
  lines.push(`TIME: ${data.timestamp ? data.timestamp.toLocaleTimeString() : new Date().toLocaleTimeString()}`);
  
  if (data.customerName) {
    lines.push('');
    lines.push(`CUSTOMER: ${data.customerName}`);
  }
  
  if (data.items && data.items.length > 0) {
    lines.push('');
    lines.push(DASHED_DIVIDER);
    lines.push('ITEMS:');
    lines.push('');
    
    data.items.forEach(item => {
      const itemLine = `${item.name}`;
      const qtyText = `x${item.quantity}`;
      const spaces = LINE_WIDTH - itemLine.length - qtyText.length;
      
      if (spaces > 0) {
        lines.push(itemLine + ' '.repeat(spaces) + qtyText);
      } else {
        // Item name is too long, wrap it
        const wrapped = wrapText(itemLine, LINE_WIDTH - 5);
        wrapped.forEach((line, index) => {
          if (index === wrapped.length - 1) {
            const spaces2 = LINE_WIDTH - line.length - qtyText.length;
            lines.push(line + ' '.repeat(Math.max(1, spaces2)) + qtyText);
          } else {
            lines.push(line);
          }
        });
      }
    });
  }
  
  lines.push('');
  lines.push(DASHED_DIVIDER);
  lines.push(centerText('THANK YOU!'));
  lines.push(centerText('Keep this receipt'));
  lines.push(DIVIDER);
  
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
