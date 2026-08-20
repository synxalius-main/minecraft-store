import express from 'express';
import multer from 'multer';
import fetch, { Blob, FormData } from 'node-fetch';

const app = express();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

app.use(express.json());

app.post('/api/verify-payment', upload.single('slip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a slip image.' });
    }

    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const branchId = process.env.SLIPOK_BRANCH_ID;
    const apiKey = process.env.SLIPOK_API_KEY;

    if (!branchId || !apiKey) {
      console.error('SlipOK environment variables are not configured.');
      return res.status(503).json({
        success: false,
        message: 'Payment verification is temporarily unavailable. Please contact the store owner.'
      });
    }

    const expectedPrice = Number(process.env.EXPECTED_PRICE || '0.10');
    if (!Number.isFinite(expectedPrice) || expectedPrice <= 0) {
      console.error('EXPECTED_PRICE must be a positive number.');
      return res.status(500).json({ success: false, message: 'Payment verification is misconfigured.' });
    }

    // Keep FormData and Blob from node-fetch so node-fetch serializes the upload correctly.
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('files', blob, req.file.originalname || 'slip.jpg');
    formData.append('log', 'true');
    formData.append('amount', expectedPrice.toFixed(2));

    const response = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: 'POST',
      headers: {
        'x-authorization': apiKey
      },
      body: formData
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success || !result.data) {
      return res.status(400).json({ 
        success: false, 
        message: result?.message || 'SlipOK could not verify this slip. Please try another image.'
      });
    }

    const slipData = result.data;

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

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'The slip image must be 5 MB or smaller.' });
  }

  console.error('Upload Error:', error);
  return res.status(400).json({ success: false, message: 'The slip image could not be uploaded.' });
});

export default app;
