'use client';

interface Props {
  orders?: any[];
}

export function PendingPickups({ orders = [] }: Props) {
  return (
    <div className="bg-white p-4 rounded-md shadow">
      <h3 className="font-medium mb-2">Pending Pickups</h3>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">No pending pickups.</p>
      ) : (
        <ul className="divide-y">
          {orders.map((o) => (
            <li key={o.id} className="py-2 text-sm">
              Order #{o.id.substring(0, 6)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 