import React, { useState, useEffect, useRef } from 'react';
import { Gift, Star, DollarSign, Calendar, QrCode, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle, User, Tag, Package, Clock, MapPin } from 'lucide-react';
import { generateQRCodeDataURL } from '../../../utils/qrGenerator';

const VouchersWithQR = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [printing, setPrinting] = useState({});
  const [feedback, setFeedback] = useState({});
  const [filter, setFilter] = useState('all'); // all, active, redeemed, expired
  const [qrDataURLs, setQrDataURLs] = useState({});
  const cardRefs = useRef({});

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    // Generate QR code images for vouchers
    const generateQRCodes = async () => {
      try {
        const qrImageMap = {};
        for (const voucher of vouchers) {
          // Use qrCode as QR data if present, else fallback to voucherCode
          const qrData = voucher.qrCode && voucher.qrCode.trim()
            ? voucher.qrCode.trim()
            : voucher.voucherCode;
          if (qrData) {
            console.log('Generating QR for voucher', voucher.voucherCode, 'payload:', qrData);
            qrImageMap[voucher.voucherCode] = await generateQRCodeDataURL(qrData, {
              size: 300, // Larger QR for better scanning
              margin: 2,
              color: {
                dark: '#000000',
                light: '#ffffff'
              }
            });
          }
        }
        setQrDataURLs(qrImageMap);
      } catch (err) {
        console.error('Error generating QR codes:', err);
        console.warn('FALLBACK: Using text-based QR codes only.');
        // Fallback: create text-based QR codes
        const fallbackQRMap = {};
        vouchers.forEach(voucher => {
          const qrData = voucher.qrCode && voucher.qrCode.trim() 
            ? voucher.qrCode 
            : voucher.voucherCode;
          console.log('Fallback QR for voucher', voucher.voucherCode, 'data:', qrData);
          fallbackQRMap[voucher.voucherCode] = qrData;
        });
        setQrDataURLs(fallbackQRMap);
      }
    };
    
    if (vouchers.length > 0) {
      generateQRCodes();
    }
  }, [vouchers]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reseller/vouchers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform data to match all voucher table fields
        const transformedVouchers = Array.isArray(data) ? data.map(voucher => ({
          id: voucher.id,
          voucherCode: voucher.voucherCode,
          resellerId: voucher.resellerId,
          campaignId: voucher.campaignId,
          value: voucher.value,
          pointsRequired: voucher.pointsRequired,
          eligibleProducts: voucher.eligibleProducts || [],
          isRedeemed: voucher.isRedeemed,
          redeemedAt: voucher.redeemedAt,
          redeemedByShopkeeperId: voucher.redeemedByShopkeeperId,
          expiryDate: voucher.expiryDate,
          createdAt: voucher.createdAt,
          updatedAt: voucher.updatedAt,
          qrCode: voucher.qrCode, // Make sure this field is included
          // Additional related data
          campaign: voucher.campaign,
          redeemedByShopkeeper: voucher.redeemedByShopkeeper
        })) : [];
        setVouchers(transformedVouchers);
      } else {
        throw new Error('Failed to fetch vouchers');
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (voucherCode) => {
    setDownloading(prev => ({ ...prev, [voucherCode]: true }));
    setFeedback(prev => ({ ...prev, [voucherCode]: '' }));
    
    try {
      const voucher = vouchers.find(v => v.voucherCode === voucherCode);
      if (!voucher) throw new Error('Voucher not found');
      
      // Create a larger canvas for the voucher to fit a bigger QR
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 900;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Title
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GIFT VOUCHER', canvas.width / 2, 80);

      // Voucher code
      ctx.font = 'bold 28px monospace';
      ctx.fillText(voucherCode, canvas.width / 2, 140);

      // Value
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(`₹${voucher.value}`, canvas.width / 2, 200);
      
      // QR Code - try to draw the actual QR code if available
      if (qrDataURLs[voucherCode] && typeof qrDataURLs[voucherCode] === 'string' && qrDataURLs[voucherCode].startsWith('data:')) {
        try {
          const qrImage = new Image();
          qrImage.onload = () => {
            // Draw a large QR code in the center
            ctx.drawImage(qrImage, canvas.width / 2 - 150, 240, 300, 300);

            // Additional info
            ctx.fillStyle = '#374151';
            ctx.font = '24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Scan to redeem this voucher', 60, 580);
            ctx.font = '20px Arial';
            ctx.fillText(`Valid until: ${voucher.expiryDate ? new Date(voucher.expiryDate).toLocaleDateString() : 'N/A'}`, 60, 620);
            ctx.fillText(`Campaign: ${voucher.campaign?.name || 'N/A'}`, 60, 660);

            // Download the canvas
            const link = document.createElement('a');
            link.download = `voucher-${voucherCode}.png`;
            link.href = canvas.toDataURL();
            link.click();

            setFeedback(prev => ({ ...prev, [voucherCode]: 'Downloaded successfully!' }));
          };
          qrImage.src = qrDataURLs[voucherCode];
        } catch (qrError) {
          console.error('QR image load error:', qrError);
          // Fallback to text-based QR
          drawFallbackQR();
        }
      } else {
        drawFallbackQR();
      }
      
      function drawFallbackQR() {
        // QR Code placeholder with text
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(canvas.width / 2 - 150, 240, 300, 300);
        ctx.strokeStyle = '#d1d5db';
        ctx.strokeRect(canvas.width / 2 - 150, 240, 300, 300);

        ctx.fillStyle = '#6b7280';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', canvas.width / 2, 390);
        ctx.fillText(voucher.qrCode || voucherCode, canvas.width / 2, 420);

        // Additional info
        ctx.fillStyle = '#374151';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Scan to redeem this voucher', 60, 580);
        ctx.font = '20px Arial';
        ctx.fillText(`Valid until: ${voucher.expiryDate ? new Date(voucher.expiryDate).toLocaleDateString() : 'N/A'}`, 60, 620);
        ctx.fillText(`Campaign: ${voucher.campaign?.name || 'N/A'}`, 60, 660);

        const link = document.createElement('a');
        link.download = `voucher-${voucherCode}.png`;
        link.href = canvas.toDataURL();
        link.click();

        setFeedback(prev => ({ ...prev, [voucherCode]: 'Downloaded successfully!' }));
      }
      
    } catch (err) {
      console.error('Download error:', err);
      setFeedback(prev => ({ ...prev, [voucherCode]: 'Download failed' }));
    } finally {
      setDownloading(prev => ({ ...prev, [voucherCode]: false }));
    }
  };

  const handlePrint = (voucherCode) => {
    setPrinting(prev => ({ ...prev, [voucherCode]: true }));
    setFeedback(prev => ({ ...prev, [voucherCode]: '' }));
    
    try {
      const card = cardRefs.current[voucherCode];
      if (!card) throw new Error('Voucher card not found');
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Voucher - ${voucherCode}</title>
            <style>
              body { margin: 0; font-family: Arial, sans-serif; }
              .voucher-card { 
                width: 350px; 
                margin: 20px auto; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                border-radius: 12px; 
                padding: 24px; 
                border: 2px solid #e5e7eb;
                page-break-inside: avoid;
              }
              @media print {
                .no-print { display: none; }
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${card.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        setPrinting(prev => ({ ...prev, [voucherCode]: false }));
        setFeedback(prev => ({ ...prev, [voucherCode]: 'Printed successfully!' }));
      }, 500);
    } catch (err) {
      console.error('Print error:', err);
      setFeedback(prev => ({ ...prev, [voucherCode]: 'Print failed' }));
      setPrinting(prev => ({ ...prev, [voucherCode]: false }));
    }
  };

  const getVoucherStatus = (voucher) => {
    const now = new Date();
    const expiryDate = new Date(voucher.expiryDate);
    
    if (voucher.isRedeemed) {
      return { status: 'redeemed', color: 'bg-red-100 text-red-700', icon: XCircle };
    } else if (expiryDate < now) {
      return { status: 'expired', color: 'bg-gray-100 text-gray-700', icon: Clock };
    } else {
      return { status: 'active', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }
  };

  const filteredVouchers = vouchers.filter(voucher => {
    if (filter === 'all') return true;
    const { status } = getVoucherStatus(voucher);
    return status === filter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
        <span className="text-lg">Loading vouchers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700 py-2">Filter by status:</span>
        {[
          { key: 'all', label: 'All Vouchers', count: vouchers.length },
          { key: 'active', label: 'Active', count: vouchers.filter(v => getVoucherStatus(v).status === 'active').length },
          { key: 'redeemed', label: 'Redeemed', count: vouchers.filter(v => getVoucherStatus(v).status === 'redeemed').length },
          { key: 'expired', label: 'Expired', count: vouchers.filter(v => getVoucherStatus(v).status === 'expired').length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-blue-50 border'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Vouchers Grid */}
      {filteredVouchers.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <QrCode className="mx-auto mb-4 text-gray-400" size={64} />
          <p className="text-lg">No vouchers found for the selected filter.</p>
          <button
            onClick={fetchVouchers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Vouchers
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVouchers.map((voucher) => {
            const voucherStatus = getVoucherStatus(voucher);
            const StatusIcon = voucherStatus.icon;
            const qrDisplayData = voucher.qrCode && voucher.qrCode.trim() ? voucher.qrCode : voucher.voucherCode;
            
            return (
              <div
                key={voucher.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden voucher-card"
                ref={el => (cardRefs.current[voucher.voucherCode] = el)}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">GIFT VOUCHER</h3>
                      <p className="text-blue-100 text-sm">ID: {voucher.id}</p>
                    </div>
                    <Gift className="text-blue-200" size={32} />
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6 space-y-4">
                  {/* QR Code and Value */}
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      {qrDataURLs[voucher.voucherCode] && typeof qrDataURLs[voucher.voucherCode] === 'string' && qrDataURLs[voucher.voucherCode].startsWith('data:') ? (
                        <img 
                          src={qrDataURLs[voucher.voucherCode]} 
                          alt="QR Code" 
                          width={100} 
                          height={100}
                          className="border border-gray-200 rounded"
                        />
                      ) : (
                        <div className="w-[100px] h-[100px] flex flex-col items-center justify-center bg-gray-100 border border-gray-300 rounded text-center">
                          <QrCode size={24} className="text-gray-600 mb-1" />
                          <span className="text-xs text-gray-600 break-all px-1">
                            {qrDisplayData}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Scan to redeem</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">₹{voucher.value}</div>
                      <div className="text-sm text-gray-500">{voucher.pointsRequired} points</div>
                    </div>
                  </div>

                  {/* Voucher Code */}
                  <div className="text-center py-2 bg-gray-50 rounded-lg">
                    <div className="font-mono text-lg font-bold tracking-wider">
                      {voucher.voucherCode}
                    </div>
                  </div>

                  {/* QR Code Display */}
                  {qrDisplayData && (
                    <div className="text-center py-2 bg-blue-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">QR Code:</div>
                      <div className="font-mono text-sm text-blue-700 break-all">
                        {qrDisplayData}
                      </div>
                    </div>
                  )}

                  {/* Campaign Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="mr-2" size={16} />
                      <span className="font-medium">Campaign:</span>
                      <span className="ml-1">{voucher.campaign?.name || 'N/A'}</span>
                    </div>
                    
                    {Array.isArray(voucher.eligibleProducts) && voucher.eligibleProducts.length > 0 && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Package className="mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                          <span className="font-medium">Eligible Products:</span>
                          <div className="ml-1 text-xs">
                            {voucher.eligibleProducts.slice(0, 2).map((product, idx) => 
                              typeof product === 'string' ? product : (product?.name || `Product ${idx + 1}`)
                            ).join(', ')}
                            {voucher.eligibleProducts.length > 2 && ` +${voucher.eligibleProducts.length - 2} more`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status and Dates */}
                  <div className="space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${voucherStatus.color}`}>
                      <StatusIcon size={12} />
                      {voucherStatus.status.charAt(0).toUpperCase() + voucherStatus.status.slice(1)}
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="mr-1" size={12} />
                        <span>Created: {formatDate(voucher.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1" size={12} />
                        <span>Expires: {formatDate(voucher.expiryDate)}</span>
                      </div>
                      {voucher.isRedeemed && voucher.redeemedAt && (
                        <div className="flex items-center text-red-600">
                          <CheckCircle className="mr-1" size={12} />
                          <span>Redeemed: {formatDate(voucher.redeemedAt)}</span>
                        </div>
                      )}
                      {voucher.redeemedByShopkeeper && (
                        <div className="flex items-center text-blue-600">
                          <User className="mr-1" size={12} />
                          <span>By: {voucher.redeemedByShopkeeper.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 no-print">
                    <button
                      onClick={() => handleDownload(voucher.voucherCode)}
                      disabled={downloading[voucher.voucherCode]}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      {downloading[voucher.voucherCode] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Download size={14} />
                      )}
                      {downloading[voucher.voucherCode] ? 'Downloading...' : 'Download'}
                    </button>
                    
                    <button
                      onClick={() => handlePrint(voucher.voucherCode)}
                      disabled={printing[voucher.voucherCode]}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      {printing[voucher.voucherCode] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <QrCode size={14} />
                      )}
                      {printing[voucher.voucherCode] ? 'Printing...' : 'Print'}
                    </button>
                  </div>

                  {/* Feedback Message */}
                  {feedback[voucher.voucherCode] && (
                    <div className="text-center text-xs text-green-600 font-medium py-1">
                      {feedback[voucher.voucherCode]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Rest of the Vouchers component remains the same...
const Vouchers = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingVoucher, setGeneratingVoucher] = useState({});
  const [voucherInfo, setVoucherInfo] = useState({});
  const [view, setView] = useState('generate');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch('/api/reseller/order/available-campaigns', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
        
        // Fetch voucher info for each campaign
        for (const campaign of data) {
          await fetchVoucherInfo(campaign.id);
        }
      } else {
        throw new Error('Failed to fetch campaigns');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherInfo = async (campaignId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reseller/order/campaign/${campaignId}/voucher-info`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVoucherInfo(prev => ({
          ...prev,
          [campaignId]: data
        }));
      }
    } catch (err) {
      console.error(`Error fetching voucher info for campaign ${campaignId}:`, err);
    }
  };

  const generateVoucher = async (campaignId) => {
    try {
      setGeneratingVoucher(prev => ({ ...prev, [campaignId]: true }));
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/reseller/order/campaign/${campaignId}/generate-voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Success! Generated ${data.voucherDetails.vouchersGenerated} voucher(s) worth ₹${data.voucherDetails.totalValue}`);
        
        // Refresh voucher info
        await fetchVoucherInfo(campaignId);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error generating voucher:', err);
      alert('Failed to generate voucher. Please try again.');
    } finally {
      setGeneratingVoucher(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (canGenerate) => {
    return canGenerate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setView('generate')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
            view === 'generate' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
          }`}
        >
          <Gift size={20} />
          Generate Vouchers
        </button>
        <button
          onClick={() => setView('show')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
            view === 'show' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
          }`}
        >
          <QrCode size={20} />
          My Vouchers
        </button>
      </div>

      {/* Voucher Generation UI */}
      {view === 'generate' && (
        <>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Voucher Generation</h1>
                <p className="text-gray-600 mt-2">Generate vouchers from your campaign points</p>
              </div>
              <button
                onClick={fetchCampaigns}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center py-8">
                <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={fetchCampaigns}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Campaigns List */}
          {!loading && !error && (
            <div className="space-y-6">
              {campaigns.map((campaign) => {
                const info = voucherInfo[campaign.id];
                const canGenerate = info?.voucherGeneration?.canGenerate || false;
                const vouchersCanGenerate = info?.voucherGeneration?.vouchersCanGenerate || 0;
                const pointsNeeded = info?.voucherGeneration?.pointsNeeded || 0;
                const nextVoucherValue = info?.voucherGeneration?.nextVoucherValue || 0;

                return (
                  <div key={campaign.id} className="bg-white rounded-lg shadow-lg">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-800">{campaign.name}</h2>
                          <p className="text-gray-600 mt-1">{campaign.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Manufacturer: {campaign.manufacturer?.name}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(canGenerate)}`}>
                          {canGenerate ? 'Can Generate Vouchers' : 'Cannot Generate Vouchers'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Voucher Settings */}
                      {info?.voucherSettings?.isConfigured ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <DollarSign className="text-green-600 mr-3" size={20} />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Voucher Value</p>
                                <p className="text-2xl font-bold text-green-600">
                                  ₹{info.voucherSettings.value}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <Calendar className="text-purple-600 mr-3" size={20} />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Valid For</p>
                                <p className="text-2xl font-bold text-purple-600">
                                  {info.voucherSettings.validityDays} days
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                          <div className="flex items-center">
                            <AlertTriangle className="text-yellow-600 mr-3" size={20} />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                Voucher generation not configured
                              </p>
                              <p className="text-sm text-yellow-700">
                                The manufacturer has not set up voucher generation for this campaign.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Current Status */}
                      {info?.currentStatus && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Total Points Earned</p>
                            <p className="text-xl font-bold text-gray-900">
                              {info.currentStatus.totalPointsEarned}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Points Used</p>
                            <p className="text-xl font-bold text-red-600">
                              {info.currentStatus.pointsUsedForVouchers}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Available Points</p>
                            <p className="text-xl font-bold text-green-600">
                              {info.currentStatus.availablePoints}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Vouchers Generated</p>
                            <p className="text-xl font-bold text-blue-600">
                              {info.currentStatus.totalVouchersGenerated}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Voucher Generation */}
                      {info?.voucherSettings?.isConfigured && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Voucher Generation
                              </h3>
                              {canGenerate ? (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">
                                    You can generate{' '}
                                    <span className="font-semibold text-green-600">
                                      {vouchersCanGenerate}
                                    </span>{' '}
                                    voucher(s)
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Each voucher will be worth{' '}
                                    <span className="font-semibold text-green-600">
                                      ₹{nextVoucherValue}
                                    </span>
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">
                                    You need{' '}
                                    <span className="font-semibold text-red-600">
                                      {pointsNeeded}
                                    </span>{' '}
                                    more points to generate a voucher
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Each voucher requires{' '}
                                    <span className="font-semibold text-red-600">
                                      {info.voucherSettings.threshold}
                                    </span>{' '}
                                    points
                                  </p>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => generateVoucher(campaign.id)}
                              disabled={!canGenerate || generatingVoucher[campaign.id]}
                              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                canGenerate
                                  ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {generatingVoucher[campaign.id] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Gift size={16} />
                              )}
                              {generatingVoucher[campaign.id] ? 'Generating...' : 'Generate Voucher'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Show Vouchers with QR */}
      {view === 'show' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your Generated Vouchers</h2>
              <p className="text-gray-600 mt-1">Manage and download your vouchers with QR codes</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <QrCode size={16} />
              <span>Scan QR codes for easy redemption</span>
            </div>
          </div>
          <VouchersWithQR />
        </div>
      )}
    </div>
  );
};

export default Vouchers;