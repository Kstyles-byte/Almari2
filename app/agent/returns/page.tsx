import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { formatDate, formatCurrency } from '@/lib/mockUtils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

// Mock data for returns
const mockReturns = [
  { id: 'ret-001', returnNumber: 'RMA-54321', orderNumber: 'ZRV-12345', customerName: 'John Doe', total: 129.99, status: 'PENDING AGENT VERIFICATION', requestDate: new Date('2023-10-06'), itemCount: 2, reason: 'Wrong size' },
  { id: 'ret-002', returnNumber: 'RMA-54322', orderNumber: 'ZRV-12346', customerName: 'Jane Smith', total: 89.50, status: 'PENDING AGENT VERIFICATION', requestDate: new Date('2023-10-07'), itemCount: 1, reason: 'Item defective' },
  { id: 'ret-003', returnNumber: 'RMA-54323', orderNumber: 'ZRV-12347', customerName: 'Mike Johnson', total: 249.99, status: 'APPROVED', requestDate: new Date('2023-10-03'), itemCount: 3, reason: 'Changed mind', processDate: new Date('2023-10-05') },
  { id: 'ret-004', returnNumber: 'RMA-54324', orderNumber: 'ZRV-12348', customerName: 'Sarah Williams', total: 59.99, status: 'COMPLETED', requestDate: new Date('2023-10-02'), itemCount: 1, reason: 'Wrong item', processDate: new Date('2023-10-04') },
  { id: 'ret-005', returnNumber: 'RMA-54325', orderNumber: 'ZRV-12349', customerName: 'Alex Brown', total: 179.00, status: 'REJECTED', requestDate: new Date('2023-10-01'), itemCount: 2, reason: 'Other', processDate: new Date('2023-10-03') },
];

// Define custom status badge component
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

export default async function AgentReturns({
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

  // Filter returns based on status and search query using mock data
  let filteredReturns = mockReturns;
  if (statusFilter !== "all") {
    filteredReturns = filteredReturns.filter(returnItem => returnItem.status === statusFilter.replace('_', ' ').toUpperCase());
  }
  if (searchQuery) {
    filteredReturns = filteredReturns.filter(returnItem => 
      returnItem.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Count returns by status
  const pendingCount = mockReturns.filter(returnItem => returnItem.status === "PENDING AGENT VERIFICATION").length;
  const processedCount = mockReturns.filter(returnItem => returnItem.status !== "PENDING AGENT VERIFICATION").length;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold">Return Management</h1>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <form className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="search"
              placeholder="Search returns..."
              name="search"
              defaultValue={searchQuery}
              className="w-[200px]"
            />
            <Button type="submit">Filter</Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Returns</CardTitle>
            <CardDescription>Returns awaiting verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Processed Returns</CardTitle>
            <CardDescription>Returns already processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{processedCount}</div>
          </CardContent>
        </Card>
      </div>

      {filteredReturns.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No returns found. Try changing your search or filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((returnItem) => (
            <Card key={returnItem.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Return #{returnItem.returnNumber}</CardTitle>
                    <CardDescription>
                      {returnItem.customerName} • {formatDate(returnItem.requestDate)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ReturnStatusBadge status={returnItem.status} />
                    <span className="text-sm font-medium">
                      {returnItem.itemCount} items
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm mb-2">
                      <span className="font-semibold">Total:</span> {formatCurrency(returnItem.total)}
                    </div>
                    <div className="text-sm mb-2">
                      <span className="font-semibold">Reason:</span> {returnItem.reason}
                    </div>
                    {returnItem.status !== "PENDING AGENT VERIFICATION" && (
                      <div className="text-sm mb-2">
                        <span className="font-semibold">Processed:</span> {formatDate(returnItem.processDate || returnItem.requestDate)}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <a 
                      href={`/agent/returns/${returnItem.id}`}
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