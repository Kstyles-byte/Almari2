import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, Clock, ShieldCheck, Users } from 'lucide-react';
import { Button } from '../ui/button';

// Mock agent locations data
const agentLocations = [
  {
    id: 1,
    name: "Student Union Building",
    description: "Main floor, next to the cafeteria",
    image: "/images/locations/location-1.jpg",
    hours: "Mon-Fri: 9am-6pm, Sat: 10am-4pm",
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  {
    id: 2,
    name: "Science Complex",
    description: "Building A, ground floor lobby",
    image: "/images/locations/location-2.jpg",
    hours: "Mon-Fri: 8am-5pm, Closed weekends",
    coordinates: { lat: 40.7138, lng: -74.0070 },
  },
  {
    id: 3,
    name: "Residence Hall West",
    description: "Main entrance security desk",
    image: "/images/locations/location-3.jpg",
    hours: "7 days a week: 8am-10pm",
    coordinates: { lat: 40.7148, lng: -74.0080 },
  },
];

const AgentPickupSection = () => {
  return (
    <section className="py-16 bg-zervia-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-4 py-1.5 bg-zervia-100 text-zervia-700 rounded-full font-medium text-sm mb-4">
              Agent-Based Delivery
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-zervia-900 mb-4">
              Convenient Pickup Locations on Campus
            </h2>
            <p className="text-lg text-zervia-700 mb-6">
              Forget about shipping delays and delivery fees. With our agent-based pickup system, 
              your orders are available at convenient locations right on campus.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-zervia-100 flex items-center justify-center mt-1 flex-shrink-0">
                  <Clock className="h-5 w-5 text-zervia-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-zervia-900 text-lg">Flexible Pickup Hours</h3>
                  <p className="text-zervia-600">
                    Extended hours to accommodate your busy class schedule.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-zervia-100 flex items-center justify-center mt-1 flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-zervia-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-zervia-900 text-lg">Secure Handoff</h3>
                  <p className="text-zervia-600">
                    Verified pickup process with unique codes for each order.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-zervia-100 flex items-center justify-center mt-1 flex-shrink-0">
                  <Users className="h-5 w-5 text-zervia-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-zervia-900 text-lg">Trained Campus Agents</h3>
                  <p className="text-zervia-600">
                    Our agents are fellow students trained to assist with pickups and returns.
                  </p>
                </div>
              </div>
            </div>
            
            <Button asChild size="lg">
              <Link href="/locations">
                View All Locations <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <div className="space-y-4">
            {agentLocations.map((location) => (
              <div 
                key={location.id} 
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-48 sm:h-auto sm:w-1/3 overflow-hidden">
                    <Image
                      src={location.image}
                      alt={location.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 sm:w-2/3">
                    <h3 className="font-medium text-lg text-zervia-900 mb-2">
                      {location.name}
                    </h3>
                    <p className="text-zervia-600 text-sm mb-3">
                      {location.description}
                    </p>
                    <div className="flex items-center text-zervia-500 text-sm mb-3">
                      <Clock className="h-4 w-4 mr-2" />
                      {location.hours}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-zervia-600 text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        <Link href={`/locations/${location.id}`}>
                          <span className="hover:text-zervia-700 underline">View on Map</span>
                        </Link>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/locations/${location.id}`}>
                          More Info
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentPickupSection; 