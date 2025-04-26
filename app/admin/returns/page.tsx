import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/mockUtils';

// Mock data for returns
const mockReturns = [
  { id: 'ret-001', returnNumber: 'RMA-54321', customer: 'John Doe', orderNumber: 'ZRV-12345', total: 129.99, status: 'PENDING', createdAt: new Date('2023-10-01') },
  { id: 'ret-002', returnNumber: 'RMA-54322', customer: 'Jane Smith', orderNumber: 'ZRV-12346', total: 89.50, status: 'APPROVED', createdAt: new Date('2023-10-02') },
  { id: 'ret-003', returnNumber: 'RMA-54323', customer: 'Mike Johnson', orderNumber: 'ZRV-12347', total: 249.99, status: 'REJECTED', createdAt: new Date('2023-10-03') },
  { id: 'ret-004', returnNumber: 'RMA-54324', customer: 'Sarah Williams', orderNumber: 'ZRV-12348', total: 59.99, status: 'COMPLETED', createdAt: new Date('2023-10-04') },
  { id: 'ret-005', returnNumber: 'RMA-54325', customer: 'Alex Brown', orderNumber: 'ZRV-12349', total: 179.00, status: 'PENDING', createdAt: new Date('2023-10-05') },
];

// Return status badge component
function ReturnStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    completed: 'bg-green-100 text-green-800',
    approved: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
  };
  
  const status_key = status.toLowerCase() as keyof typeof statusStyles;
  const style = statusStyles[status_key] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

export default async function AdminReturnsPage() {
  // Using mock data instead of database calls
  const returns = mockReturns;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Return
        </Button>
      </div>
      
      <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search returns..."
          className="border-none focus:ring-0"
        />
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
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((returnItem: { id: string; returnNumber: string; orderNumber: string; customer: string; total: number; status: string; createdAt: Date }) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">{returnItem.returnNumber}</TableCell>
                  <TableCell>{returnItem.orderNumber}</TableCell>
                  <TableCell>{returnItem.customer}</TableCell>
                  <TableCell>{formatCurrency(returnItem.total)}</TableCell>
                  <TableCell><ReturnStatusBadge status={returnItem.status} /></TableCell>
                  <TableCell>{formatDate(returnItem.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {returns.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <RefreshCw className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No returns found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 