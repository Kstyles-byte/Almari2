import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin } from 'lucide-react';
import type { Tables } from '@/types/supabase'; // Import Supabase types
import { Button } from '../ui/button'; // Import Button

// Use Supabase Agent type directly
type Agent = Tables<'Agent'>;

interface AgentLocationSelectorProps {
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onNext: () => void; // Add onNext prop
  onBack: () => void; // Add onBack prop
  error?: string | null; // Add optional error prop
}

export function AgentLocationSelector({ 
  agents, 
  selectedAgentId, 
  onSelectAgent, 
  onNext, // Destructure props
  onBack, 
  error // Destructure error prop
}: AgentLocationSelectorProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Select Pickup Location</CardTitle>
        <p className="text-sm text-gray-500">Choose an agent location where you'll pick up your order</p>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-red-500 mb-4">Error loading locations: {error}</p>
        )}
        {agents.length === 0 && !error && (
           <p className="text-sm text-gray-500 mb-4">No pickup locations currently available.</p>
        )}
        <RadioGroup 
          value={selectedAgentId} 
          onValueChange={onSelectAgent} 
          className="space-y-3"
        >
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className={`border rounded-lg p-4 transition-colors ${
                selectedAgentId === agent.id ? 'border-zervia-600 bg-zervia-50' : 'border-gray-200'
              }`}
            >
              <RadioGroupItem 
                value={agent.id} 
                id={`agent-${agent.id}`} 
                className="sr-only" 
              />
              <Label 
                htmlFor={`agent-${agent.id}`}
                className="flex items-start cursor-pointer"
              >
                <div className="mr-4 mt-1">
                  <MapPin className={`h-5 w-5 ${selectedAgentId === agent.id ? 'text-zervia-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {agent.address_line1}
                    {agent.address_line2 ? `, ${agent.address_line2}` : ''}
                    , {agent.city}, {agent.state_province}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Hours: {agent.operating_hours || 'Not specified'}</p>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        <div className="flex justify-between mt-6 pt-6 border-t">
           <Button 
             variant="outline"
             onClick={onBack}
           >
             Back
           </Button>
           <Button 
             onClick={onNext}
             disabled={!selectedAgentId || agents.length === 0}
             className={!selectedAgentId || agents.length === 0 ? 'bg-gray-400 cursor-not-allowed' : ''}
           >
             Continue to Payment
           </Button>
         </div>
      </CardContent>
    </Card>
  );
} 