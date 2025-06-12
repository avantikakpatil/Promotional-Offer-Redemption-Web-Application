import React, { useState } from 'react';

const Help = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [ticketData, setTicketData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
  });

  const faqs = [
    {
      question: 'How do I create a new campaign?',
      answer:
        'To create a new campaign, navigate to the "Create Campaign" page from the sidebar. Fill in the campaign details including name, product type, points value, and dates. You can also add multiple reward tiers for different redemption levels.',
    },
    {
      question: 'How do I generate QR codes?',
      answer:
        'You can generate QR codes in two ways: 1) Upload a CSV file containing your QR codes, or 2) Use the built-in generator to create a specified number of unique QR codes. Both options are available on the QR Code Management page.',
    },
    {
      question: 'How do I assign QR codes to resellers?',
      answer:
        'Go to the "Assign Reseller" page, select a reseller from the dropdown, enter a batch name, and select the QR codes you want to assign. Review the summary and click "Assign QR Codes" to complete the process.',
    },
    {
      question: 'How do I track campaign performance?',
      answer:
        'Visit the Analytics page to view detailed campaign performance metrics. You can filter data by campaign, date range, and reseller. The dashboard shows QR code scans, redemptions, and conversion rates.',
    },
  ];

  const tutorials = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of using the manufacturer panel',
      videoUrl: 'https://example.com/tutorial1',
    },
    {
      title: 'Campaign Management',
      description: 'How to create and manage promotional campaigns',
      videoUrl: 'https://example.com/tutorial2',
    },
    {
      title: 'QR Code Management',
      description: 'Generate and assign QR codes to resellers',
      videoUrl: 'https://example.com/tutorial3',
    },
    {
      title: 'Analytics and Reporting',
      description: 'Understanding your campaign performance metrics',
      videoUrl: 'https://example.com/tutorial4',
    },
  ];

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to submit support ticket
    console.log('Submitting support ticket:', ticketData);
    alert('Support ticket submitted successfully!');
    setTicketData({
      subject: '',
      description: '',
      priority: 'medium',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Help & Support</h1>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('faq')}
              className={`${
                activeTab === 'faq'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              FAQs
            </button>
            <button
              onClick={() => setActiveTab('tutorials')}
              className={`${
                activeTab === 'tutorials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Tutorials
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`${
                activeTab === 'support'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Support Ticket
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* FAQs */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tutorials */}
          {activeTab === 'tutorials' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {tutorials.map((tutorial, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {tutorial.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{tutorial.description}</p>
                  <a
                    href={tutorial.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Watch Tutorial
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Support Ticket */}
          {activeTab === 'support' && (
            <form onSubmit={handleTicketSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700"
                >
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  value={ticketData.subject}
                  onChange={handleInputChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700"
                >
                  Priority
                </label>
                <select
                  name="priority"
                  id="priority"
                  value={ticketData.priority}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={6}
                  value={ticketData.description}
                  onChange={handleInputChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email Support</h3>
            <p className="mt-1 text-sm text-gray-900">support@example.com</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Phone Support</h3>
            <p className="mt-1 text-sm text-gray-900">+1 (555) 123-4567</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Business Hours</h3>
            <p className="mt-1 text-sm text-gray-900">
              Monday - Friday: 9:00 AM - 6:00 PM EST
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
            <p className="mt-1 text-sm text-gray-900">
              We typically respond within 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help; 