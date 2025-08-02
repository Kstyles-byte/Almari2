import { getOrderById } from '@/actions/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';

export default async function OrderInvoicePage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const { order, error } = await getOrderById(params.id);

  if (error || !order) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zervia-900">Invoice</h1>

      <Card>
        <CardHeader>
          <CardTitle>Order #{order.orderNumber}</CardTitle>
          <p className="text-sm text-zervia-500 mt-1">
            Date: {format(new Date(order.createdAt), 'MMM d, yyyy')}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₦{item.price.toLocaleString()}</TableCell>
                  <TableCell>
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 space-y-2 text-right">
            <p>Subtotal: ₦{order.subtotal.toLocaleString()}</p>
            <p>Tax: ₦{order.tax.toLocaleString()}</p>
            <p className="font-semibold">
              Total: ₦{order.total.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 