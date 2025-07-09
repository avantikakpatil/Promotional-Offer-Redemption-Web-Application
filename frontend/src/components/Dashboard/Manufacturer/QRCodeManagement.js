import { 
  Upload, 
  Download, 
  QrCode, 
  Search, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  Hash,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Edit3
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeManagement = () => {
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('list');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  const qrDownloadRef = useRef();
  
  // Missing state variables
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [count, setCount] = useState('');

  const handleViewQR = (code) => {
    setSelectedQRCode(code);
    setShowQRModal(true);
  };

  const handleEditCode = (code) => {
    setEditingCode({ ...code });
    setShowEditModal(true);
  };
  
  const saveEditedCode = () => {
    if (!editingCode) return;
    
    setQrCodes(prev => prev.map(code => 
      code.id === editingCode.id ? editingCode : code
    ));
    setShowEditModal(false);
    setEditingCode(null);
  };
  
  const assignToReseller = (codeId, resellerName) => {
    setQrCodes(prev => prev.map(code => 
      code.id === codeId 
        ? { ...code, assignedTo: resellerName, status: resellerName === '-' ? 'Available' : 'Assigned' }
        : code
    ));
  };

  // Load campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = qrCodes;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(code => 
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(code => code.status.toLowerCase() === statusFilter);
    }
    
    setFilteredCodes(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [qrCodes, searchTerm, statusFilter]);

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/manufacturer/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      console.log('Fetched campaigns:', data); // Debug log
      setCampaigns(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      setCampaigns([]);
      setErrors({ campaign: 'Error fetching campaigns' });
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate QR codes using backend
  const generateQRCodes = async () => {
    const countNum = parseInt(count);
    if (isNaN(countNum) || countNum <= 0) {
      setErrors({ count: 'Please enter a valid number greater than 0' });
      return;
    }
    if (countNum > 1000) {
      setErrors({ count: 'Maximum 1,000 codes can be generated at once for performance' });
      return;
    }
    if (!selectedCampaignId) {
      setErrors({ campaign: 'Please select a campaign' });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const token = localStorage.getItem('token');
      const newCodes = [];
      // Find campaign info
      const campaign = campaigns.find(c => String(c.id) === String(selectedCampaignId));
      for (let i = 0; i < countNum; i++) {
        const codeString = `QR-${selectedCampaignId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Encode campaign info in QR
        const qrData = JSON.stringify({
          code: codeString,
          campaignId: selectedCampaignId,
          campaignName: campaign ? campaign.name : '',
          points: campaign ? campaign.points : '',
          startDate: campaign ? campaign.startDate : '',
          endDate: campaign ? campaign.endDate : '',
          rewardTiers: campaign && campaign.rewardTiers ? campaign.rewardTiers : [],
          createdAt: new Date().toISOString()
        });
        const res = await fetch('/api/manufacturer/qrcodes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: codeString, campaignId: selectedCampaignId }),
        });
        if (!res.ok) throw new Error('Failed to generate QR code');
        const qr = await res.json();
        // Attach qrData for QR image, use codeString as unique id
        newCodes.push({ ...qr, qrData, id: codeString });
      }
      setQrCodes(prev => [...prev, ...newCodes]);
      setCount('');
      setActiveTab('list');
    } catch (error) {
      setErrors({ count: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch QR codes for selected campaign
  const fetchQRCodesForCampaign = async (campaignId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/manufacturer/qrcodes/by-campaign/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch QR codes');
      const data = await res.json();
      console.log('Fetched QR codes:', data); // Debug log
      setQrCodes(Array.isArray(data) ? data.map(qr => {
        const campaign = campaigns.find(c => String(c.id) === String(qr.campaignId || qr.campaign));
        return {
          ...qr,
          qrData: JSON.stringify({
            code: qr.code,
            campaignId: qr.campaignId || qr.campaign,
            campaignName: campaign ? campaign.name : '-',
            points: campaign ? campaign.points : '',
            startDate: campaign ? campaign.startDate : '',
            endDate: campaign ? campaign.endDate : '',
            rewardTiers: campaign && campaign.rewardTiers ? campaign.rewardTiers : [],
            createdAt: qr.createdAt
          })
        };
      }) : []);
    } catch (error) {
      setQrCodes([]);
      setErrors({ qrcodes: 'Error fetching QR codes' });
      console.error('Error fetching QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    const errors = {};
    
    if (!file) {
      errors.file = 'Please select a file';
      return errors;
    }
    
    if (file.type !== 'text/csv') {
      errors.file = 'Please select a valid CSV file';
      return errors;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      errors.file = 'File size should be less than 5MB';
      return errors;
    }
    
    return errors;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const fileErrors = validateFile(file);
    
    if (Object.keys(fileErrors).length > 0) {
      setErrors(fileErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        
        // Skip header row if present
        const dataRows = rows[0][0].toLowerCase().includes('code') ? rows.slice(1) : rows;
        
        const processedCodes = dataRows
          .filter(row => row[0] && row[0].trim())
          .map((row, index) => ({
            id: Date.now() + index,
            code: row[0].trim(),
            status: 'Available',
            assignedTo: '-',
            campaign: selectedCampaignId || '-',
            createdAt: new Date().toLocaleDateString(),
            scans: 0,
            lastScanned: '-'
          }));
        
        if (processedCodes.length === 0) {
          setErrors({ file: 'No valid QR codes found in the file' });
          setLoading(false);
          return;
        }
        
        setPreviewData(processedCodes);
        setShowPreview(true);
        
      } catch (error) {
        console.error('Error processing CSV:', error);
        setErrors({ file: 'Error processing file. Please check the format.' });
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setErrors({ file: 'Error reading file' });
      setLoading(false);
    };
    
    reader.readAsText(file);
  };

  const confirmUpload = () => {
    setQrCodes(prev => [...prev, ...previewData]);
    setShowPreview(false);
    setPreviewData([]);
    // Reset file input
    const fileInput = document.getElementById('csv-upload');
    if (fileInput) fileInput.value = '';
  };

  const exportToCSV = () => {
    try {
      const codesToExport = selectedCodes.length > 0 
        ? qrCodes.filter(code => selectedCodes.includes(code.id))
        : filteredCodes;
      
      const csvContent = 'Code,Status,Assigned To,Campaign,Created At,Scans,Last Scanned\n' + 
        codesToExport
          .map((code) => `${code.code},${code.status},${code.assignedTo},${code.campaign},${code.createdAt},${code.scans},${code.lastScanned}`)
          .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `qr_codes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      // Clear selection after export
      setSelectedCodes([]);
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error exporting file. Please try again.');
    }
  };

  const deleteSelectedCodes = () => {
    if (selectedCodes.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedCodes.length} selected QR codes?`)) {
      setQrCodes(prev => prev.filter(code => !selectedCodes.map(String).includes(String(code.id))));
      setSelectedCodes([]);
    }
  };

  const handleSelectCode = (codeId) => {
    setSelectedCodes(prev => {
      const codeIdStr = String(codeId);
      return prev.map(String).includes(codeIdStr)
        ? prev.filter(id => String(id) !== codeIdStr)
        : [...prev, codeIdStr];
    });
  };

  const handleSelectAll = () => {
    const currentPageCodes = getCurrentPageCodes();
    const allSelected = currentPageCodes.every(code => selectedCodes.includes(code.id));
    
    if (allSelected) {
      setSelectedCodes(prev => prev.filter(id => !currentPageCodes.some(code => code.id === id)));
    } else {
      setSelectedCodes(prev => [...new Set([...prev, ...currentPageCodes.map(code => code.id)])]);
    }
  };

  const getCurrentPageCodes = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCodes.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);

  const getStatusBadgeClass = (status) => {
    if (!status || typeof status !== 'string') {
      return 'bg-gray-100 text-gray-800'; // fallback/default class
    }
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const refreshData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Optionally, fetch QR codes when a campaign is selected
  useEffect(() => {
    if (selectedCampaignId) {
      fetchQRCodesForCampaign(selectedCampaignId);
    } else {
      setQrCodes([]);
    }
  }, [selectedCampaignId]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <QrCode className="h-8 w-8 text-blue-600" />
                QR Code Management
              </h1>
              <p className="text-gray-600 mt-1">Generate, upload, and manage QR codes for your campaigns</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="text-sm text-gray-500">
                Total: {qrCodes.length} codes
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'upload', label: 'Upload CSV', icon: Upload },
              { id: 'generate', label: 'Generate Codes', icon: QrCode },
              { id: 'list', label: 'Manage Codes', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload CSV Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-900">CSV Upload Instructions</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Upload a CSV file with QR codes. The file should have a 'code' column or QR codes in the first column.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Campaign (Optional)
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={e => setSelectedCampaignId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Campaign</option>
                      {Array.isArray(campaigns) && campaigns.map(campaign => (
                        <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload CSV File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="cursor-pointer text-blue-600 hover:text-blue-800"
                      >
                        Click to upload CSV file
                      </label>
                      <p className="text-gray-500 text-sm mt-2">
                        Maximum file size: 5MB
                      </p>
                    </div>
                    {errors.file && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.file}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">CSV Format Example</h3>
                  <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`code
QR001
QR002
QR003`}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    Or simply list QR codes in the first column without headers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Codes Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-900">Generate QR Codes</h3>
                    <p className="text-green-700 text-sm mt-1">
                      Generate unique QR codes automatically for your campaigns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Campaign *
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={e => setSelectedCampaignId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Campaign</option>
                    {Array.isArray(campaigns) && campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                  {errors.campaign && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.campaign}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of QR Codes *
                  </label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder="Enter count (max 1,000)"
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.count && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.count}
                    </p>
                  )}
                </div>

                <button
                  onClick={generateQRCodes}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  {loading ? 'Generating...' : 'Generate QR Codes'}
                </button>
              </div>
            </div>
          )}

          {/* List/Manage Codes Tab */}
          {activeTab === 'list' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search codes or assignee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="used">Used</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  {selectedCodes.length > 0 && (
                    <button
                      onClick={deleteSelectedCodes}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete ({selectedCodes.length})
                    </button>
                  )}
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              

              {/* Table */}
              {filteredCodes.length > 0 ? (
                <>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={getCurrentPageCodes().length > 0 && getCurrentPageCodes().every(code => selectedCodes.includes(code.id))}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              Code
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Assigned To
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Campaign
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Created
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Scans
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getCurrentPageCodes().map((code) => (
                          <tr key={code.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedCodes.includes(code.id)}
                                onChange={() => handleSelectCode(code.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <button
                                  onClick={() => handleViewQR(code)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View QR Code"
                                >
                                  <QrCode className="h-4 w-4" />
                                </button>
                                {code.code}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(code.status)}`}>
                                {code.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {code.assignedTo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(() => {
                                if (code.campaign && typeof code.campaign === 'object' && code.campaign.name) return code.campaign.name;
                                if (code.campaign && typeof code.campaign === 'string') {
                                  const found = campaigns.find(c => c.id === code.campaign || c.name === code.campaign);
                                  return found ? found.name : code.campaign;
                                }
                                return '-';
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {code.createdAt}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {code.scans}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => handleEditCode(code)}
                                className="text-blue-600 hover:text-blue-800 mr-3"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCodes.length)} of {filteredCodes.length} results
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 text-sm rounded ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'Upload CSV or generate codes to get started'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload CSV
                      </button>
                      <button
                        onClick={() => setActiveTab('generate')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Generate Codes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File Upload Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Preview QR Codes</h3>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewData([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Found {previewData.length} QR codes. Review and confirm to add them.
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewData.slice(0, 50).map((code, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="font-mono text-sm text-gray-900">{code.code}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Campaign: {code.campaign || 'Not assigned'}
                    </div>
                  </div>
                ))}
                {previewData.length > 50 && (
                  <div className="col-span-full text-center text-gray-500 text-sm">
                    ... and {previewData.length - 50} more codes
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData([]);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Edit QR Code</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCode(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  value={editingCode.code}
                  onChange={(e) => setEditingCode(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editingCode.status}
                  onChange={(e) => setEditingCode(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Used">Used</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
                <select
                  value={editingCode.campaign}
                  onChange={(e) => setEditingCode(prev => ({ ...prev, campaign: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.isArray(campaigns) && campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.name}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <select
                  value={editingCode.assignedTo}
                  onChange={(e) => setEditingCode(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="-">Unassigned</option>
                  {resellers.map(reseller => (
                    <option key={reseller.id} value={reseller.name}>
                      {reseller.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCode(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">QR Code Preview</h3>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedQRCode(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <QRCodeCanvas
                value={selectedQRCode.qrData || JSON.stringify({
                  code: selectedQRCode.code,
                  campaignId: selectedQRCode.campaignId || selectedQRCode.campaign,
                  campaignName: (() => {
                    if (selectedQRCode.campaign && typeof selectedQRCode.campaign === 'object' && selectedQRCode.campaign.name) return selectedQRCode.campaign.name;
                    if (selectedQRCode.campaign && typeof selectedQRCode.campaign === 'string') {
                      const found = campaigns.find(c => c.id === selectedQRCode.campaign || c.name === selectedQRCode.campaign);
                      return found ? found.name : selectedQRCode.campaign;
                    }
                    return '-';
                  })(),
                  createdAt: selectedQRCode.createdAt
                })}
                size={220}
                includeMargin={true}
                ref={qrDownloadRef}
                id="qr-download-canvas"
              />
              <div className="text-center">
                <div className="font-mono text-sm text-gray-900">{selectedQRCode.code}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Campaign: {(() => {
                    if (selectedQRCode.campaign && typeof selectedQRCode.campaign === 'object' && selectedQRCode.campaign.name) return selectedQRCode.campaign.name;
                    if (selectedQRCode.campaign && typeof selectedQRCode.campaign === 'string') {
                      const found = campaigns.find(c => c.id === selectedQRCode.campaign || c.name === selectedQRCode.campaign);
                      return found ? found.name : selectedQRCode.campaign;
                    }
                    return '-';
                  })()}
                </div>
              </div>
              <button
                onClick={() => {
                  // Download QR as PNG using ref
                  const canvas = qrDownloadRef.current;
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${selectedQRCode.code}.png`;
                    link.click();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mt-2"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManagement;

// In your backend's ServiceRegistration.cs or Program.cs, ensure you have:
// services.AddScoped<IQRCodeService, QRCodeService>();
// This line must be present to resolve IQRCodeService for QRCodeController.