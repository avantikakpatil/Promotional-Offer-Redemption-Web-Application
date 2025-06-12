import React, { useState } from 'react';
import { useCSVReader } from 'react-papaparse';

const QRCodeManagement = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [qrCodes, setQrCodes] = useState([]);
  const [count, setCount] = useState('');
  const [loading, setLoading] = useState(false);
  const { CSVReader } = useCSVReader();

  const handleOnDrop = (data) => {
    setLoading(true);
    // Process CSV data
    const processedCodes = data.map((row, index) => ({
      id: index + 1,
      code: row.data[0] || `QR-${Math.random().toString(36).substr(2, 9)}`,
      status: 'Available',
      assignedTo: '-',
    }));
    setQrCodes(processedCodes);
    setLoading(false);
  };

  const handleOnError = (err) => {
    console.error('Error reading CSV:', err);
  };

  const generateQRCodes = () => {
    setLoading(true);
    const count = parseInt(count);
    if (isNaN(count) || count <= 0) {
      alert('Please enter a valid number');
      setLoading(false);
      return;
    }

    const newCodes = Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      code: `QR-${Math.random().toString(36).substr(2, 9)}`,
      status: 'Available',
      assignedTo: '-',
    }));

    setQrCodes(newCodes);
    setLoading(false);
  };

  const exportToCSV = () => {
    const csvContent = qrCodes
      .map((code) => `${code.code},${code.status},${code.assignedTo}`)
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'qr_codes.csv';
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">QR Code Management</h1>
        {qrCodes.length > 0 && (
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export to CSV
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('upload')}
              className={`${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Upload CSV
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`${
                activeTab === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Generate Codes
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <CSVReader
                  onDrop={handleOnDrop}
                  onError={handleOnError}
                  addRemoveButton
                  config={{
                    header: false,
                  }}
                >
                  <span>Drop CSV file here or click to upload.</span>
                </CSVReader>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="count"
                  className="block text-sm font-medium text-gray-700"
                >
                  Number of QR Codes to Generate
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="number"
                    name="count"
                    id="count"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                    placeholder="Enter number of codes"
                  />
                  <button
                    onClick={generateQRCodes}
                    disabled={loading}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {qrCodes.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          QR Code
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Assigned To
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {qrCodes.map((code) => (
                        <tr key={code.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {code.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {code.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {code.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {code.assignedTo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManagement; 