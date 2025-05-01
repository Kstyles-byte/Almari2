import { VendorApplicationForm } from "@/components/forms/VendorApplicationForm";
import React from "react";

// We assume this route is protected by middleware or a layout
// that ensures only logged-in users can access it.

export default function BecomeVendorPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      {/* Optional: Add a title or breadcrumbs above the form */}
      {/* <h1 className="text-3xl font-bold mb-8 text-center">Become a Vendor</h1> */}
      <VendorApplicationForm />
    </div>
  );
} 