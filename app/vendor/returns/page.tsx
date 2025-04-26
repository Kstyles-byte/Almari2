import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { formatDate, formatCurrency } from '@/lib/mockUtils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

// Mock data for returns
const mockReturns = [
  { id: 'ret-001', returnNumber: 'RMA-54321', orderNumber: 'ZRV-12345', customerName: 'John Doe', total: 129.99, status: 'PENDING', requestDate: new Date('2023-10-01') },
  { id: 'ret-002', returnNumber: 'RMA-54322', orderNumber: 'ZRV-12346', customerName: 'Jane Smith', total: 89.50, status: 'APPROVED', requestDate: new Date('2023-10-02') },
  { id: 'ret-003', returnNumber: 'RMA-54323', orderNumber: 'ZRV-12347', customerName: 'Mike Johnson', total: 249.99, status: 'REJECTED', requestDate: new Date('2023-10-03') },
  { id: 'ret-004', returnNumber: 'RMA-54324', orderNumber: 'ZRV-12348', customerName: 'Sarah Williams', total: 59.99, status: 'COMPLETED', requestDate: new Date('2023-10-04') },
  { id: 'ret-005', returnNumber: 'RMA-54325', orderNumber: 'ZRV-12349', customerName: 'Alex Brown', total: 179.00, status: 'PENDING', requestDate: new Date('2023-10-05') },
];

// Define custom status badge component
function ReturnStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
  };
  const status_key = status.toLowerCase() as keyof typeof statusStyles;
  const style = statusStyles[status_key] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

export default async function VendorReturns({
  searchParams,
}: {
  searchParams: { status?: string; search?: string };
}) {
  const session = await auth();

  if (!session || session.user.role !== "VENDOR") {
    redirect("/");
  }

  const statusFilter = searchParams.status || "all";
  const searchQuery = searchParams.search || "";

  // Filter returns based on status and search query using mock data
  let filteredReturns = mockReturns;
  if (statusFilter !== "all") {
    filteredReturns = filteredReturns.filter(returnItem => returnItem.status === statusFilter.toUpperCase());
  }
  if (searchQuery) {
    filteredReturns = filteredReturns.filter(returnItem => 
      returnItem.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      returnItem.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Count returns by status
  const pendingCount = mockReturns.filter(returnItem => returnItem.status === "PENDING").length;
  const approvedCount = mockReturns.filter(returnItem => returnItem.status === "APPROVED").length;
  const rejectedCount = mockReturns.filter(returnItem => returnItem.status === "REJECTED").length;
  const completedCount = mockReturns.filter(returnItem => returnItem.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Pending Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Approved Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Rejected Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Completed Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm mb-6">
        <Input
          placeholder="Search returns..."
          className="border-none focus:ring-0"
          defaultValue={searchQuery}
          name="search"
        />
        <Button type="submit">Search</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return Number</TableHead>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">{returnItem.returnNumber}</TableCell>
                  <TableCell>{returnItem.orderNumber}</TableCell>
                  <TableCell>{returnItem.customerName}</TableCell>
                  <TableCell>{formatCurrency(returnItem.total)}</TableCell>
                  <TableCell><ReturnStatusBadge status={returnItem.status} /></TableCell>
                  <TableCell>{formatDate(returnItem.requestDate)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button size="sm" variant="outline">View</Button>
                      {returnItem.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="outline">Approve</Button>
                          <Button size="sm" variant="destructive">Reject</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredReturns.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <p className="text-gray-500">No returns found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 