'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus } from 'lucide-react';

// Mock data for agents - defined directly in component
const mockAgents = [
  { id: 'agent-001', name: 'Agent Smith', email: 'agent.smith@example.com', role: 'Support', status: 'Active', createdAt: new Date('2023-07-15') },
  { id: 'agent-002', name: 'Agent Johnson', email: 'agent.johnson@example.com', role: 'Sales', status: 'Active', createdAt: new Date('2023-07-20') },
  { id: 'agent-003', name: 'Agent Brown', email: 'agent.brown@example.com', role: 'Support', status: 'Inactive', createdAt: new Date('2023-08-01') },
];

// Format date within the component
function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export default function AdminAgentsPage() {
  // Using React.useState for any client-side state management
  const [agents] = React.useState(mockAgents);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>
      
      <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search agents..."
          className="border-none focus:ring-0"
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>{agent.role}</TableCell>
                  <TableCell>{agent.status}</TableCell>
                  <TableCell>{formatDate(agent.createdAt)}</TableCell>
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
          {agents.length === 0 && (
            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <p className="text-gray-500">No agents found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 