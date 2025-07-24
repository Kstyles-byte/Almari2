import { atom } from 'jotai';

// Atom to track whether the user has any unread notifications
export const userHasUnreadNotificationsAtom = atom<boolean>(false);
export const unreadNotificationCountAtom = atom<number>(0);

// NEW EDIT BELOW: atoms for vendor live orders
export interface VendorOrder {
  id: string; // order id
  orderNumber: string; // maybe same as id but truncated, for convenience
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  customerName?: string;
  items?: any[]; // keep generic for now
  isNew?: boolean; // highlight new
  isUnread?: boolean; // for badge
}

// Holds all orders for the current vendor in-memory (most recent first)
export const vendorOrdersAtom = atom<VendorOrder[]>([]);

// Count of orders that have isUnread=true
export const unreadVendorOrdersCountAtom = atom<number>(0);

// Agent orders atoms
export interface AgentOrder {
  id: string; // order id
  short_id?: string;
  created_at: string;
  status: string;
  payment_status: string;
  total_amount: number;
  customer_name: string;
  pickup_code?: string;
  dropoff_code?: string;
  pickup_status?: string;
  items: {
    id: string;
    name?: string;
    quantity: number;
    price: number;
  }[];
  isNew?: boolean;
  isUnread?: boolean;
}

export const agentOrdersAtom = atom<AgentOrder[]>([]);
export const unreadAgentOrdersCountAtom = atom<number>(0);
