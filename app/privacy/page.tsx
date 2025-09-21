import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Zervia",
  description: "Learn how Zervia collects, uses, and protects your personal information and data privacy rights.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Your privacy is important to us. This policy explains how we collect and use your information.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-8 space-y-8">
              
              {/* Data Collection */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Data Collection</h2>
                <p className="text-gray-700 mb-4">
                  We collect the following types of information to provide and improve our services:
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                    <ul className="space-y-1 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Name and contact information (email, phone number)
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        University affiliation and campus details
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Delivery and pickup addresses
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Vendor Information</h3>
                    <ul className="space-y-1 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Business verification details and documentation
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Bank account information for payments
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Product listings and inventory data
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Transaction Data</h3>
                    <ul className="space-y-1 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Order history and payment information
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Delivery and pickup records
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        Reviews and feedback
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Usage */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Data</h2>
                <p className="text-gray-700 mb-4">
                  We use your information for the following purposes:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Process and fulfill orders</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Manage deliveries and pickups</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Process payments securely</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Provide customer support</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Improve platform features</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Send order notifications</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Verify vendor eligibility</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Prevent fraud and abuse</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Third Parties */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing with Third Parties</h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Limited Vendor Access</h3>
                    <p className="text-blue-800">
                      Vendors only see necessary order details (items, delivery address, customer name) to fulfill orders. 
                      They never have access to your full personal data, payment information, or contact details.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Payment Processing</h3>
                    <p className="text-green-800">
                      We use Paystack, a secure and trusted payment processor. Your payment information is encrypted 
                      and processed securely through their systems. We do not store your complete payment card details.
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">Service Providers</h3>
                    <p className="text-purple-800">
                      We may share data with trusted service providers who help us operate our platform, such as 
                      delivery services, customer support tools, and analytics providers. These partners are bound 
                      by strict confidentiality agreements.
                    </p>
                  </div>
                </div>
              </section>

              {/* Security */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Security Measures</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        End-to-end encryption
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Secure data storage
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Regular security audits
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Access controls and monitoring
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Payment Security</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 1L3 6v2a16 16 0 1014 0V6l-7-5zM6.646 10.146L10 13.5l3.354-3.354a.5.5 0 01.708.708L10 14.918l-4.062-4.064a.5.5 0 01.708-.708z" clipRule="evenodd" />
                        </svg>
                        PCI DSS compliance
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 1L3 6v2a16 16 0 1014 0V6l-7-5zM6.646 10.146L10 13.5l3.354-3.354a.5.5 0 01.708.708L10 14.918l-4.062-4.064a.5.5 0 01.708-.708z" clipRule="evenodd" />
                        </svg>
                        SSL/TLS encryption
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 1L3 6v2a16 16 0 1014 0V6l-7-5zM6.646 10.146L10 13.5l3.354-3.354a.5.5 0 01.708.708L10 14.918l-4.062-4.064a.5.5 0 01.708-.708z" clipRule="evenodd" />
                        </svg>
                        Fraud detection systems
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 1L3 6v2a16 16 0 1014 0V6l-7-5zM6.646 10.146L10 13.5l3.354-3.354a.5.5 0 01.708.708L10 14.918l-4.062-4.064a.5.5 0 01.708-.708z" clipRule="evenodd" />
                        </svg>
                        Secure payment processing
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* No Sharing */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Protection Commitment</h2>
                <div className="bg-red-50 border-l-4 border-red-500 p-6">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-red-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">We Never Sell or Disclose Your Data</h3>
                      <p className="text-red-700">
                        We never sell, rent, or disclose your personal data to third parties for marketing purposes 
                        or any other reason not directly related to providing our services. Your privacy is fundamental to our business.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking</h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    We use cookies and similar technologies to enhance your experience on our platform:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                      <p className="text-gray-700 text-sm">
                        Required for login sessions, shopping cart functionality, and security features.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                      <p className="text-gray-700 text-sm">
                        Help us understand how users interact with our platform to improve performance and features.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* User Rights */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  You have the following rights regarding your personal data:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900">Access Your Data</h3>
                        <p className="text-gray-600 text-sm">Request a copy of all personal data we have about you</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900">Correct Your Data</h3>
                        <p className="text-gray-600 text-sm">Update or correct any inaccurate information</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.414A2 2 0 0115.414 13L12 16.414A2 2 0 0110.586 17H6a2 2 0 01-2-2V5zm8 4a1 1 0 10-2 0v1.586l.293.293a1 1 0 001.414 0L12 10.586V9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900">Delete Your Account</h3>
                        <p className="text-gray-600 text-sm">Request complete account and data deletion</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-gray-900">Data Portability</h3>
                        <p className="text-gray-600 text-sm">Export your data in a common format</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    To exercise any of these rights, please contact us at 
                    <a href="mailto:support@zervia.ng" className="font-medium ml-1">support@zervia.ng</a>
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 mb-2">
                    If you have questions about this Privacy Policy or your data, please contact us:
                  </p>
                  <div className="space-y-2 text-gray-700">
                    <p>Email: <a href="mailto:support@zervia.ng" className="text-blue-600 hover:text-blue-800">support@zervia.ng</a></p>
                    <p>Business Registration: BN: 8723748 (Corporate Affairs Commission)</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Questions About Your Privacy?
              </h3>
              <p className="text-blue-700 mb-4">
                We're here to help you understand how we protect your information.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/help-center"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  Contact Support
                </a>
                <a
                  href="mailto:support@zervia.ng"
                  className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-200"
                >
                  Email Privacy Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}