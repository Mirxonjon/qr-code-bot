const QRCode = require('qrcode');

/**
 * Generate a QR code buffer from text
 * @param {string} text 
 * @returns {Promise<Buffer>}
 */
async function generateQRCode(text) {
  try {
    return await QRCode.toBuffer(text, {
      type: 'png',
      margin: 1,
      width: 500,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

module.exports = {
  generateQRCode
};
