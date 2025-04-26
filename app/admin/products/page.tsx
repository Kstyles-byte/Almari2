import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/mockUtils';

// Mock data for products
const mockProducts = [
  { id: 'prod-001', name: 'Product 1', description: 'Description for product 1', price: 29.99, stock: 100, createdAt: new Date('2023-10-01'), vendor: { name: 'Vendor A' } },
  { id: 'prod-002', name: 'Product 2', description: 'Description for product 2', price: 49.99, stock: 50, createdAt: new Date('2023-10-02'), vendor: { name: 'Vendor B' } },
  { id: 'prod-003', name: 'Product 3', description: 'Description for product 3', price: 19.99, stock: 200, createdAt: new Date('2023-10-03'), vendor: { name: 'Vendor C' } },
  { id: 'prod-004', name: 'Product 4', description: 'Description for product 4', price: 99.99, stock: 25, createdAt: new Date('2023-10-04'), vendor: { name: 'Vendor D' } },
  { id: 'prod-005', name: 'Product 5', description: 'Description for product 5', price: 59.99, stock: 75, createdAt: new Date('2023-10-05'), vendor: { name: 'Vendor E' } },
];

export default async function AdminProductsPage() {
  // Using mock data instead of database calls
  const products = mockProducts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
          </Button>
        </div>
      
      <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search products..."
          className="border-none focus:ring-0"
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: { id: string; name: string; description: string; price: number; stock: number; createdAt: Date; vendor: { name: string } }) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.vendor.name}</TableCell>
                  <TableCell>{formatDate(product.createdAt)}</TableCell>
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
          {products.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No products found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 