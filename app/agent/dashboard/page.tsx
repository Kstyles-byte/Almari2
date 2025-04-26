import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { formatDate, formatCurrency } from '@/lib/mockUtils';
import Link from 'next/link';
import { Button } from "../../../components/ui/button";

// Mock data for agent stats
const mockAgentStats = {
  totalOrders: 25,
  pendingOrders: 5,
  completedOrders: 18,
  returnRequests: 2,
  rating: 4.7,
  totalEarnings: 1250.75
};

// Mock data for recent orders
const mockRecentOrders = [
  { id: 'ord-001', orderNumber: 'ZRV-12345', customerName: 'John Doe', total: 129.99, status: 'READY FOR PICKUP', createdAt: new Date('2023-10-01') },
  { id: 'ord-002', orderNumber: 'ZRV-12346', customerName: 'Jane Smith', total: 89.50, status: 'PENDING', createdAt: new Date('2023-10-02') },
  { id: 'ord-003', orderNumber: 'ZRV-12347', customerName: 'Mike Johnson', total: 249.99, status: 'COMPLETED', createdAt: new Date('2023-10-03') },
  { id: 'ord-004', orderNumber: 'ZRV-12348', customerName: 'Sarah Williams', total: 59.99, status: 'READY FOR PICKUP', createdAt: new Date('2023-10-04') },
  { id: 'ord-005', orderNumber: 'ZRV-12349', customerName: 'Alex Brown', total: 179.00, status: 'COMPLETED', createdAt: new Date('2023-10-05') },
];

// Mock data for return requests
const mockReturnRequests = [
  { id: 'ret-001', returnNumber: 'RMA-54321', orderNumber: 'ZRV-12345', customerName: 'John Doe', total: 129.99, status: 'PENDING AGENT VERIFICATION', requestDate: new Date('2023-10-06') },
  { id: 'ret-002', returnNumber: 'RMA-54322', orderNumber: 'ZRV-12346', customerName: 'Jane Smith', total: 89.50, status: 'PENDING AGENT VERIFICATION', requestDate: new Date('2023-10-07') },
];

// Mock data for recent pickups
const mockRecentPickups = [
  { id: 'ord-006', orderNumber: 'ZRV-12350', customerName: 'Emily Davis', total: 64.99, status: 'DELIVERED', updatedAt: new Date('2023-10-06') },
  { id: 'ord-007', orderNumber: 'ZRV-12351', customerName: 'Tom Wilson', total: 114.50, status: 'DELIVERED', updatedAt: new Date('2023-10-05') },
  { id: 'ord-008', orderNumber: 'ZRV-12352', customerName: 'Lisa Anderson', total: 89.99, status: 'DELIVERED', updatedAt: new Date('2023-10-04') },
  { id: 'ord-009', orderNumber: 'ZRV-12353', customerName: 'Mark Taylor', total: 199.99, status: 'DELIVERED', updatedAt: new Date('2023-10-03') },
  { id: 'ord-010', orderNumber: 'ZRV-12354', customerName: 'Anna Martinez', total: 74.50, status: 'DELIVERED', updatedAt: new Date('2023-10-02') },
];

// Define custom status badge components to avoid import errors
function OrderStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    ready_for_pickup: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
  };
  const status_key = status.toLowerCase().replace(' ', '_') as keyof typeof statusStyles;
  const style = statusStyles[status_key] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

function ReturnStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    pending_agent_verification: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
  };
  const status_key = status.toLowerCase().replace(' ', '_') as keyof typeof statusStyles;
  const style = statusStyles[status_key] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

export default async function AgentDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "AGENT") {
    redirect("/");
  }

  // Use mock data instead of fetching from database
  const pendingOrders = mockRecentOrders.filter(order => order.status === 'READY FOR PICKUP');
  const pendingReturns = mockReturnRequests;
  const recentPickups = mockRecentPickups;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Agent Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Orders</CardTitle>
            <CardDescription>Orders awaiting pickup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingOrders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Returns</CardTitle>
            <CardDescription>Returns to process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingReturns.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Today's Pickups</CardTitle>
            <CardDescription>Orders picked up today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {recentPickups.filter(order => 
                new Date(order.updatedAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Pending Orders</TabsTrigger>
          <TabsTrigger value="returns">Pending Returns</TabsTrigger>
          <TabsTrigger value="recent">Recent Pickups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending orders awaiting pickup.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle>Order #{order.orderNumber}</CardTitle>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <CardDescription>
                      {order.customerName} • {formatDate(order.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-2">
                      <span className="font-semibold">Total:</span> {formatCurrency(order.total)}
                    </div>
                    <a 
                      href={`/agent/orders/${order.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Details
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="returns">
          {pendingReturns.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending returns to process.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReturns.map((returnItem) => (
                <Card key={returnItem.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle>Return #{returnItem.returnNumber}</CardTitle>
                      <ReturnStatusBadge status={returnItem.status} />
                    </div>
                    <CardDescription>
                      {returnItem.customerName} • {formatDate(returnItem.requestDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-2">
                      <span className="font-semibold">Total:</span> {formatCurrency(returnItem.total)}
                    </div>
                    <a 
                      href={`/agent/returns/${returnItem.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Details
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          {recentPickups.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No recent pickups.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentPickups.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle>Order #{order.orderNumber}</CardTitle>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <CardDescription>
                      {order.customerName} • {formatDate(order.updatedAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-2">
                      <span className="font-semibold">Picked up:</span> {formatDate(order.updatedAt)}
                    </div>
                    <a 
                      href={`/agent/orders/${order.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Details
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 