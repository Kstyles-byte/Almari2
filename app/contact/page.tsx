import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  MessageSquare,
  HelpCircle,
  ShoppingBag,
  UserCog
} from 'lucide-react';

export const metadata = {
  title: 'Contact Us | Zervia',
  description: 'Get in touch with the Zervia team for support, inquiries, or feedback.',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Contact Us</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            We're here to help. Get in touch with the Zervia team.
          </p>
        </div>
        
        {/* Main Contact Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input id="name" placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="Your email address" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input id="subject" placeholder="What is this regarding?" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-zervia-100 p-2 text-zervia-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Address</h3>
                    <p className="text-sm text-muted-foreground">
                      University Campus, Tech Hub Building<br />
                      123 Campus Way, Lagos, Nigeria
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-zervia-100 p-2 text-zervia-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-sm text-muted-foreground">
                      +234 (0) 123 456 7890
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-zervia-100 p-2 text-zervia-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="text-sm text-muted-foreground">
                      contact@zervia.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-zervia-100 p-2 text-zervia-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Operating Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 9:00 AM - 5:00 PM<br />
                      Saturday: 10:00 AM - 2:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Help Categories */}
        <div className="space-y-4">
          <h2 className="text-center text-2xl font-bold">How Can We Help You?</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zervia-100">
                  <MessageSquare className="h-6 w-6 text-zervia-600" />
                </div>
                <CardTitle className="mb-2 text-xl">General Inquiries</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Questions about Zervia or our services
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zervia-100">
                  <HelpCircle className="h-6 w-6 text-zervia-600" />
                </div>
                <CardTitle className="mb-2 text-xl">Customer Support</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Help with orders, returns, or account issues
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zervia-100">
                  <ShoppingBag className="h-6 w-6 text-zervia-600" />
                </div>
                <CardTitle className="mb-2 text-xl">Vendor Relations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Information for current or prospective vendors
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zervia-100">
                  <UserCog className="h-6 w-6 text-zervia-600" />
                </div>
                <CardTitle className="mb-2 text-xl">Agent Program</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Learn about becoming a campus agent
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Map or Campus Locations */}
        <div className="space-y-4">
          <h2 className="text-center text-2xl font-bold">Our Campus Locations</h2>
          <p className="text-center text-muted-foreground">
            Zervia operates at multiple campus locations across Nigeria
          </p>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Campus Map Placeholder</p>
              {/* In a real implementation, you would add a Google Maps or other map service here */}
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="rounded-lg bg-zervia-50 p-8 text-center">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Can't find the answer you're looking for? Check out our comprehensive FAQ section
            for answers to common questions about orders, returns, and more.
          </p>
          <div className="mt-6">
            <Button asChild>
              <a href="/faq">View FAQ</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 