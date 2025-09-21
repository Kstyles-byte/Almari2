import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund & Dispute Resolution Policy | Zervia",
  description: "Learn about Zervia's refund eligibility, process, and dispute resolution procedures to protect both customers and vendors.",
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Refund & Dispute Resolution Policy
            </h1>
            <p className="text-lg text-gray-600">
              We're committed to ensuring fair resolution for both customers and vendors
            </p>
          </div>

          <div className="space-y-8">
            {/* Refund Eligibility */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">
                  Refund Eligibility
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Refunds apply if any of the following conditions are met:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Non-Delivery</h3>
                      <p className="text-gray-700">Product/service was not delivered within the specified timeframe.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Quality Issues</h3>
                      <p className="text-gray-700">Product/service is defective or not as described in the listing.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Duplicate Payments</h3>
                      <p className="text-gray-700">Multiple charges occurred for the same transaction.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Process */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">
                  Refund Process
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Step 1: File a Complaint</h3>
                      <p className="text-gray-700">
                        Customer must file a complaint within <strong>24 hours</strong> of receiving the product/service. 
                        Use our Help Center or contact support directly at support@zervia.ng
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Step 2: Investigation</h3>
                      <p className="text-gray-700">
                        Platform will review and investigate the complaint with the vendor. 
                        We may request additional information or documentation from both parties.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Step 3: Resolution</h3>
                      <p className="text-gray-700">
                        If approved, replacement will be initiated or refund will be issued within <strong>24 hours</strong> to the customer's original payment method.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispute Resolution */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">
                  Dispute Resolution
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Internal Review Process</h3>
                    <p className="text-gray-700">
                      All disputes are handled internally by the platform's management in collaboration with the quality assurance team.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Evidence-Based Decisions</h3>
                    <p className="text-gray-700">
                      Decisions are based on proof including:
                    </p>
                    <ul className="mt-2 ml-4 space-y-1">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Delivery records</span>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Product listings and descriptions</span>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Dates and timestamps</span>
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Photos and documentation</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Final Decision</h3>
                    <p className="text-gray-700">
                      Platform's decision is final to protect both customers and vendors. This ensures fair and consistent 
                      resolution while maintaining trust in our marketplace.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-amber-600 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">Important Notes</h3>
                  <ul className="space-y-2 text-amber-700">
                    <li>• The 24-hour complaint window starts from the time of product/service delivery</li>
                    <li>• Refunds are processed to the original payment method used for the transaction</li>
                    <li>• Processing time for refunds may vary depending on your bank or payment provider</li>
                    <li>• All communication during disputes should go through official Zervia channels</li>
                    <li>• False claims or abuse of the refund system may result in account suspension</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-2">
                  Need Help with a Refund or Dispute?
                </h2>
                <p className="text-blue-700 mb-4">
                  Our support team is here to help you through the process.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/help-center"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    File a Complaint
                  </a>
                  <a
                    href="mailto:support@zervia.ng"
                    className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-200"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}