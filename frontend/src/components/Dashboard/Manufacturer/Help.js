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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Help & Support</h1>
      
      {/* Tutorials Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Tutorials & Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tutorials.map((tutorial, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">{tutorial.title}</h3>
              <p className="text-gray-600 mb-4">{tutorial.description}</p>
              <a
                href={tutorial.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Watch Tutorial →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Support Ticket Form */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Submit a Support Ticket</h2>
        <form onSubmit={handleTicketSubmit} className="max-w-2xl bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={ticketData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={ticketData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={ticketData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit Ticket
          </button>
        </form>
      </section>
    </div>
  );
};

export default Help; 