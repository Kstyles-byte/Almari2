'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface EnvVariable {
  key: string;
  value: string;
  isEditing?: boolean;
  showValue?: boolean;
}

interface SettingsClientProps {
  initialEnvVars: Record<string, string>;
}

export function SettingsClient({ initialEnvVars }: SettingsClientProps) {
  const [envVars, setEnvVars] = useState<EnvVariable[]>(
    Object.entries(initialEnvVars).map(([key, value]) => ({
      key,
      value,
      isEditing: false,
      showValue: false,
    }))
  );

  const toggleVisibility = (index: number) => {
    setEnvVars(vars => vars.map((v, i) => 
      i === index ? { ...v, showValue: !v.showValue } : v
    ));
  };

  const startEditing = (index: number) => {
    setEnvVars(vars => vars.map((v, i) => 
      i === index ? { ...v, isEditing: true, showValue: true } : v
    ));
  };

  const cancelEditing = (index: number) => {
    setEnvVars(vars => vars.map((v, i) => 
      i === index ? { ...v, isEditing: false } : v
    ));
  };

  const saveEdit = (index: number, newValue: string) => {
    setEnvVars(vars => vars.map((v, i) => 
      i === index ? { ...v, value: newValue, isEditing: false } : v
    ));
    
    // Note: In a real application, you'd need to call an API to update environment variables
    // This is just for demonstration as environment variables can't be changed at runtime
    toast.info('Note: Environment variables cannot be changed at runtime. This is for display purposes only.');
  };

  const handleValueChange = (index: number, newValue: string) => {
    setEnvVars(vars => vars.map((v, i) => 
      i === index ? { ...v, value: newValue } : v
    ));
  };

  const getValueDisplay = (envVar: EnvVariable) => {
    if (envVar.value === 'MISSING') {
      return <span className="text-red-700 font-medium">MISSING</span>;
    }
    
    if (envVar.showValue) {
      return (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {envVar.value}
        </span>
      );
    }
    
    return (
      <span className="text-green-700 font-medium">
        SET ({envVar.value.length} characters)
      </span>
    );
  };

  return (
    <section className="bg-white p-6 rounded-md shadow border">
      <h2 className="text-xl font-medium mb-4">Environment Variables</h2>
      <div className="space-y-4">
        {envVars.map((envVar, index) => (
          <div key={envVar.key} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-gray-700 font-medium">{envVar.key}</h3>
              <div className="flex items-center gap-2">
                {envVar.value !== 'MISSING' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleVisibility(index)}
                    title={envVar.showValue ? 'Hide value' : 'Show value'}
                  >
                    {envVar.showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
                {!envVar.isEditing ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(index)}
                    title="Edit value"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => saveEdit(index, envVar.value)}
                      title="Save changes"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelEditing(index)}
                      title="Cancel editing"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {envVar.isEditing ? (
                <Input
                  value={envVar.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  className="font-mono text-sm"
                  placeholder="Enter environment variable value"
                />
              ) : (
                getValueDisplay(envVar)
              )}
            </div>
            
            {envVar.key === 'PAYSTACK_PUBLIC_KEY' && (
              <p className="text-xs text-gray-500 mt-1">
                Paystack public key for client-side payment processing
              </p>
            )}
            {envVar.key === 'PAYSTACK_SECRET_KEY' && (
              <p className="text-xs text-gray-500 mt-1">
                Paystack secret key for server-side payment operations (keep secure)
              </p>
            )}
            {envVar.key === 'PAYSTACK_WEBHOOK_SECRET' && (
              <p className="text-xs text-gray-500 mt-1">
                Paystack webhook secret for verifying payment notifications
              </p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Environment variables shown here are for diagnostic purposes. 
          Actual changes to environment variables require redeployment and should be done through 
          your hosting platform's environment configuration.
        </p>
      </div>
    </section>
  );
}
