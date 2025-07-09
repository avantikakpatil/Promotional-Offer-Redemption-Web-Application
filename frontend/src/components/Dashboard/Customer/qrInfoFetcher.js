export async function fetchQRInfo(qrData) {
  try {
    const response = await fetch('/api/coupons/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData })
    });
    if (!response.ok) {
      throw new Error('Failed to fetch QR info');
    }
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

export async function redeemCoupon(qrData, customerId) {
  try {
    const response = await fetch('/api/coupons/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData, customerId })
    });
    if (!response.ok) {
      throw new Error('Redemption failed');
    }
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
} 