import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Customer FAQs | Zervia",
  description: "Frequently asked questions for Zervia customers about ordering, payments, delivery, and more.",
}

export default function CustomerFAQPage() {
  const faqs = [
    {
      question: "What is Zervia?",
      answer: "Zervia is an online platform that connects students and staffs with all vendors, SMEs, and service providers in their campus community. You can order products and services conveniently from us, and our system is designed to ensure that the right product(s)/service(s) that you've sought for through us gets to you safely and meets your expectations."
    },
    {
      question: "Why trust us?",
      answer: "Zervia is a registered business with the Corporate Affairs Commission (CAC) under registration number BN: 8723748. We use a popularly known, trusted and secure payment provider called Paystack to process transactions, all payments are encrypted and cannot be accessed by any third party, funds are only released to vendors ONLY when we have confirmed you're satisfied with your product(s)/service(s). In case of dissatisfaction or disputes, our refund and resolution policy ensures that you are fully protected and you can always get your 100% money back, please refer to our Refund & Dispute Resolution Policy for more details."
    },
    {
      question: "How do I create an account?",
      answer: "You can sign up using your name, email address and creating a password for your account."
    },
    {
      question: "How and when will I receive my order?",
      answer: "Most orders are delivered through an on-campus designated pickup location or by direct delivery from our delivery agent depending on customers preference. You will receive a notification with the pickup location when it is ready for pickup or a delivery schedule(for deliveries). Delivery/Pickup times for same-campus vendors are typically within the same day or next."
    },
    {
      question: "Is there a pickup/delivery fee?",
      answer: "There is no fee for pickup, but if you opt for delivery to your hostel/college, delivery fees will be clearly displayed at checkout before you confirm your order."
    },
    {
      question: "Can I make payment at Pickup/Delivery?",
      answer: "No, we don't accept payment on delivery or at pickup point for now."
    },
    {
      question: "How do I pay for Products/Services?",
      answer: "All payments are made securely through the platform with Paystack using payment options which include cards, bank account/bank transfer, USSD, Apple pay, Visa QR etc."
    },
    {
      question: "How long does Pickup/delivery take?",
      answer: "Items for pick-up are usually available at the pick-up station within 4 hours from order placement time for same-campus vendors depending on the vendor, while deliveries are typically completed within 6 hours for same-campus vendors. Items from other campuses or the outside community can take 1-4 working days to be available for pickup and 1-5 working days for delivery depending of the location of the Vendor."
    },
    {
      question: "What happens if my order is delayed or incorrect?",
      answer: "Please report the issue immediately through any of our support channels in the \"Help Center.\" We will investigate with the vendor and ensure either a replacement or a refund."
    },
    {
      question: "Can I cancel my order?",
      answer: "Yes, orders can be canceled before the vendor has processed them. Once processed, cancellation may not be possible."
    },
    {
      question: "What if I want to return a product?",
      answer: "Returns are allowed only if the product is defective, incorrect, or does not match its description."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Customer FAQ
            </h1>
            <p className="text-lg text-gray-600">
              Find answers to commonly asked questions about using Zervia
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <details key={index} className="group">
                  <summary className="flex justify-between items-center cursor-pointer p-6 hover:bg-gray-50 transition-colors duration-200">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <svg
                      className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform duration-200 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Still have questions?
              </h2>
              <p className="text-blue-700 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <a
                href="/help-center"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}