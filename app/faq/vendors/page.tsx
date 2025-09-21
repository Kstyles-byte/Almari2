import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vendor FAQs | Zervia",
  description: "Frequently asked questions for Zervia vendors about selling, fees, payments, and inventory management.",
}

export default function VendorFAQPage() {
  const faqs = [
    {
      question: "How can I become a vendor on the platform?",
      answer: "Please visit our \"Become a Vendor\" page and fill out the application form. All vendors must meet our 'Vendor requirements' in order to be approved and get access to a vendor dashboard where you can upload products, set prices, update inventory, and manage incoming orders in real-time."
    },
    {
      question: "Are there any fees to sell on the platform?",
      answer: "No, your registration and stay on the platform is completely free, however a small percentage commission is taken from each successful sale, we don't make money until you make money. Detailed commission fee structure will be provided upon application approval."
    },
    {
      question: "How and when do I get paid for my sales?",
      answer: "Vendor payments are made to their pre-registered bank accounts 24hrs after customer has received the item(s) IF they don't initiate a return within this period, meaning the product meets their expectations and the sale is successful."
    },
    {
      question: "How do I manage my inventory and orders?",
      answer: "Once approved, you will get access to a vendor dashboard where you can upload products, set prices, update inventory, and manage incoming orders in real-time."
    }
  ]

  const requirements = [
    "Verified vendor status in the university community",
    "Accurate product descriptions and quality assurance",
    "Compliance with university policies",
    "No prohibited items (alcohol, drugs, weapons, etc.)",
    "Maintain account confidentiality and security",
    "Provide correct business and contact information"
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Vendor FAQ
            </h1>
            <p className="text-lg text-gray-600">
              Everything you need to know about selling on Zervia
            </p>
          </div>

          {/* FAQ Section */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                Frequently Asked Questions
              </h2>
            </div>
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

          {/* Vendor Requirements Section */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                Vendor Requirements
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                To maintain quality and safety standards, all vendors must meet the following requirements:
              </p>
              <ul className="space-y-3">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Ready to Start Selling?
              </h2>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Join our community of vendors and start reaching students and staff in your campus. 
                Our platform provides everything you need to manage your business effectively.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/vendors/apply"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
                >
                  Apply to Become a Vendor
                </a>
                <a
                  href="/help-center"
                  className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}