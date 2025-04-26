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
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Layout,
  Image as ImageIcon,
  FileText,
  Globe,
  Tag
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
import { formatDate } from '@/lib/mockUtils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

// Component for content type badge
function ContentTypeBadge({ type }: { type: string }) {
  const typeMap: Record<string, { icon: React.ReactNode, className: string }> = {
    'BANNER': { 
      icon: <Layout className="mr-1 h-3 w-3" />, 
      className: 'bg-purple-100 text-purple-800' 
    },
    'CAROUSEL': { 
      icon: <ImageIcon className="mr-1 h-3 w-3" />, 
      className: 'bg-indigo-100 text-indigo-800' 
    },
    'ARTICLE': { 
      icon: <FileText className="mr-1 h-3 w-3" />, 
      className: 'bg-blue-100 text-blue-800' 
    },
    'PAGE': { 
      icon: <Globe className="mr-1 h-3 w-3" />, 
      className: 'bg-green-100 text-green-800' 
    },
    'TAG': { 
      icon: <Tag className="mr-1 h-3 w-3" />, 
      className: 'bg-yellow-100 text-yellow-800' 
    },
  };
  
  const typeData = typeMap[type] || { 
    icon: <Layout className="mr-1 h-3 w-3" />, 
    className: 'bg-gray-100 text-gray-800' 
  };
  
  return (
    <Badge 
      variant="outline" 
      className={`flex items-center ${typeData.className} border-0`}
    >
      {typeData.icon}
      {type}
    </Badge>
  );
}

// Mock data for content
const mockContent = [
  { id: 'cont-001', title: 'Welcome to Zervia', type: 'Page', status: 'Published', updatedAt: new Date('2023-09-15') },
  { id: 'cont-002', title: 'Summer Sale Announcement', type: 'Blog Post', status: 'Published', updatedAt: new Date('2023-09-10') },
  { id: 'cont-003', title: 'Return Policy', type: 'Page', status: 'Draft', updatedAt: new Date('2023-09-05') },
  { id: 'cont-004', title: 'How to Choose the Right Size', type: 'Guide', status: 'Published', updatedAt: new Date('2023-08-30') },
  { id: 'cont-005', title: 'Winter Collection Preview', type: 'Blog Post', status: 'Draft', updatedAt: new Date('2023-08-25') },
];

export default async function AdminContentPage() {
  // Using mock data instead of database calls
  const content = mockContent;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Content</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Content
        </Button>
      </div>
      
      <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search content..."
          className="border-none focus:ring-0"
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item: { id: string; title: string; type: string; status: string; updatedAt: Date }) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
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
          {content.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No content found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 