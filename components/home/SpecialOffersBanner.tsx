import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { getActiveSpecialOffer } from '@/lib/services/content';
import { SpecialOffer } from '@/types/content';

function getTimeParts(endDate: string | null) {
  if (!endDate) {
    return { days: '00', hours: '00', minutes: '00' };
  }

  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.max(end - now, 0);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return { days: pad(days), hours: pad(hours), minutes: pad(minutes) };
}

const SpecialOffersBanner = async () => {
  const offer = (await getActiveSpecialOffer()) as SpecialOffer | null;

  // If there's no active offer, render nothing (banner hidden)
  if (!offer) return null;

  const { days, hours, minutes } = getTimeParts(offer.endDate);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-to-r from-zervia-800 to-zervia-600 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url("/images/pattern-bg.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="grid md:grid-cols-2 gap-8 items-center p-8 md:p-12">
            {/* Offer Text */}
            <div className="text-white space-y-4">
              {/* Badge */}
              <div className="inline-block px-4 py-1.5 bg-white/20 text-white rounded-full font-medium text-sm mb-2">
                Limited Time Only
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold">{offer.title}</h2>

              {/* Subtitle & Discount */}
              {offer.subtitle && (
                <p className="opacity-90 text-lg">
                  {offer.subtitle}
                  {offer.discountCode && (
                    <>
                      {" with code "}
                      <span className="font-bold">{offer.discountCode}</span>
                      .
                    </>
                  )}
                </p>
              )}

              {/* CTA */}
              {offer.buttonText && (
                <div className="pt-2">
                  <Button
                    asChild
                    size="lg"
                    variant="default"
                    className="bg-white text-zervia-800 hover:bg-zervia-50"
                  >
                    <Link href={offer.buttonLink || '/products'}>
                      {offer.buttonText} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="flex justify-center md:justify-end">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4">Offer Ends In</h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="bg-white/20 w-16 h-16 flex items-center justify-center rounded-lg text-3xl font-bold">
                        {days}
                      </div>
                      <span className="text-sm mt-1 opacity-90">Days</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-white/20 w-16 h-16 flex items-center justify-center rounded-lg text-3xl font-bold">
                        {hours}
                      </div>
                      <span className="text-sm mt-1 opacity-90">Hours</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-white/20 w-16 h-16 flex items-center justify-center rounded-lg text-3xl font-bold">
                        {minutes}
                      </div>
                      <span className="text-sm mt-1 opacity-90">Minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffersBanner; 