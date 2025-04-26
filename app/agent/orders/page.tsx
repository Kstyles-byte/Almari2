import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { formatDate } from '@/lib/mockUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "../../../components/ui/select";

// Mock data for orders
const mockOrders = [
  { id: 'ord-001', orderNumber: 'ZRV-12345', customerName: 'John Doe', total: 129.99, status: 'READY FOR PICKUP', createdAt: new Date('2023-10-01'), pickupCode: 'ABC123', itemCount: 3 },
  { id: 'ord-002', orderNumber: 'ZRV-12346', customerName: 'Jane Smith', total: 89.50, status: 'PENDING', createdAt: new Date('2023-10-02'), pickupCode: 'DEF456', itemCount: 2 },
  { id: 'ord-003', orderNumber: 'ZRV-12347', customerName: 'Mike Johnson', total: 249.99, status: 'COMPLETED', createdAt: new Date('2023-10-03'), pickupCode: 'GHI789', itemCount: 5 },
  { id: 'ord-004', orderNumber: 'ZRV-12348', customerName: 'Sarah Williams', total: 59.99, status: 'READY FOR PICKUP', createdAt: new Date('2023-10-04'), pickupCode: 'JKL012', itemCount: 1 },
  { id: 'ord-005', orderNumber: 'ZRV-12349', customerName: 'Alex Brown', total: 179.00, status: 'DELIVERED', createdAt: new Date('2023-10-05'), pickupCode: 'MNO345', itemCount: 4, updatedAt: new Date('2023-10-06') },
  { id: 'ord-006', orderNumber: 'ZRV-12350', customerName: 'Emily Davis', total: 64.99, status: 'DELIVERED', createdAt: new Date('2023-10-06'), pickupCode: 'PQR678', itemCount: 2, updatedAt: new Date('2023-10-07') },
  { id: 'ord-007', orderNumber: 'ZRV-12351', customerName: 'Tom Wilson', total: 114.50, status: 'SHIPPED', createdAt: new Date('2023-10-07'), pickupCode: 'STU901', itemCount: 3 },
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

export default async function AgentOrders({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const session = await auth();

  if (!session || session.user.role !== "AGENT") {
    redirect("/");
  }

  const statusFilter = searchParams.status || "all";
  const searchQuery = searchParams.search || "";

  // Filter orders based on status and search query using mock data
  let filteredOrders = mockOrders;
  if (statusFilter !== "all") {
    filteredOrders = filteredOrders.filter(order => order.status === statusFilter.replace('_', ' ').toUpperCase());
  }
  if (searchQuery) {
    filteredOrders = filteredOrders.filter(order => 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pickupCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Count orders by status
  const pendingCount = mockOrders.filter(order => order.status === "READY FOR PICKUP").length;
  const pickedUpCount = mockOrders.filter(order => order.status === "DELIVERED").length;
  const inTransitCount = mockOrders.filter(order => order.status === "SHIPPED").length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <form className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="search"
              placeholder="Search orders..."
              name="search"
              defaultValue={searchQuery}
              className="w-[200px]"
            />
            <Select name="status" defaultValue={statusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="READY_FOR_PICKUP">Ready for Pickup</SelectItem>
                <SelectItem value="SHIPPED">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Picked Up</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Filter</Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Pickups</CardTitle>
            <CardDescription>Orders awaiting pickup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>In Transit</CardTitle>
            <CardDescription>Orders in transit to agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inTransitCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Picked Up</CardTitle>
            <CardDescription>Orders picked up by customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pickedUpCount}</div>
          </CardContent>
        </Card>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No orders found. Try changing your search or filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order #{order.orderNumber}</CardTitle>
                    <CardDescription>
                      {order.customerName} • {formatDate(order.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-sm font-medium">
                      {order.itemCount} items
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {order.status === "READY FOR PICKUP" && (
                      <div className="text-sm mb-2">
                        <span className="font-semibold">Pickup Code:</span> {order.pickupCode}
                      </div>
                    )}
                    {order.status === "DELIVERED" && (
                      <div className="text-sm mb-2">
                        <span className="font-semibold">Picked up:</span> {formatDate(order.updatedAt || order.createdAt)}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <a 
                      href={`/agent/orders/${order.id}`}
                      className="inline-block px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 