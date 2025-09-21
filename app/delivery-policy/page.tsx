import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Delivery & Return Policy | Zervia",
  description: "Learn about Zervia's delivery options, pickup policies, return eligibility, and return process for your orders.",
}

export default function DeliveryPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Delivery & Return Policy
            </h1>
            <p className="text-lg text-gray-600">
              Everything you need to know about delivery, pickup, and returns
            </p>
          </div>

          <div className="space-y-8">
            {/* Delivery Options */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">
                  Delivery & Pickup Options
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-blue-900">Pickup</h3>
                    </div>
                    <ul className="space-y-2 text-blue-800">
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        Free of charge
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        Designated on-campus locations
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        Available within 4 hours for same-campus vendors
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        1-4 working days for other campuses
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <svg className="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-green-900">Delivery</h3>
                    </div>
                    <ul className="space-y-2 text-green-800">
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-1">ⓘ</span>
                        Fees based on distance and item size
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        Direct delivery to hostel/college
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        Within 6 hours for same-campus vendors
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span>
                        1-5 working days for other campuses
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Important Notes</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Delivery fees are clearly displayed at checkout before you confirm your order</li>
                    <li>• You'll receive notifications with pickup location or delivery schedule</li>
                    <li>• Customers must provide accurate delivery addresses (hostel name/college, etc.)</li>
                    <li>• Same-campus vendors typically have faster processing times</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Return Eligibility */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">
                  Return Eligibility
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Returns are accepted for:</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Defective Items</h4>
                        <p className="text-gray-700">Products that are broken, damaged, or not functioning as intended</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Wrong Items</h4>
                        <p className="text-gray-700">Items that differ from what was ordered or shown in the listing</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Mismatched Items</h4>
                        <p className="text-gray-700">Products that don't match their description or specifications</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">Return Conditions</h4>
                  <ul className="space-y-1 text-amber-700 text-sm">
                    <li>• Item must be unused and in original packaging</li>
                    <li>• Return request must be reported within <strong>24 hours</strong> of receipt</li>
                    <li>• All original accessories and documentation must be included</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Non-Returnable Items */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">
                  Non-Returnable Items
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  For health, safety, and quality reasons, the following items cannot be returned:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-semibold text-red-900">Perishable Goods</h3>
                    </div>
                    <ul className="text-red-800 text-sm space-y-1">
                      <li>• Food items</li>
                      <li>• Drinks and beverages</li>
                      <li>• Fresh produce</li>
                      <li>• Dairy products</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-semibold text-red-900">Digital Services</h3>
                    </div>
                    <ul className="text-red-800 text-sm space-y-1">
                      <li>• Online tutorials</li>
                      <li>• Digital downloads</li>
                      <li>• Software licenses</li>
                      <li>• Virtual consultations</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-semibold text-red-900">Personal Care</h3>
                    </div>
                    <ul className="text-red-800 text-sm space-y-1">
                      <li>• Hygiene products</li>
                      <li>• Personal grooming items</li>
                      <li>• Health supplements</li>
                      <li>• Opened cosmetics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Return Process */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">
                  Return Process
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-6">
                      <span className="text-purple-600 font-bold text-lg">1</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">File a Return Request</h3>
                      <p className="text-gray-700 mb-2">
                        Submit your return request within 24 hours of receiving your order through:
                      </p>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Orders section in your account dashboard</li>
                        <li>• Help Center support form</li>
                        <li>• Email support at support@zervia.ng</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-6">
                      <span className="text-purple-600 font-bold text-lg">2</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification & Approval</h3>
                      <p className="text-gray-700">
                        Our support team will review your request and verify the return eligibility. 
                        We may request photos or additional information about the issue.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-6">
                      <span className="text-purple-600 font-bold text-lg">3</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Item Pickup</h3>
                      <p className="text-gray-700">
                        Once approved, we'll arrange for pickup of the item from your location. 
                        Please ensure the item is properly packaged in its original packaging.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-6">
                      <span className="text-purple-600 font-bold text-lg">4</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Resolution</h3>
                      <p className="text-gray-700">
                        After confirming the returned item's condition, we'll process either a:
                      </p>
                      <ul className="mt-2 space-y-1 text-gray-600">
                        <li>• Full refund to your original payment method</li>
                        <li>• Replacement item (if available)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Processing Timeline</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• Return request review: 1-2 business days</li>
                    <li>• Item pickup arrangement: 2-3 business days</li>
                    <li>• Refund/replacement processing: Immediately after confirmation</li>
                    <li>• Refund appears in account: 3-7 business days (varies by payment method)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Need Help with Delivery or Returns?
                </h2>
                <p className="text-gray-700 mb-4">
                  Our support team is ready to assist you with any delivery or return questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/help-center"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    File a Return Request
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