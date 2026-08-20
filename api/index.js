import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const app = express();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

const processedTransactions = new Set();
app.use(express.json());

app.post('/api/verify-payment', upload.single('slip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a slip image.' });
    }

    // SlipOK requires the file to be passed under the 'files' field using multipart/form-data
    const slipFormData = new FormData();
    slipFormData.append('files', req.file.buffer, {
      filename: req.file.originalname || 'slip.jpg',
      contentType: req.file.mimetype
    });
    slipFormData.append('log', 'true');

    // ... inside app.post('/api/verify-payment', ...)
    
    console.log('Sending to SlipOK with Branch ID:', process.env.SLIPOK_BRANCH_ID);
    
    const response = await fetch(`https://api.slipok.com/api/line/apikey/${process.env.SLIPOK_BRANCH_ID}`, {
      method: 'POST',
      headers: {
        'x-authorization': process.env.SLIPOK_API_KEY,
        ...slipFormData.getHeaders()
      },
      body: slipFormData
    });
    
    const result = await response.json();
    console.log('SlipOK Response:', result); // Check your Vercel Logs!

    if (!result.success || !result.data) {
      return res.status(400).json({ 
        success: false, 
        message: result.message || 'Invalid or unreadable slip format.' 
      });
    }

    const slipData = result.data;

    // 1. Prevent Replay Attack
    if (processedTransactions.has(slipData.transRef)) {
      return res.status(400).json({ success: false, message: 'This slip has already been redeemed!' });
    }

    // 2. Validate Price Paid
    const expectedPrice = parseFloat(process.env.EXPECTED_PRICE || '0.10');
    if (parseFloat(slipData.amount) < expectedPrice) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient transfer amount. Required: ฿${expectedPrice}, Found: ฿${slipData.amount}` 
      });
    }

    processedTransactions.add(slipData.transRef);

    return res.json({
      success: true,
      message: 'Payment confirmed!',
      downloadUrl: '/downloads/custom_addon_v1.mcaddon',
      transRef: slipData.transRef
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ success: false, message: 'Verification endpoint error.' });
  }
});

export default app;
