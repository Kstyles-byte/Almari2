'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, TestTube, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getPaystackSettings, updatePaystackSettings, testPaystackConnection } from '@/actions/paystack-settings';

interface PaystackSettings {
  secret_key?: string;
  public_key?: string;
  webhook_secret?: string;
  is_live?: boolean;
}

export function PaystackSettings() {
  const [settings, setSettings] = useState<PaystackSettings>({});
  const [originalSettings, setOriginalSettings] = useState<PaystackSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    secret_key: false,
    public_key: false,
    webhook_secret: false,
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await getPaystackSettings();
      
      if (result.success) {
        const settingsData = result.data || {};
        setSettings(settingsData);
        setOriginalSettings(settingsData);
      } else {
        toast.error(result.error || 'Failed to load settings');
      }
    } catch (error) {
      toast.error('Failed to load Paystack settings');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await updatePaystackSettings(settings);
      
      if (result.success) {
        toast.success('Paystack settings updated successfully!');
        setOriginalSettings(settings);
      } else {
        toast.error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings.secret_key) {
      toast.error('Please enter a secret key to test');
      return;
    }

    try {
      setTesting(true);
      const result = await testPaystackConnection(settings.secret_key);
      
      if (result.success) {
        toast.success('Paystack connection test successful!');
      } else {
        toast.error(result.error || 'Connection test failed');
      }
    } catch (error) {
      toast.error('Connection test failed');
      console.error('Error testing connection:', error);
    } finally {
      setTesting(false);
    }
  };

  const toggleVisibility = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const renderSecretField = (
    field: keyof PaystackSettings,
    label: string,
    description: string,
    placeholder: string
  ) => {
    const fieldKey = field as keyof typeof showSecrets;
    return (
      <div className="space-y-2">
        <Label htmlFor={field}>{label}</Label>
        <div className="relative">
          <Input
            id={field}
            type={showSecrets[fieldKey] ? "text" : "password"}
            value={settings[field] || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, [field]: e.target.value }))}
            placeholder={placeholder}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => toggleVisibility(fieldKey)}
          >
            {showSecrets[fieldKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-md shadow border">
        <h2 className="text-xl font-medium mb-4">Paystack Settings</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-md shadow border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Paystack Settings</h2>
        <div className="flex items-center space-x-2">
          <Label htmlFor="is_live" className="text-sm">
            {settings.is_live ? 'Live Mode' : 'Test Mode'}
          </Label>
          <Switch
            id="is_live"
            checked={settings.is_live || false}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_live: checked }))}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Changes to these settings will affect all payment processing immediately. 
              Use the test button to verify your keys before saving.
            </p>
          </div>
        </div>

        {renderSecretField(
          'public_key',
          'Public Key',
          'Your Paystack public key (used for client-side operations)',
          'pk_test_... or pk_live_...'
        )}

        {renderSecretField(
          'secret_key',
          'Secret Key',
          'Your Paystack secret key (used for server-side operations)',
          'sk_test_... or sk_live_...'
        )}

        {renderSecretField(
          'webhook_secret',
          'Webhook Secret',
          'Your Paystack webhook secret for verifying webhook signatures',
          'Your webhook secret'
        )}

        <div className="flex items-center space-x-4 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !settings.secret_key}
            className="flex items-center space-x-2"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Testing...</span>
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4" />
                <span>Test Connection</span>
              </>
            )}
          </Button>

          {hasChanges && (
            <Button
              variant="ghost"
              onClick={() => {
                setSettings(originalSettings);
                toast.info('Changes discarded');
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Discard Changes
            </Button>
          )}
        </div>

        {hasChanges && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Don't forget to save your settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}