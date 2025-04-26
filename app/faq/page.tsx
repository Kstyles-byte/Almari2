import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Frequently Asked Questions | Zervia',
  description: 'Find answers to common questions about Zervia, orders, shipping, returns, and more.',
};

export default function FAQPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Find answers to common questions about using Zervia
          </p>
          
          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for answers..."
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        {/* FAQ Categories Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="returns">Returns</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>
          
          {/* General FAQs */}
          <TabsContent value="general" className="mt-6">
            <h2 className="mb-4 text-2xl font-bold">General Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what-is-zervia">
                <AccordionTrigger>What is Zervia?</AccordionTrigger>
                <AccordionContent>
                  Zervia is a campus-based e-commerce platform that connects students with trusted 
                  vendors through our innovative agent-based delivery model. We make it easy to shop 
                  for products and pick them up at convenient locations around campus.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-does-zervia-work">
                <AccordionTrigger>How does Zervia work?</AccordionTrigger>
                <AccordionContent>
                  Zervia works in a simple three-step process: 1) Browse and purchase products from 
                  our verified vendors, 2) Choose a convenient agent location for pickup, 3) Pick up 
                  your products from the agent location when they're ready. Our agent-based model 
                  eliminates delivery complications and ensures reliable order fulfillment.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="account-required">
                <AccordionTrigger>Do I need an account to order on Zervia?</AccordionTrigger>
                <AccordionContent>
                  Yes, you need to create an account to place orders on Zervia. This helps us ensure 
                  security, track your orders, and provide a personalized shopping experience. 
                  Creating an account is free and only takes a few minutes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="payment-methods">
                <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                <AccordionContent>
                  Zervia accepts various payment methods including credit/debit cards, bank transfers, 
                  and mobile money services. All payments are processed securely through our payment 
                  partner, Paystack.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="contact-customer-service">
                <AccordionTrigger>How do I contact customer service?</AccordionTrigger>
                <AccordionContent>
                  You can contact our customer service team through multiple channels: email us at 
                  support@zervia.com, use the contact form on our Contact Us page, or reach out via 
                  our social media channels. Our support team is available Monday through Friday 
                  from 9 AM to 5 PM.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          {/* Orders FAQs */}
          <TabsContent value="orders" className="mt-6">
            <h2 className="mb-4 text-2xl font-bold">Orders</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="track-order">
                <AccordionTrigger>How can I track my order?</AccordionTrigger>
                <AccordionContent>
                  You can track your order by logging into your Zervia account and visiting the 
                  "Orders" section in your dashboard. There, you'll find all your orders with 
                  their current status. You'll also receive email and in-app notifications when 
                  your order status changes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cancel-order">
                <AccordionTrigger>Can I cancel my order?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can cancel your order if it hasn't been processed by the vendor yet. 
                  To cancel an order, go to your order details page and click the "Cancel Order" 
                  button. If the button is not available, it means the order is already being 
                  processed and cannot be canceled.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="order-processing-time">
                <AccordionTrigger>How long does it take to process my order?</AccordionTrigger>
                <AccordionContent>
                  Most orders are processed within 24-48 hours after payment confirmation. 
                  However, processing times may vary depending on the vendor and product 
                  availability. You can check the estimated processing time on the product page 
                  before placing your order.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="modify-order">
                <AccordionTrigger>Can I modify my order after placing it?</AccordionTrigger>
                <AccordionContent>
                  Unfortunately, once an order is placed, it cannot be modified. If you need to 
                  make changes, you'll need to cancel the order (if it hasn't been processed yet) 
                  and place a new one with the correct information.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="order-confirmation">
                <AccordionTrigger>I didn't receive an order confirmation. What should I do?</AccordionTrigger>
                <AccordionContent>
                  First, check your spam or junk folder as confirmation emails sometimes end up there. 
                  If you still can't find it, log into your Zervia account to verify that your order 
                  was successfully placed. If you see the order in your dashboard but didn't receive 
                  a confirmation email, contact our customer support team for assistance.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          {/* Shipping FAQs */}
          <TabsContent value="shipping" className="mt-6">
            <h2 className="mb-4 text-2xl font-bold">Pickup & Delivery</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="agent-locations">
                <AccordionTrigger>Where are your agent locations?</AccordionTrigger>
                <AccordionContent>
                  Our agent locations are strategically placed around campus for easy access. 
                  You can view all available agent locations during checkout. Each location includes 
                  information about operating hours and exact location details.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pickup-process">
                <AccordionTrigger>How does the pickup process work?</AccordionTrigger>
                <AccordionContent>
                  When your order is ready for pickup, you'll receive a notification with a unique 
                  pickup code. Visit your chosen agent location during operating hours, show your 
                  pickup code to the agent, and they'll verify your identity before handing over 
                  your order. Make sure to bring a valid ID.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pickup-time">
                <AccordionTrigger>How long do I have to pick up my order?</AccordionTrigger>
                <AccordionContent>
                  You have 3 days to pick up your order once it arrives at the agent location. 
                  If you don't pick up your order within this timeframe, it will be returned to 
                  the vendor, and you'll need to contact customer service regarding a refund.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="someone-else-pickup">
                <AccordionTrigger>Can someone else pick up my order for me?</AccordionTrigger>
                <AccordionContent>
                  Yes, someone else can pick up your order, but you must designate them as your 
                  authorized representative in advance. Log into your account, go to the order 
                  details, and use the "Authorize Pickup" feature to enter their information. 
                  They'll need to present their ID and your pickup code at the agent location.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="home-delivery">
                <AccordionTrigger>Does Zervia offer home delivery?</AccordionTrigger>
                <AccordionContent>
                  Currently, Zervia operates on an agent-based pickup model and does not offer 
                  direct home delivery. This model helps us ensure reliable order fulfillment 
                  and maintain affordable prices without the complexities of last-mile delivery.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          {/* Returns FAQs */}
          <TabsContent value="returns" className="mt-6">
            <h2 className="mb-4 text-2xl font-bold">Returns & Refunds</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="return-policy">
                <AccordionTrigger>What is Zervia's return policy?</AccordionTrigger>
                <AccordionContent>
                  Zervia allows returns within 24 hours of pickup if the product is defective, 
                  damaged, or significantly different from what was described. To initiate a return, 
                  log into your account, go to your order details, and click the "Request Return" button. 
                  You'll need to bring the product back to the agent location where you picked it up.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="refund-process">
                <AccordionTrigger>How long does it take to process refunds?</AccordionTrigger>
                <AccordionContent>
                  Refunds are typically processed within 7-10 business days after your return has 
                  been approved. The actual time it takes for the refund to appear in your account 
                  depends on your payment method and financial institution.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="return-conditions">
                <AccordionTrigger>What conditions must be met for returns?</AccordionTrigger>
                <AccordionContent>
                  For a return to be approved, the following conditions must be met: 1) Return request 
                  submitted within 24 hours of pickup, 2) Product must be unused and in its original 
                  packaging, 3) All tags and labels must be intact, 4) You must have proof of purchase. 
                  Some products, such as perishable goods or custom-made items, may not be eligible 
                  for returns.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="return-shipping">
                <AccordionTrigger>Who pays for return shipping?</AccordionTrigger>
                <AccordionContent>
                  Since Zervia operates on an agent-based model, there is no shipping cost for returns. 
                  You simply need to bring the product back to the agent location where you picked it up. 
                  However, it's your responsibility to ensure the product arrives safely at the agent 
                  location.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="partial-returns">
                <AccordionTrigger>Can I return part of my order?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can return individual items from an order with multiple products. When 
                  initiating a return, you'll be able to select which items you want to return and 
                  provide a reason for each return. Refunds will be processed only for the returned items.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          {/* Vendors FAQs */}
          <TabsContent value="vendors" className="mt-6">
            <h2 className="mb-4 text-2xl font-bold">Vendors & Selling</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="become-vendor">
                <AccordionTrigger>How can I become a vendor on Zervia?</AccordionTrigger>
                <AccordionContent>
                  To become a vendor on Zervia, create an account and select "Register as Vendor" 
                  during the registration process. You'll need to provide business information, 
                  including your business name, contact details, and product categories. Our team 
                  will review your application, and once approved, you can set up your store and 
                  start listing products.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="vendor-fees">
                <AccordionTrigger>What fees do vendors pay?</AccordionTrigger>
                <AccordionContent>
                  Zervia charges a commission fee of 10% on each successful sale. There is no 
                  monthly subscription fee or listing fee. We only make money when you make a sale. 
                  Payment processing fees (typically 1.5-3%) are also deducted from each transaction. 
                  Full details can be found in our Vendor Terms & Conditions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="vendor-payments">
                <AccordionTrigger>How and when do vendors get paid?</AccordionTrigger>
                <AccordionContent>
                  Vendor payments are processed twice a month - on the 1st and 15th. The payment 
                  includes all successful sales with completed pickups, minus our commission and 
                  payment processing fees. Payments are made directly to your registered bank account. 
                  You can track all your earnings and payments in your vendor dashboard.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="vendor-product-delivery">
                <AccordionTrigger>How do vendors deliver products to agents?</AccordionTrigger>
                <AccordionContent>
                  Once an order is placed, vendors receive a notification with the details and the 
                  assigned agent location. Vendors are responsible for delivering products to the 
                  agent location within 48 hours (or the timeframe specified in your store policies). 
                  The agent will verify the products upon receipt and update the order status. 
                  Vendors need to maintain good delivery performance to stay in good standing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="vendor-support">
                <AccordionTrigger>Is there special support for vendors?</AccordionTrigger>
                <AccordionContent>
                  Yes, Zervia provides dedicated support for vendors through our Vendor Success team. 
                  You can access vendor support through your dashboard, or email vendor.support@zervia.com. 
                  We also provide resources, guidelines, and best practices to help you maximize your 
                  sales and maintain a high-quality store.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
        
        {/* Popular Questions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Popular Questions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 font-semibold">How do I track my order?</h3>
                <p className="text-sm text-muted-foreground">
                  You can track your order by logging into your account and checking the Orders section in your dashboard.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 font-semibold">What is the return timeframe?</h3>
                <p className="text-sm text-muted-foreground">
                  Returns must be initiated within 24 hours of picking up your order from the agent location.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 font-semibold">How do I change my password?</h3>
                <p className="text-sm text-muted-foreground">
                  Go to Account Settings in your profile and select the "Change Password" option.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 font-semibold">Where are the agent locations?</h3>
                <p className="text-sm text-muted-foreground">
                  Agent locations are strategically located around campus. You can view all locations during checkout.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Still Have Questions? */}
        <div className="rounded-lg bg-zervia-50 p-8 text-center">
          <h2 className="text-2xl font-bold">Still Have Questions?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            If you couldn't find the answer you were looking for, our customer support team is here to help.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@zervia.com">Email Support</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 