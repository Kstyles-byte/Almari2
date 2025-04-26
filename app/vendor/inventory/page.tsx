import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { formatCurrency } from '@/lib/mockUtils';
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

// Mock data for inventory
const mockInventory = [
  { id: 'prod-001', name: 'Product 1', sku: 'SKU001', stock: 100, price: 29.99, lowStockThreshold: 10, status: 'In Stock' },
  { id: 'prod-002', name: 'Product 2', sku: 'SKU002', stock: 50, price: 49.99, lowStockThreshold: 10, status: 'In Stock' },
  { id: 'prod-003', name: 'Product 3', sku: 'SKU003', stock: 5, price: 19.99, lowStockThreshold: 10, status: 'Low Stock' },
  { id: 'prod-004', name: 'Product 4', sku: 'SKU004', stock: 0, price: 99.99, lowStockThreshold: 10, status: 'Out of Stock' },
  { id: 'prod-005', name: 'Product 5', sku: 'SKU005', stock: 75, price: 59.99, lowStockThreshold: 10, status: 'In Stock' },
];

export default async function VendorInventory({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await auth();

  if (!session || session.user.role !== "VENDOR") {
    redirect("/");
  }

  const searchQuery = searchParams.search || "";

  // Filter inventory based on search query using mock data
  let filteredInventory = mockInventory;
  if (searchQuery) {
    filteredInventory = filteredInventory.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Calculate inventory stats
  const totalProducts = mockInventory.length;
  const lowStockCount = mockInventory.filter(item => item.status === 'Low Stock').length;
  const outOfStockCount = mockInventory.filter(item => item.status === 'Out of Stock').length;
  const totalInventoryValue = mockInventory.reduce((sum, item) => sum + (item.price * item.stock), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <Button>
          Add Product
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm mb-6">
        <Input
          placeholder="Search inventory..."
          className="border-none focus:ring-0"
          defaultValue={searchQuery}
          name="search"
        />
        <Button type="submit">Search</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === 'In Stock' ? 'bg-green-100 text-green-800' : item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {item.status}
                    </span>
                  </TableCell>
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
          {filteredInventory.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <p className="text-gray-500">No inventory items found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 