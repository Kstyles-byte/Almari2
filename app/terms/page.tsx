import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions | Zervia",
  description: "Read Zervia's terms and conditions including user responsibilities, prohibited conduct, and platform policies.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg text-gray-600">
              Please read these terms carefully before using our platform
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-8 space-y-8">
              
              {/* Acceptance */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance</h2>
                <p className="text-gray-700 leading-relaxed">
                  By using this platform, you agree to these terms. If you do not agree to any part of these terms, 
                  you may not access or use our services.
                </p>
              </section>

              {/* Eligibility */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
                <p className="text-gray-700 leading-relaxed">
                  Only verified vendors in the university community can sell on this platform. Users must be 
                  students, staff, or affiliated with the campus community to access our services.
                </p>
              </section>

              {/* Prohibited Items */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Prohibited Items</h2>
                <p className="text-gray-700 mb-4">
                  The following items are strictly prohibited on our platform:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Alcohol and alcoholic beverages
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Illegal drugs and controlled substances
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Weapons and dangerous items
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Stolen goods or counterfeit items
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    Anything that violates university policies
                  </li>
                </ul>
              </section>

              {/* Account Responsibility */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Responsibility</h2>
                <p className="text-gray-700 leading-relaxed">
                  Users are responsible for maintaining the confidentiality of their account credentials and password. 
                  You are responsible for all activities that occur under your account. Please notify us immediately 
                  of any unauthorized use of your account.
                </p>
              </section>

              {/* Transactions */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Transactions</h2>
                <div className="space-y-3 text-gray-700">
                  <p>All payments must be made through the platform using our secure payment system.</p>
                  <p>Customers and vendors cannot transact outside the platform for items listed on Zervia.</p>
                  <p>All transactions are subject to our refund and dispute resolution policies.</p>
                  <p>Prices are set by individual vendors and may be subject to change.</p>
                </div>
              </section>

              {/* Delivery */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Delivery</h2>
                <p className="text-gray-700 leading-relaxed">
                  The platform manages logistics and guarantees delivery through our approved delivery methods. 
                  Delivery times and methods are specified at the time of purchase and may vary based on vendor location and product type.
                </p>
              </section>

              {/* Refunds */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Refunds</h2>
                <p className="text-gray-700 leading-relaxed">
                  Refunds are subject to our refund policy. Please refer to our 
                  <a href="/refund-policy" className="text-blue-600 hover:text-blue-800 ml-1">
                    Refund & Dispute Resolution Policy
                  </a> for detailed information about refund eligibility and processes.
                </p>
              </section>

              {/* Vendor Responsibilities */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Vendor Responsibilities</h2>
                <div className="space-y-3 text-gray-700">
                  <p>Vendors MUST provide accurate descriptions and quality products/services.</p>
                  <p>All product listings must include honest and detailed descriptions.</p>
                  <p>Vendors are responsible for maintaining adequate inventory levels.</p>
                  <p>Vendors must respond promptly to customer inquiries and order updates.</p>
                  <p>Vendors must comply with all university policies and local regulations.</p>
                </div>
              </section>

              {/* Customer Responsibilities */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Customer Responsibilities</h2>
                <div className="space-y-3 text-gray-700">
                  <p>Customers MUST provide correct pickup or delivery details.</p>
                  <p>Customers are responsible for being available during specified delivery windows.</p>
                  <p>Customers must report issues within the specified timeframes.</p>
                  <p>Customers should provide honest feedback and reviews.</p>
                </div>
              </section>

              {/* Fees */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Fees</h2>
                <p className="text-gray-700 leading-relaxed">
                  Zervia reserves the right to change commission fees and service charges. Notice will be provided 
                  to vendors in advance of any fee changes. Current fee structures are provided upon vendor application approval.
                </p>
              </section>

              {/* Prohibited Conduct */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Prohibited Conduct</h2>
                <div className="space-y-3 text-gray-700">
                  <p>The following activities are strictly prohibited:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Direct contact between vendors and customers outside the platform
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Fraudulent activity or misrepresentation
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Abuse of the platform or its features
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Attempting to circumvent platform fees or policies
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Harassment or inappropriate behavior toward other users
                    </li>
                  </ul>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Intellectual Property</h2>
                <p className="text-gray-700 leading-relaxed">
                  Vendors guarantee they have the right to sell the products they list. Users may not infringe 
                  upon the intellectual property rights of others. Zervia respects intellectual property rights 
                  and will respond to valid complaints regarding copyright or trademark infringement.
                </p>
              </section>

              {/* Liability */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  The platform is not liable for any problems with products 24 hours after they have been received 
                  by the customer, but will ensure disputes are fairly resolved through our dispute resolution process. 
                  Our total liability is limited to the amount paid for the specific transaction in question.
                </p>
              </section>

              {/* Modifications */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Modifications</h2>
                <p className="text-gray-700 leading-relaxed">
                  These terms are subject to change in the future. Users will always be notified of significant 
                  changes through email or platform notifications. Continued use of the platform after modifications 
                  constitutes acceptance of the updated terms.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  Zervia reserves the right to suspend or terminate accounts that violate these terms. 
                  Termination may be temporary or permanent depending on the severity of the violation. 
                  Users may also terminate their accounts at any time by contacting support.
                </p>
              </section>

              {/* Contact Information */}
              <section className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 mb-2">
                    If you have questions about these Terms & Conditions, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-700">
                    <p>Email: <a href="mailto:support@zervia.ng" className="text-blue-600 hover:text-blue-800">support@zervia.ng</a></p>
                    {/* <p>Business Registration: BN: 8723748 (Corporate Affairs Commission)</p> */}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Agreement Notice */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                By continuing to use Zervia, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                <a
                  href="/help-center"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  Contact Support
                </a>
                <a
                  href="/"
                  className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-200"
                >
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}