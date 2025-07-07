import React, { useState } from 'react';
import { Calendar, Package, User, FileText, Clock, CheckCircle } from 'lucide-react';

const AssignResellerPage = () => {
  const [selectedReseller, setSelectedReseller] = useState('');
  const [selectedQRCodes, setSelectedQRCodes] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Mock data - replace with actual API calls
  const resellers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1-234-567-8900', region: 'North America' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1-987-654-3210', region: 'Europe' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1-555-123-4567', region: 'Asia Pacific' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', phone: '+1-777-888-9999', region: 'South America' },
  ];

  const availableQRCodes = [
    { id: 1, code: 'QR-123456', product: 'Premium Widget A', batch: 'PWA-2024-001', status: 'Available' },
    { id: 2, code: 'QR-234567', product: 'Premium Widget A', batch: 'PWA-2024-001', status: 'Available' },
    { id: 3, code: 'QR-345678', product: 'Standard Widget B', batch: 'SWB-2024-002', status: 'Available' },
    { id: 4, code: 'QR-456789', product: 'Standard Widget B', batch: 'SWB-2024-002', status: 'Available' },
    { id: 5, code: 'QR-567890', product: 'Deluxe Widget C', batch: 'DWC-2024-003', status: 'Available' },
    { id: 6, code: 'QR-678901', product: 'Deluxe Widget C', batch: 'DWC-2024-003', status: 'Available' },
    { id: 7, code: 'QR-789012', product: 'Premium Widget A', batch: 'PWA-2024-004', status: 'Available' },
    { id: 8, code: 'QR-890123', product: 'Premium Widget A', batch: 'PWA-2024-004', status: 'Available' },
  ];

  const [assignmentLog, setAssignmentLog] = useState([
    {
      id: 1,
      batchName: 'Premium Batch Q1',
      reseller: 'John Doe',
      qrCount: 25,
      assignedDate: '2024-01-15',
      status: 'Active',
      description: 'Q1 premium product launch batch'
    },
    {
      id: 2,
      batchName: 'Standard Batch Jan',
      reseller: 'Jane Smith',
      qrCount: 50,
      assignedDate: '2024-01-20',
      status: 'Active',
      description: 'January standard product distribution'
    },
    {
      id: 3,
      batchName: 'Holiday Special',
      reseller: 'Bob Johnson',
      qrCount: 100,
      assignedDate: '2024-01-10',
      status: 'Completed',
      description: 'Holiday season special products'
    },
    {
      id: 4,
      batchName: 'Deluxe Launch',
      reseller: 'Alice Williams',
      qrCount: 75,
      assignedDate: '2024-01-25',
      status: 'Active',
      description: 'New deluxe product line launch'
    },
  ]);

  const handleQRCodeSelect = (code) => {
    if (selectedQRCodes.includes(code)) {
      setSelectedQRCodes(selectedQRCodes.filter((c) => c !== code));
    } else {
      setSelectedQRCodes([...selectedQRCodes, code]);
    }
  };

  const handleSelectAll = () => {
    if (selectedQRCodes.length === availableQRCodes.length) {
      setSelectedQRCodes([]);
    } else {
      setSelectedQRCodes([...availableQRCodes]);
    }
  };

  const handleConfirmAssignment = () => {
    if (!selectedReseller || selectedQRCodes.length === 0 || !batchName) {
      alert('Please fill in all required fields');
      return;
    }
    setShowConfirmation(true);
  };

  const handleFinalAssign = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to assignment log
      const newAssignment = {
        id: Date.now(),
        batchName,
        reseller: resellers.find(r => r.id === parseInt(selectedReseller))?.name,
        qrCount: selectedQRCodes.length,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        description: batchDescription || 'No description provided'
      };
      
      setAssignmentLog(prev => [newAssignment, ...prev]);
      
      // Reset form
      setSelectedReseller('');
      setSelectedQRCodes([]);
      setBatchName('');
      setBatchDescription('');
      setShowConfirmation(false);
      
      alert('QR codes assigned successfully!');
    } catch (error) {
      console.error('Error assigning QR codes:', error);
      alert('Failed to assign QR codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedResellerData = resellers.find(r => r.id === parseInt(selectedReseller));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Assign QR Codes to Resellers</h1>
        <p className="text-blue-100">Manage QR code batch assignments and track distribution to resellers</p>
      </div>

      {/* Assignment Form */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Package className="mr-2" size={20} />
          New Assignment
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Reseller Selection */}
            <div>
              <label htmlFor="reseller" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline mr-1" size={16} />
                Select Reseller *
              </label>
              <select
                id="reseller"
                value={selectedReseller}
                onChange={(e) => setSelectedReseller(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose a reseller...</option>
                {resellers.map((reseller) => (
                  <option key={reseller.id} value={reseller.id}>
                    {reseller.name} - {reseller.region}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Reseller Info */}
            {selectedResellerData && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Reseller Information</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Email:</span> {selectedResellerData.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedResellerData.phone}</p>
                  <p><span className="font-medium">Region:</span> {selectedResellerData.region}</p>
                </div>
              </div>
            )}

            {/* Batch Details */}
            <div className="space-y-4">
              <div>
                <label htmlFor="batchName" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline mr-1" size={16} />
                  Batch Name *
                </label>
                <input
                  type="text"
                  id="batchName"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter batch name (e.g., Premium Q1 2024)"
                  required
                />
              </div>

              <div>
                <label htmlFor="batchDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="batchDescription"
                  value={batchDescription}
                  onChange={(e) => setBatchDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add notes about this batch assignment..."
                />
              </div>
            </div>
          </div>

          {/* Right Column - QR Code Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select QR Codes *
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedQRCodes.length === availableQRCodes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
              {availableQRCodes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    id={`qr-${code.id}`}
                    checked={selectedQRCodes.includes(code)}
                    onChange={() => handleQRCodeSelect(code)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <label htmlFor={`qr-${code.id}`} className="block text-sm font-medium text-gray-900 cursor-pointer">
                      {code.code}
                    </label>
                    <p className="text-xs text-gray-500">{code.product} | {code.batch}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Selected: {selectedQRCodes.length} of {availableQRCodes.length} QR codes
            </div>
          </div>
        </div>

        {/* Assignment Summary */}
        {selectedQRCodes.length > 0 && selectedResellerData && batchName && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Assignment Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Reseller:</span>
                <p className="font-medium">{selectedResellerData.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Batch Name:</span>
                <p className="font-medium">{batchName}</p>
              </div>
              <div>
                <span className="text-gray-500">QR Codes:</span>
                <p className="font-medium">{selectedQRCodes.length} codes</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setSelectedReseller('');
              setSelectedQRCodes([]);
              setBatchName('');
              setBatchDescription('');
            }}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Form
          </button>
          <button
            type="button"
            onClick={handleConfirmAssignment}
            disabled={!selectedReseller || selectedQRCodes.length === 0 || !batchName}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review Assignment
          </button>
        </div>
      </div>

      {/* Assignment Log */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Clock className="mr-2" size={20} />
          Assignment History
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reseller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignmentLog.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.batchName}</div>
                      <div className="text-sm text-gray-500">{log.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.reseller}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.qrCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.assignedDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Confirm Assignment</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Please review the assignment details before confirming:
              </p>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Reseller:</span>
                  <span className="text-sm">{selectedResellerData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Batch Name:</span>
                  <span className="text-sm">{batchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">QR Codes:</span>
                  <span className="text-sm">{selectedQRCodes.length} codes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Assignment Date:</span>
                  <span className="text-sm">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalAssign}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignResellerPage;