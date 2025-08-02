import { getOrderById } from '@/actions/orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';

export default async function OrderTrackingPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const { order, error } = await getOrderById(params.id);

  if (error || !order) {
    return notFound();
  }

  const trackingEvents = order.trackingEvents || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zervia-900">Track Order</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-zervia-500" /> Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {trackingEvents.map((event: any, idx: number) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="pt-1">
                  <span className="block h-2 w-2 rounded-full bg-zervia-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zervia-900">{event.status}</p>
                  <p className="text-xs text-zervia-500">
                    {format(new Date(event.timestamp), 'MMM d, yyyy - h:mm a')}
                  </p>
                  <p className="text-sm text-zervia-700 mt-1">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 