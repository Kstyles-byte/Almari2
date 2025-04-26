import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Store, 
  Search, 
  Filter,
  Check,
  X,
  ExternalLink,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { formatCurrency, formatDate } from '@/lib/mockUtils';
import Link from 'next/link';
import Image from 'next/image';

// Component for vendor status badge
function VendorStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-blue-100 text-blue-800',
  };
  
  const status_key = status.toLowerCase() as keyof typeof statusStyles;
  const style = statusStyles[status_key] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

// Mock data for vendors
const mockVendors = [
  { id: 'vend-001', name: 'Vendor A', description: 'Fashion and apparel', products: 25, revenue: 12500.50, createdAt: new Date('2023-01-15') },
  { id: 'vend-002', name: 'Vendor B', description: 'Electronics and gadgets', products: 18, revenue: 18500.75, createdAt: new Date('2023-02-20') },
  { id: 'vend-003', name: 'Vendor C', description: 'Home and living', products: 32, revenue: 9800.25, createdAt: new Date('2023-03-10') },
  { id: 'vend-004', name: 'Vendor D', description: 'Beauty products', products: 15, revenue: 7500.00, createdAt: new Date('2023-04-05') },
  { id: 'vend-005', name: 'Vendor E', description: 'Sports and outdoors', products: 22, revenue: 14200.30, createdAt: new Date('2023-05-18') },
];

export default async function AdminVendorsPage() {
  // Using mock data instead of database calls
  const vendors = mockVendors;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>
      
      <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search vendors..."
          className="border-none focus:ring-0"
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor: { id: string; name: string; description: string; products: number; revenue: number; createdAt: Date }) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.description}</TableCell>
                  <TableCell>{vendor.products}</TableCell>
                  <TableCell>{formatCurrency(vendor.revenue)}</TableCell>
                  <TableCell>{formatDate(vendor.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {vendors.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <Store className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No vendors found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 