"use client";

import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash, 
  Plus, 
  UserCheck, 
  UserX, 
  Loader2,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Define the Agent interface
interface Agent {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  address_line1: string;
  operating_hours: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Mock function to fetch agents - to be replaced with actual API call
async function fetchAgents(): Promise<Agent[]> {
  // In production, this would call the actual service
  // For now, return mock data
  return [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone_number: '08012345678',
      address_line1: 'Campus Gate, Ikeja',
      operating_hours: '9AM - 5PM',
      capacity: 20,
      is_active: true,
      created_at: '2023-05-01T10:00:00Z',
      updated_at: '2023-06-15T14:30:00Z'
    },
    {
      id: '2',
      name: 'Mary Johnson',
      email: 'mary.johnson@example.com',
      phone_number: '08087654321',
      address_line1: 'Student Union Building, Lagos',
      operating_hours: '10AM - 6PM',
      capacity: 15,
      is_active: true,
      created_at: '2023-05-05T11:00:00Z',
      updated_at: '2023-06-20T09:15:00Z'
    },
    {
      id: '3',
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      phone_number: '08023456789',
      address_line1: 'Faculty of Science, Abuja',
      operating_hours: '9AM - 4PM',
      capacity: 10,
      is_active: false,
      created_at: '2023-06-10T09:30:00Z',
      updated_at: '2023-07-01T16:45:00Z'
    }
  ];
}

