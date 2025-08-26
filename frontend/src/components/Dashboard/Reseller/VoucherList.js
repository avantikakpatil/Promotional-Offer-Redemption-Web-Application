import React, { useState, useEffect, useRef } from 'react';
import { Gift, QrCode, Download, RefreshCw, CheckCircle, XCircle, User, Tag, Package, Clock } from 'lucide-react';
import { generateQRCodeDataURL } from '../../../utils/qrGenerator';

const VoucherList = ({ vouchers, freeProductVouchers }) => {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [printing, setPrinting] = useState({});
  const [feedback, setFeedback] = useState({});
  const [filter, setFilter] = useState('all'); // all, active, redeemed, expired
  const [qrDataURLs, setQrDataURLs] = useState({});
  const [selectedVoucher, setSelectedVoucher] = useState(null); // New state for selected voucher
  const cardRefs = useRef({});

  useEffect(() => {
    if (vouchers) {
      setLoading(false);
    }
  }, [vouchers]);

  useEffect(() => {
    const generateQRCodes = async () => {
      try {
        const qrImageMap = {};
        if (vouchers) {
          for (const voucher of vouchers) {
            const qrData = voucher.qrCode && voucher.qrCode.trim() 
              ? voucher.qrCode.trim()
              : voucher.voucherCode;
            if (qrData) {
              qrImageMap[voucher.voucherCode] = await generateQRCodeDataURL(qrData, {
                size: 300,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#ffffff'
                }
              });
            }
          }
        }
        setQrDataURLs(qrImageMap);
      } catch (err) {
        console.error('Error generating QR codes:', err);
        const fallbackQRMap = {};
        if (vouchers) {
          vouchers.forEach(voucher => {
            const qrData = voucher.qrCode && voucher.qrCode.trim() 
              ? voucher.qrCode 
              : voucher.voucherCode;
            fallbackQRMap[voucher.voucherCode] = qrData;
          });
        }
        setQrDataURLs(fallbackQRMap);
      }
    };
    
    if (vouchers && vouchers.length > 0) {
      generateQRCodes();
    }
  }, [vouchers]);

  const parseEligibleProducts = (productsString) => {
        if (!productsString) {
            return [];
        }
        try {
            const products = JSON.parse(productsString);
            return Array.isArray(products) ? products : [];
        } catch (error) {
            console.error("Failed to parse eligible products:", error);
            return [];
        }
    };

  const handleDownload = async (voucherCode) => {
    setDownloading(prev => ({ ...prev, [voucherCode]: true }));
    setFeedback(prev => ({ ...prev, [voucherCode]: '' }));
    
    try {
      const voucher = vouchers.find(v => v.voucherCode === voucherCode);
      if (!voucher) throw new Error('Voucher not found');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 900;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GIFT VOUCHER', canvas.width / 2, 80);

      ctx.font = 'bold 28px monospace';
      ctx.fillText(voucherCode, canvas.width / 2, 140);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(`₹${voucher.value}`, canvas.width / 2, 200);
      
      if (qrDataURLs[voucherCode] && typeof qrDataURLs[voucherCode] === 'string' && qrDataURLs[voucherCode].startsWith('data:')) {
        try {
          const qrImage = new Image();
          qrImage.onload = () => {
            ctx.drawImage(qrImage, canvas.width / 2 - 150, 240, 300, 300);

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
          };
          qrImage.src = qrDataURLs[voucherCode];
        } catch (qrError) {
          console.error('QR image load error:', qrError);
          drawFallbackQR();
        }
      } else {
        drawFallbackQR();
      }
      
      function drawFallbackQR() {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(canvas.width / 2 - 150, 240, 300, 300);
        ctx.strokeStyle = '#d1d5db';
        ctx.strokeRect(canvas.width / 2 - 150, 240, 300, 300);

        ctx.fillStyle = '#6b7280';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', canvas.width / 2, 390);
        ctx.fillText(voucher.qrCode || voucherCode, canvas.width / 2, 420);

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

  const filteredVouchers = vouchers ? vouchers.filter(voucher => {
    if (filter === 'all') return true;
    const { status } = getVoucherStatus(voucher);
    return status === filter;
  }) : [];

  const filteredFreeProductVouchers = freeProductVouchers || [];

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

  const showVoucherDetails = (voucher) => {
    setSelectedVoucher(voucher);
  };

  const closeVoucherDetails = () => {
    setSelectedVoucher(null);
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
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 w-full mb-2">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        </div>
        {[ 
          { key: 'all', label: 'All Vouchers', count: vouchers?.length || 0 },
          { key: 'active', label: 'Active', count: vouchers?.filter(v => getVoucherStatus(v).status === 'active').length || 0 },
          { key: 'redeemed', label: 'Redeemed', count: vouchers?.filter(v => getVoucherStatus(v).status === 'redeemed').length || 0 },
          { key: 'expired', label: 'Expired', count: vouchers?.filter(v => getVoucherStatus(v).status === 'expired').length || 0 }
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

      {filteredVouchers.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <QrCode className="mx-auto mb-4 text-gray-400" size={64} />
          <p className="text-lg">No vouchers found for the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVouchers.map((voucher) => {
            const voucherStatus = getVoucherStatus(voucher);
            const StatusIcon = voucherStatus.icon;
            const qrDisplayData = voucher.qrCode && voucher.qrCode.trim() ? voucher.qrCode : voucher.voucherCode;
            const eligibleProducts = parseEligibleProducts(voucher.eligibleProducts);
            return (
              <div
                key={voucher.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden voucher-card"
                ref={el => (cardRefs.current[voucher.voucherCode] = el)}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">GIFT VOUCHER</h3>
                      <p className="text-blue-100 text-sm">ID: {voucher.id}</p>
                    </div>
                    <Gift className="text-blue-200" size={32} />
                  </div>
                </div>

                <div className="p-6 space-y-4">
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

                  <div className="text-center py-2 bg-gray-50 rounded-lg">
                    <div className="font-mono text-lg font-bold tracking-wider">
                      {voucher.voucherCode}
                    </div>
                  </div>

                  {qrDisplayData && (
                    <div className="text-center py-2 bg-blue-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">QR Code:</div>
                      <div className="font-mono text-sm text-blue-700 break-all">
                        {qrDisplayData}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="mr-2" size={16} />
                      <span className="font-medium">Campaign:</span>
                      <span className="ml-1">{voucher.campaignName || 'N/A'}</span>
                    </div>
                    
                    {eligibleProducts.length > 0 && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Package className="mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                          <span className="font-medium">Eligible Products:</span>
                          <div className="ml-1 text-xs">
                            {eligibleProducts.slice(0, 2).map((product, idx) => (
                                <span key={idx}>
                                    {product.name || `Product ${product.id}`}
                                    {idx < eligibleProducts.slice(0, 2).length - 1 && ', '}
                                </span>
                            ))}
                            {eligibleProducts.length > 2 && ` +${eligibleProducts.length - 2} more`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${voucherStatus.color}`}>
                      <StatusIcon size={12} />
                      {voucherStatus.status.charAt(0).toUpperCase() + voucherStatus.status.slice(1)}
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
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

      {filteredFreeProductVouchers.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-blue-600" /> 
              Free Product Vouchers ({filteredFreeProductVouchers.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredFreeProductVouchers.map(fpv => (
               <div key={fpv.id} className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                 <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white">
                   <div className="flex items-center justify-between">
                     <div>
                       <h3 className="font-bold text-lg">FREE PRODUCT VOUCHER</h3>
                       <p className="text-blue-100 text-sm">ID: {fpv.id}</p>
                     </div>
                     <Package className="text-blue-200" size={32} />
                   </div>
                 </div>

                 <div className="p-6 space-y-4">
                   <div className="text-center">
                     <div className="text-3xl font-bold text-green-600 mb-2">
                       {fpv.freeProductQty} x {fpv.freeProduct?.name || `Product ${fpv.freeProductId}`}
                     </div>
                     <div className="space-y-1 text-sm text-gray-600">
                       <div>Free: {fpv.freeProduct?.name || `Product ${fpv.freeProductId}`} ({fpv.freeProduct?.sku || 'N/A'})</div>
                       <div>Eligible: {fpv.eligibleProduct?.name || `Product ${fpv.eligibleProductId}`} ({fpv.eligibleProduct?.sku || 'N/A'})</div>
                     </div>
                   </div>

                   {fpv.message && (
                     <div className="bg-blue-50 rounded-lg p-3">
                       <div className="text-xs text-gray-600 mb-1 font-medium">Message:</div>
                       <div className="text-sm text-blue-700">
                         {fpv.message}
                       </div>
                     </div>
                   )}

                   <div className="flex items-center text-sm text-gray-600">
                     <Tag className="mr-2" size={16} />
                     <span className="font-medium">Campaign:</span>
                     <span className="ml-1">{fpv.campaign?.name || `Campaign ${fpv.campaignId}`}</span>
                   </div>

                   <div className="text-xs text-gray-500 flex items-center">
                     <Clock className="mr-1" size={12} />
                     <span>Created: {formatDate(fpv.createdAt)}</span>
                   </div>

                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                     <CheckCircle size={12} />
                     Active
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default VoucherList;