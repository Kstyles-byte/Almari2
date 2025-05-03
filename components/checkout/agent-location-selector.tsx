'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, AlertCircle } from 'lucide-react';
import type { Tables } from '@/types/supabase';
import { Button } from '../ui/button';

// Use Supabase Agent type directly
type Agent = Tables<'Agent'>;

interface AgentLocationSelectorProps {
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onNext: () => void;
  onBack: () => void;
  error?: string | null;
}

export function AgentLocationSelector({ 
  agents, 
  selectedAgentId, 
  onSelectAgent, 
  onNext,
  onBack, 
  error
}: AgentLocationSelectorProps) {
  const [localSelectedId, setLocalSelectedId] = useState(selectedAgentId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // If parent component updates selectedAgentId, update local state
  useEffect(() => {
    setLocalSelectedId(selectedAgentId);
  }, [selectedAgentId]);
  
  // Log when component initially renders
  useEffect(() => {
    console.log('AgentLocationSelector - Mounted with', {
      agentCount: agents.length,
      selectedId: selectedAgentId
    });
  }, []);
  
  // Handle local selection
  const handleSelect = (agentId: string) => {
    console.log('AgentLocationSelector - Selected agent:', agentId);
    setLocalSelectedId(agentId);
    onSelectAgent(agentId);
  };
  
  // Handle continue button click
  const handleContinue = () => {
    if (!localSelectedId || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('AgentLocationSelector - Continuing with agent:', localSelectedId);
      onNext();
    } catch (error) {
      console.error('AgentLocationSelector - Error during next step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Empty state fallback
  if (agents.length === 0 && !error) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Select Pickup Location</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <MapPin className="h-12 w-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Pickup Locations Available</h3>
            <p className="text-sm max-w-md mx-auto mb-6">
              We couldn't find any pickup locations at this time. Please try again later or contact support.
            </p>
            <Button variant="outline" onClick={onBack}>
              Back to Information
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state fallback
  if (error) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Select Pickup Location</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Unable to Load Locations</h3>
            <p className="text-sm max-w-md mx-auto mb-2">
              {error || "We encountered a problem loading pickup locations."}
            </p>
            <p className="text-sm max-w-md mx-auto mb-6">
              Please try again or contact support if the problem persists.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main component with agent options
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Select Pickup Location</CardTitle>
        <p className="text-sm text-gray-500">Choose an agent location where you'll pick up your order</p>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={localSelectedId} 
          onValueChange={handleSelect}
          className="space-y-3"
        >
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className={`border rounded-lg p-4 transition-colors ${
                localSelectedId === agent.id ? 'border-zervia-600 bg-zervia-50' : 'border-gray-200'
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
                  <MapPin className={`h-5 w-5 ${localSelectedId === agent.id ? 'text-zervia-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {agent.address_line1}
                    {agent.address_line2 ? `, ${agent.address_line2}` : ''}
                    {agent.city && agent.state_province ? `, ${agent.city}, ${agent.state_province}` : ''}
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
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!localSelectedId || isSubmitting}
            className={!localSelectedId ? 'bg-gray-400 cursor-not-allowed' : ''}
          >
            {isSubmitting ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 