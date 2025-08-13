import Link from 'next/link';
import { Bell, User, Shield, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerSettingsPage() {
  const settingsSections = [
    {
      title: 'Notifications',
      description: 'Manage your notification preferences and alerts',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Profile',
      description: 'Update your personal information and preferences',
      icon: User,
      href: '/customer/profile',
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Addresses',
      description: 'Manage your shipping and billing addresses',
      icon: CreditCard,
      href: '/customer/addresses',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'Security',
      description: 'Password and account security settings',
      icon: Shield,
      href: '/customer/security',
      color: 'text-red-600 bg-red-100',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${section.color}`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
