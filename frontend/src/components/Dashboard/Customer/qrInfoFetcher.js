export async function fetchQRInfo(qrRawString) {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/customer/qrcodes/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ qrRawString })
    });
    if (!response.ok) {
      throw new Error('Failed to fetch QR info');
    }
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

export async function redeemCoupon(qrInfo, customerId) {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/customer/qrcodes/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        Code: qrInfo.code,
        CustomerId: customerId,
        Points: qrInfo.points
      })
    });
    if (!response.ok) {
      throw new Error('Redemption failed');
    }
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
} 