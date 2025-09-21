'use client'

import { Metadata } from "next"
import { useState } from "react"

export default function HelpCenterPage() {
  const [formData, setFormData] = useState({
    issueType: '',
    orderId: '',
    name: '',
    email: '',
    description: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  const issueTypes = [
    'Order Problem',
    'Technical Issue',
    'Vendor Application',
    'Payment Issue',
    'Delivery/Pickup Issue',
    'Account Problem',
    'Refund Request',
    'Product Quality Issue',
    'Other'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitStatus('success')
      setFormData({
        issueType: '',
        orderId: '',
        name: '',
        email: '',
        description: ''
      })
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Help Center
            </h1>
            <p className="text-lg text-gray-600">
              Get support for any issues or questions you might have
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">
                    Contact Support
                  </h2>
                </div>
                
                <div className="p-6">
                  {submitStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex">
                        <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-green-700">
                          Your support request has been submitted successfully. We'll get back to you as soon as possible.
                        </p>
                      </div>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700">
                          There was an error submitting your request. Please try again or contact us directly via email.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-2">
                          Issue Type *
                        </label>
                        <select
                          id="issueType"
                          name="issueType"
                          required
                          value={formData.issueType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select an issue type</option>
                          {issueTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                          Order ID (if applicable)
                        </label>
                        <input
                          type="text"
                          id="orderId"
                          name="orderId"
                          value={formData.orderId}
                          onChange={handleInputChange}
                          placeholder="e.g., ORD-123456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Describe your issue *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        rows={6}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Please provide as much detail as possible about your issue..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Contact Information and Quick Links */}
            <div className="space-y-6">
              {/* Direct Contact */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">
                    Direct Contact
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-500">Email Support</p>
                        <a href="mailto:support@zervia.ng" className="text-blue-600 hover:text-blue-800 font-medium">
                          support@zervia.ng
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">
                    Quick Links
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <a href="/faq/customers" className="block text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      Customer FAQ
                    </a>
                    <a href="/faq/vendors" className="block text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      Vendor FAQ
                    </a>
                    <a href="/refund-policy" className="block text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      Refund & Dispute Policy
                    </a>
                    <a href="/delivery-policy" className="block text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      Delivery & Return Policy
                    </a>
                    <a href="/terms" className="block text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      Terms & Conditions
                    </a>
                    <a href="/privacy" className="block text-blue-600 hover:text-blue-800 transition-colors duration-200">
                      Privacy Policy
                    </a>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">
                  Response Time
                </h4>
                <p className="text-blue-700 text-sm">
                  We typically respond to support requests within 24 hours during business days. 
                  For urgent issues, please include "URGENT" in your subject line.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}