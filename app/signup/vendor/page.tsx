import { VendorSignUpForm } from "@/components/forms/VendorSignUpForm";
import React from "react";

// This page is for users who are not logged in and want to sign up directly as vendors.

export default function VendorSignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
       {/* Consider adding messages from URL params if needed (e.g., for errors from server action redirect) */}
       {/* searchParams?.message && (...) */}
      <VendorSignUpForm />
    </div>
  );
} 