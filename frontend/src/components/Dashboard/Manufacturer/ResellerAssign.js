import React, { useState } from 'react';

const ResellerAssign = () => {
  const [selectedReseller, setSelectedReseller] = useState('');
  const [selectedQRCodes, setSelectedQRCodes] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const resellers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  const availableQRCodes = [
    { id: 1, code: 'QR-123456', status: 'Available' },
    { id: 2, code: 'QR-234567', status: 'Available' },
    { id: 3, code: 'QR-345678', status: 'Available' },
    { id: 4, code: 'QR-456789', status: 'Available' },
    { id: 5, code: 'QR-567890', status: 'Available' },
  ];

  const handleQRCodeSelect = (code) => {
    if (selectedQRCodes.includes(code)) {
      setSelectedQRCodes(selectedQRCodes.filter((c) => c !== code));
    } else {
      setSelectedQRCodes([...selectedQRCodes, code]);
    }
  };

  const handleAssign = async () => {
    if (!selectedReseller || selectedQRCodes.length === 0 || !batchName) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call to assign QR codes
      console.log('Assigning QR codes:', {
        resellerId: selectedReseller,
        qrCodes: selectedQRCodes,
        batchName,
      });
      
      // Reset form
      setSelectedReseller('');
      setSelectedQRCodes([]);
      setBatchName('');
      
      alert('QR codes assigned successfully!');
    } catch (error) {
      console.error('Error assigning QR codes:', error);
      alert('Failed to assign QR codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Assign QR Codes to Reseller
      </h1>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Reseller Selection */}
        <div>
          <label
            htmlFor="reseller"
            className="block text-sm font-medium text-gray-700"
          >
            Select Reseller
          </label>
          <select
            id="reseller"
            name="reseller"
            value={selectedReseller}
            onChange={(e) => setSelectedReseller(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select a reseller</option>
            {resellers.map((reseller) => (
              <option key={reseller.id} value={reseller.id}>
                {reseller.name} ({reseller.email})
              </option>
            ))}
          </select>
        </div>

        {/* Batch Name */}
        <div>
          <label
            htmlFor="batchName"
            className="block text-sm font-medium text-gray-700"
          >
            Batch Name
          </label>
          <input
            type="text"
            name="batchName"
            id="batchName"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter a name for this batch"
            required
          />
        </div>

        {/* QR Code Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select QR Codes
          </label>
          <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
            {availableQRCodes.map((code) => (
              <div
                key={code.id}
                className="flex items-center px-4 py-3 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  id={`qr-${code.id}`}
                  checked={selectedQRCodes.includes(code)}
                  onChange={() => handleQRCodeSelect(code)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`qr-${code.id}`}
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  {code.code}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {selectedQRCodes.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900">Assignment Summary</h3>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Selected QR Codes:</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {selectedQRCodes.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Batch Name:</dt>
                <dd className="text-sm font-medium text-gray-900">{batchName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Reseller:</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {resellers.find((r) => r.id === parseInt(selectedReseller))?.name}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setSelectedReseller('');
              setSelectedQRCodes([]);
              setBatchName('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? 'Assigning...' : 'Assign QR Codes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResellerAssign; 