// Mock function for creating a new agent
async function createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> {
  // In production, this would call the actual service
  // For now, return mock data with generated ID
  return {
    ...agent,
    id: Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Mock function for updating an agent
async function updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
  // In production, this would call the actual service
  // For now, return mock data
  return {
    ...agent,
    id,
    updated_at: new Date().toISOString()
  } as Agent;
}

// Mock function for deleting an agent
async function deleteAgent(id: string): Promise<boolean> {
  // In production, this would call the actual service
  // For now, just return success
  return true;
}

export function AgentManagementUI() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    address_line1: '',
    operating_hours: '',
    capacity: 10,
    is_active: true
  });

  // Load agents on component mount
  useEffect(() => {
    loadAgents();
  }, []);

  // Filter agents based on search term
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.address_line1.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load agents function
  async function loadAgents() {
    try {
      setLoading(true);
      const data = await fetchAgents();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast.error('Failed to load agents. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle input change in form
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Handle number input change
  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  }

  // Handle switch change
  function handleSwitchChange(checked: boolean) {
    setFormData(prev => ({ ...prev, is_active: checked }));
  }

  // Reset form data
  function resetForm() {
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      address_line1: '',
      operating_hours: '',
      capacity: 10,
      is_active: true
    });
  }

  // Open add dialog
  function openAddDialog() {
    resetForm();
    setShowAddDialog(true);
  }

  // Open edit dialog
  function openEditDialog(agent: Agent) {
    setCurrentAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      phone_number: agent.phone_number,
      address_line1: agent.address_line1,
      operating_hours: agent.operating_hours,
      capacity: agent.capacity,
      is_active: agent.is_active
    });
    setShowEditDialog(true);
  }

  // Open delete dialog
  function openDeleteDialog(agent: Agent) {
    setCurrentAgent(agent);
    setShowDeleteDialog(true);
  }

  // Handle agent creation
  async function handleAddAgent() {
    try {
      setLoading(true);
      const newAgent = await createAgent(formData);
      setAgents(prev => [...prev, newAgent]);
      setShowAddDialog(false);
      resetForm();
      toast.success('Agent added successfully');
    } catch (error) {
      console.error('Failed to add agent:', error);
      toast.error('Failed to add agent. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle agent update
  async function handleUpdateAgent() {
    if (!currentAgent) return;

    try {
      setLoading(true);
      const updatedAgent = await updateAgent(currentAgent.id, formData);
      setAgents(prev => prev.map(agent => agent.id === currentAgent.id ? { ...agent, ...updatedAgent } : agent));
      setShowEditDialog(false);
      setCurrentAgent(null);
      resetForm();
      toast.success('Agent updated successfully');
    } catch (error) {
      console.error('Failed to update agent:', error);
      toast.error('Failed to update agent. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle agent deletion
  async function handleDeleteAgent() {
    if (!currentAgent) return;

    try {
      setLoading(true);
      const success = await deleteAgent(currentAgent.id);
      if (success) {
        setAgents(prev => prev.filter(agent => agent.id !== currentAgent.id));
        setShowDeleteDialog(false);
        setCurrentAgent(null);
        toast.success('Agent deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast.error('Failed to delete agent. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Toggle agent active status
  async function toggleAgentStatus(agent: Agent) {
    try {
      const updatedStatus = !agent.is_active;
      const updatedAgent = await updateAgent(agent.id, { is_active: updatedStatus });
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, is_active: updatedStatus } : a));
      toast.success(`Agent ${updatedStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to update agent status:', error);
      toast.error('Failed to update agent status. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search agents..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openAddDialog} className="flex items-center gap-2 bg-zervia-600 hover:bg-zervia-700">
          <Plus className="h-4 w-4" />
          Add New Agent
        </Button>
      </div>

      {/* Agents list table */}
      <Card className="overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-zervia-600 mr-2" />
                      <span>Loading agents...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No agents found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{agent.email}</TableCell>
                    <TableCell>{agent.phone_number}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{agent.address_line1}</TableCell>
                    <TableCell>{agent.operating_hours}</TableCell>
                    <TableCell>{agent.capacity}</TableCell>
                    <TableCell>
                      <Badge variant={agent.is_active ? "success" : "secondary"}>
                        {agent.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => toggleAgentStatus(agent)}
                          title={agent.is_active ? "Deactivate Agent" : "Activate Agent"}
                        >
                          {agent.is_active ? (
                            <UserX className="h-4 w-4 text-gray-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-zervia-500" />
                          )}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => openEditDialog(agent)}
                          title="Edit Agent"
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => openDeleteDialog(agent)}
                          title="Delete Agent"
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Agent Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Agent's full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="agent@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="080xxxxxxxx"
                />
              </div>
              <div>
                <Label htmlFor="address_line1">Location Address</Label>
                <Textarea
                  id="address_line1"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="Detailed location address"
                  className="resize-none"
                />
              </div>
              <div>
                <Label htmlFor="operating_hours">Operating Hours</Label>
                <Input
                  id="operating_hours"
                  name="operating_hours"
                  value={formData.operating_hours}
                  onChange={handleInputChange}
                  placeholder="e.g. 9AM - 5PM"
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity (orders per day)</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={handleNumberChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active Status</Label>
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={handleSwitchChange} 
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddAgent} 
              className="bg-zervia-600 hover:bg-zervia-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Agent'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Agent's full name"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="agent@example.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone_number">Phone Number</Label>
                <Input
                  id="edit-phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="080xxxxxxxx"
                />
              </div>
              <div>
                <Label htmlFor="edit-address_line1">Location Address</Label>
                <Textarea
                  id="edit-address_line1"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="Detailed location address"
                  className="resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-operating_hours">Operating Hours</Label>
                <Input
                  id="edit-operating_hours"
                  name="operating_hours"
                  value={formData.operating_hours}
                  onChange={handleInputChange}
                  placeholder="e.g. 9AM - 5PM"
                />
              </div>
              <div>
                <Label htmlFor="edit-capacity">Capacity (orders per day)</Label>
                <Input
                  id="edit-capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={handleNumberChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-is_active">Active Status</Label>
                <Switch 
                  id="edit-is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={handleSwitchChange} 
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAgent} 
              className="bg-zervia-600 hover:bg-zervia-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Agent'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the agent {currentAgent?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAgent}
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
