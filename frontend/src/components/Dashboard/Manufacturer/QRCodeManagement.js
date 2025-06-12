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
    try {
      const processedCodes = data.data.map((row, index) => ({
        id: index + 1,
        code: row[0] || `QR-${Math.random().toString(36).substr(2, 9)}`,
        status: 'Available',
        assignedTo: '-',
      }));
      setQrCodes(processedCodes);
    } catch (error) {
      console.error('Error processing CSV:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnError = (err) => {
    console.error('Error reading CSV:', err);
  };

  const generateQRCodes = () => {
    setLoading(true);
    try {
      const countNum = parseInt(count);
      if (isNaN(countNum) || countNum <= 0) {
        alert('Please enter a valid number');
        return;
      }

      const newCodes = Array.from({ length: countNum }, (_, index) => ({
        id: index + 1,
        code: `QR-${Math.random().toString(36).substr(2, 9)}`,
        status: 'Available',
        assignedTo: '-',
      }));

      setQrCodes(newCodes);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const csvContent = 'Code,Status,Assigned To\n' + qrCodes
        .map((code) => `${code.code},${code.status},${code.assignedTo}`)
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'qr_codes.csv';
      link.click();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  };

  // File input handler for CSV upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        const processedCodes = rows
          .filter(row => row[0] && row[0].trim())
          .map((row, index) => ({
            id: index + 1,
            code: row[0].trim() || `QR-${Math.random().toString(36).substr(2, 9)}`,
            status: 'Available',
            assignedTo: '-',
          }));
        setQrCodes(processedCodes);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
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
              <div className="flex items-center justify-center w-full">
                <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV files only</p>
                  </div>
                  <input 
                    id="csv-upload" 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden" 
                  />
                </label>
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
                    className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-md sm:text-sm border border-gray-300 px-3 py-2"
                    placeholder="Enter number of codes"
                  />
                  <button
                    onClick={generateQRCodes}
                    disabled={loading}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate'}
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