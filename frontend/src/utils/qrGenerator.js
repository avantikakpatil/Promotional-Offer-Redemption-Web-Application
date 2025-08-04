import QRCode from 'qrcode';

export const generateQRCodeDataURL = async (text, options = {}) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: options.size || 200,
      ...options
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return null;
  }
};
