import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  location: string;
  address: string;
  timing: string;
}

interface AgentLocationSelectorProps {
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

export function AgentLocationSelector({ 
  agents, 
  selectedAgentId, 
  onSelectAgent 
}: AgentLocationSelectorProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Select Pickup Location</CardTitle>
        <p className="text-sm text-gray-500">Choose an agent location where you'll pick up your order</p>
      </CardHeader>
      <CardContent>
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
                  <p className="text-sm text-gray-600">{agent.location}</p>
                  <p className="text-sm text-gray-500 mt-1">{agent.address}</p>
                  <p className="text-xs text-gray-400 mt-1">Hours: {agent.timing}</p>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
} 