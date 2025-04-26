import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  UserPlus, 
  Search, 
  Filter,
  Users,
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

// Mock data for users
const mockUsers = [
  { id: 'usr-001', name: 'Emily Davis', email: 'emily.davis@example.com', image: '/images/placeholder.jpg', role: 'CUSTOMER', createdAt: new Date('2023-09-15') },
  { id: 'usr-002', name: 'Tom Wilson', email: 'tom.wilson@example.com', image: '/images/placeholder.jpg', role: 'VENDOR', createdAt: new Date('2023-09-10') },
  { id: 'usr-003', name: 'Lisa Anderson', email: 'lisa.anderson@example.com', image: '/images/placeholder.jpg', role: 'CUSTOMER', createdAt: new Date('2023-09-05') },
  { id: 'usr-004', name: 'Mark Taylor', email: 'mark.taylor@example.com', image: '/images/placeholder.jpg', role: 'AGENT', createdAt: new Date('2023-08-30') },
  { id: 'usr-005', name: 'Anna Martinez', email: 'anna.martinez@example.com', image: '/images/placeholder.jpg', role: 'ADMIN', createdAt: new Date('2023-08-25') },
];

// Component for user role badge
function UserRoleBadge({ role }: { role: string }) {
  const roleStyles = {
    admin: 'bg-purple-100 text-purple-800',
    vendor: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
    agent: 'bg-yellow-100 text-yellow-800',
  };
  
  const role_key = role.toLowerCase() as keyof typeof roleStyles;
  const style = roleStyles[role_key] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {role}
    </span>
  );
}

// Component for user status badge
function UserStatusBadge({ status }: { status: string }) {
  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  
  const status_key = status.toLowerCase() as keyof typeof statusStyles;
  const style = statusStyles[status_key] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

// User type badge component
function UserTypeBadge({ type }: { type: string }) {
  const typeStyles = {
    admin: 'bg-purple-100 text-purple-800',
    vendor: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
    agent: 'bg-yellow-100 text-yellow-800',
  };
  
  const type_key = type.toLowerCase() as keyof typeof typeStyles;
  const style = typeStyles[type_key] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {type}
    </span>
  );
}

// Update type for users array to match mock data
interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  role: string;
  createdAt: Date;
}

export default async function UserManagementPage({ 
  searchParams 
}: { 
  searchParams: { page?: string, query?: string, role?: string } 
}) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  const searchQuery = searchParams.query || '';
  const roleFilter = searchParams.role || '';

  // Build the where clause for filtering
  const where: any = {};
  
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { email: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }
  
  if (roleFilter) {
    where.role = roleFilter;
  }
  
  // Count total users for pagination
  const totalUsers = mockUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  
  // Fetch users with pagination
  const users = mockUsers.slice(skip, skip + pageSize);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage all users in the system</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>
      
      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-9"
                defaultValue={searchQuery}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zervia-100"></div>
                      <span>{user.name || 'Anonymous'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                  <TableCell>
                    <UserTypeBadge type={user.role} />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* Email verification status removed as it's not in the User interface */}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit user</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-52 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-gray-500">No users found</p>
                      <p className="text-sm text-gray-400">
                        Try adjusting your search or filter to find what you're looking for.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center p-4">
              <Pagination>
                <PaginationContent>
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href={`/admin/users?page=${page - 1}&query=${searchQuery}&role=${roleFilter}`} />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNumber = i + 1;
                    // Only show current page, first, last, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= page - 1 && pageNumber <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href={`/admin/users?page=${pageNumber}&query=${searchQuery}&role=${roleFilter}`}
                            isActive={pageNumber === page}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Show ellipsis for gaps
                    if (
                      (pageNumber === 2 && page > 3) ||
                      (pageNumber === totalPages - 1 && page < totalPages - 2)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  })}
                  
                  {page < totalPages && (
                    <PaginationItem>
                      <PaginationNext href={`/admin/users?page=${page + 1}&query=${searchQuery}&role=${roleFilter}`} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 