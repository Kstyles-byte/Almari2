import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold text-center">Terms & Conditions</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. Introduction</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Welcome to Zervia E-commerce Platform. These Terms & Conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2. User Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            You must create an account to use certain features of our platform. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3. Use of Our Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            You agree to use our platform only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the platform.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            Zervia E-commerce Platform will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">5. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            We reserve the right to modify these Terms & Conditions at any time. We will notify you of any changes by posting the new terms on this page. Your continued use of the platform after such changes constitutes your acceptance of the new terms.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">6. Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            If you have any questions about these Terms & Conditions, please contact us at support@zervia.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 