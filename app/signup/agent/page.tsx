import { AgentSignUpForm } from '@/components/forms/AgentSignUpForm';
import React from 'react';

export const metadata = {
  title: 'Agent Sign Up | Zervia',
  description: 'Create an agent account to manage order pickups on Zervia.',
};

export default function AgentSignUpPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <AgentSignUpForm />
    </div>
  );
} 