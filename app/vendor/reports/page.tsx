import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from '@/lib/mockUtils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

// Mock data for sales reports
const mockSalesData = {
  totalRevenue: 12500.75,
  totalOrders: 320,
  averageOrderValue: 39.06,
  totalItemsSold: 850,
  period: 'This Month',
};

// Mock data for top products
const mockTopProducts = [
  { id: 'prod-001', name: 'Product 1', unitsSold: 120, revenue: 3598.80, price: 29.99 },
  { id: 'prod-002', name: 'Product 2', unitsSold: 85, revenue: 4249.15, price: 49.99 },
  { id: 'prod-003', name: 'Product 3', unitsSold: 75, revenue: 1499.25, price: 19.99 },
  { id: 'prod-004', name: 'Product 4', unitsSold: 50, revenue: 4999.50, price: 99.99 },
  { id: 'prod-005', name: 'Product 5', unitsSold: 40, revenue: 2399.60, price: 59.99 },
];

// Mock data for recent orders
const mockRecentOrders = [
  { id: 'ord-001', orderNumber: 'ZRV-12345', customerName: 'John Doe', total: 129.99, status: 'COMPLETED', createdAt: new Date('2023-10-01') },
  { id: 'ord-002', orderNumber: 'ZRV-12346', customerName: 'Jane Smith', total: 89.50, status: 'COMPLETED', createdAt: new Date('2023-10-02') },
  { id: 'ord-003', orderNumber: 'ZRV-12347', customerName: 'Mike Johnson', total: 249.99, status: 'COMPLETED', createdAt: new Date('2023-10-03') },
  { id: 'ord-004', orderNumber: 'ZRV-12348', customerName: 'Sarah Williams', total: 59.99, status: 'COMPLETED', createdAt: new Date('2023-10-04') },
  { id: 'ord-005', orderNumber: 'ZRV-12349', customerName: 'Alex Brown', total: 179.00, status: 'COMPLETED', createdAt: new Date('2023-10-05') },
];

// Define custom status badge component
function OrderStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    ready_for_pickup: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    shipped: 'bg-blue-100 text-blue-800',
  };
  const status_key = status.toLowerCase().replace(' ', '_') as keyof typeof statusStyles;
  const style = statusStyles[status_key] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

export default async function VendorReports({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const session = await auth();

  if (!session || session.user.role !== "VENDOR") {
    redirect("/");
  }

  const periodFilter = searchParams.period || "month";

  // Use mock data for sales reports
  const salesData = mockSalesData;
  const topProducts = mockTopProducts;
  const recentOrders = mockRecentOrders;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
        <form>
          <Select name="period" defaultValue={periodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="ml-2">Apply</Button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesData.totalRevenue)}</div>
            <p className="text-xs text-gray-500">{salesData.period}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.totalOrders}</div>
            <p className="text-xs text-gray-500">{salesData.period}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesData.averageOrderValue)}</div>
            <p className="text-xs text-gray-500">{salesData.period}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.totalItemsSold}</div>
            <p className="text-xs text-gray-500">{salesData.period}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.unitsSold}</TableCell>
                      <TableCell>{formatCurrency(product.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 