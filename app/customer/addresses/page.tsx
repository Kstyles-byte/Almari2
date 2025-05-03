import { getUserAddresses } from '@/actions/profile';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { AddAddressButton } from '@/components/customer/add-address-button';
import EditAddressPanel from '@/components/customer/edit-address-panel';

export const metadata = {
  title: 'My Addresses | Zervia',
  description: 'Manage your saved addresses',
};

export default async function CustomerAddressesPage() {
  // Fetch user addresses
  const { addresses = [], error } = await getUserAddresses();
  
  // No longer map addresses here, pass the raw data to the client component
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zervia-900">My Addresses</h1>
        <AddAddressButton />
      </div>
      
      {error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-zervia-500">{error}</p>
          </CardContent>
        </Card>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <MapPin className="h-12 w-12 mx-auto text-zervia-200 mb-3" />
            <p className="text-zervia-500">You haven't added any addresses yet</p>
            <div className="mt-4">
              <AddAddressButton variant="default" />
            </div>
          </CardContent>
        </Card>
      ) : (
        // Pass raw addresses data to the client panel
        <EditAddressPanel addresses={addresses} />
      )}
    </div>
  );
} 