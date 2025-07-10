export async function fetchQRInfo(qrRawString) {
  const token = localStorage.getItem('token');
  console.log('Fetching QR info for:', qrRawString);
  try {
    const response = await fetch('/api/customer/qrcodes/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ qrRawString })
    });
    const result = await response.json();
    console.log('QR Info Response:', {
      status: response.status,
      ok: response.ok,
      result: result
    });
    if (!response.ok) {
      return handleQRInfoError(result);
    }
    if (!result || typeof result !== 'object') {
      return { 
        error: true, 
        message: 'Invalid response from server.',
        errorCode: 'INVALID_RESPONSE',
        type: 'server_error'
      };
    }
    return result;
  } catch (error) {
    console.error('Network error in fetchQRInfo:', error);
    return { 
      error: true, 
      message: 'Network error. Please check your connection and try again.',
      errorCode: 'NETWORK_ERROR',
      type: 'network_error'
    };
  }
}

function handleQRInfoError(result) {
  const errorCode = result.errorCode || 'UNKNOWN_ERROR';
  const message = result.error || result.message || 'Failed to fetch QR info.';
  switch (errorCode) {
    case 'ALREADY_REDEEMED':
      return { 
        error: true, 
        message: message || 'This QR code has already been redeemed.',
        errorCode: 'ALREADY_REDEEMED',
        type: 'already_redeemed'
      };
    case 'INVALID_QR_CODE':
      return { 
        error: true, 
        message: message || 'Invalid QR code. This QR code does not exist in our system.',
        errorCode: 'INVALID_QR_CODE',
        type: 'invalid_qr'
      };
    case 'CAMPAIGN_INACTIVE':
      return { 
        error: true, 
        message: message || 'This campaign is not active.',
        errorCode: 'CAMPAIGN_INACTIVE',
        type: 'campaign_inactive'
      };
    default:
      return { 
        error: true, 
        message: message,
        errorCode: errorCode,
        type: 'general_error'
      };
  }
}

export async function redeemCoupon(qrInfo, customerId) {
  const token = localStorage.getItem('token');
  // Accept qrInfo as object (from QR scan/info)
  let code = '';
  let points = 0;
  if (typeof qrInfo === 'string') {
    // Try to parse as JSON, else use as code
    try {
      const parsed = JSON.parse(qrInfo);
      code = parsed.code || parsed.Code || parsed.qrCode || parsed.qr_code || parsed.raw || qrInfo;
      points = parsed.points || parsed.Points || parsed.point || 0;
    } catch {
      code = qrInfo;
      points = 0;
    }
  } else if (qrInfo && typeof qrInfo === 'object') {
    code = qrInfo.code || qrInfo.Code || qrInfo.qrCode || qrInfo.qr_code || qrInfo.raw || '';
    points = qrInfo.points || qrInfo.Points || qrInfo.point || 0;
  }
  console.log('Redeeming coupon with:', { Code: code, CustomerId: customerId, Points: points });
  if (!code || !customerId) {
    return {
      error: true,
      message: 'Invalid QR code or customer ID.',
      errorCode: 'INVALID_DATA',
      type: 'invalid_qr'
    };
  }
  try {
    const response = await fetch('/api/customer/qrcodes/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        Code: code,
        CustomerId: customerId,
        Points: points
      })
    });
    const result = await response.json();
    console.log('QR Redemption Response:', {
      status: response.status,
      ok: response.ok,
      result: result
    });
    if (!response.ok) {
      return handleRedeemError(result);
    }
    if (!result || typeof result !== 'object') {
      return {
        error: true,
        message: 'Invalid response from server.',
        errorCode: 'INVALID_RESPONSE',
        type: 'server_error'
      };
    }
    console.log('Redemption successful:', result);
    return result;
  } catch (error) {
    console.error('Network error in redeemCoupon:', error);
    return { 
      error: true, 
      message: 'Network error. Please check your connection and try again.',
      errorCode: 'NETWORK_ERROR',
      type: 'network_error'
    };
  }
}

function handleRedeemError(result) {
  const errorCode = result.errorCode || 'UNKNOWN_ERROR';
  const message = result.error || result.message || 'Redemption failed. Please try again.';
  switch (errorCode) {
    case 'ALREADY_REDEEMED':
      return { 
        error: true, 
        message: message || 'This QR code has already been redeemed.',
        errorCode: 'ALREADY_REDEEMED',
        type: 'already_redeemed'
      };
    case 'INVALID_QR_CODE':
      return { 
        error: true, 
        message: message || 'Invalid QR code. This QR code does not exist in our system.',
        errorCode: 'INVALID_QR_CODE',
        type: 'invalid_qr'
      };
    case 'CAMPAIGN_INACTIVE':
      return { 
        error: true, 
        message: message || 'This campaign is not active.',
        errorCode: 'CAMPAIGN_INACTIVE',
        type: 'campaign_inactive'
      };
    case 'CUSTOMER_NOT_FOUND':
      return { 
        error: true, 
        message: message || 'Customer account not found. Please log in again.',
        errorCode: 'CUSTOMER_NOT_FOUND',
        type: 'auth_error'
      };
    default:
      return { 
        error: true, 
        message: message,
        errorCode: errorCode,
        type: 'general_error'
      };
  }
} 

export function getErrorIcon(errorCode) {
  switch (errorCode) {
    case 'ALREADY_REDEEMED':
      return '🔒';
    case 'INVALID_QR_CODE':
      return '❌';
    case 'CAMPAIGN_INACTIVE':
      return '⏰';
    case 'CUSTOMER_NOT_FOUND':
      return '🔐';
    case 'NETWORK_ERROR':
      return '📡';
    default:
      return '⚠️';
  }
}

export function getErrorColor(errorCode) {
  switch (errorCode) {
    case 'ALREADY_REDEEMED':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'INVALID_QR_CODE':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'CAMPAIGN_INACTIVE':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'CUSTOMER_NOT_FOUND':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'NETWORK_ERROR':
      return 'bg-red-50 border-red-200 text-red-800';
    default:
      return 'bg-red-50 border-red-200 text-red-800';
  }
} 