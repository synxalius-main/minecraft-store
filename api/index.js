import express from 'express';
import multer from 'multer';
import fetch, { Blob, FormData } from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// --- SUPABASE CONFIGURATION ---
// Make sure to add these to your Vercel Environment Variables!
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

// --- MULTER CONFIGURATIONS (Memory Only for Vercel) ---
// We keep files in memory (buffer) to bypass Vercel's read-only hard drive.
const slipUpload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB for images
const productUpload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB for addons

// --- 1. GET ALL PRODUCTS ---
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    
    // Format the response for our frontend
    res.json(data);
  } catch (error) {
    console.error('Database Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load products.' });
  }
});

// --- 2. CREATOR: UPLOAD PRODUCT ---
app.post('/api/add-product', productUpload.single('productFile'), async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!req.file || !name || !price) {
      return res.status(400).json({ success: false, message: 'Missing file, name, or price.' });
    }

    // 1. Generate a safe file name
    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;

    // 2. Upload file directly from memory to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('addons')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) throw uploadError;

    // 3. Get the public download link for the file
    const { data: publicUrlData } = supabase.storage
      .from('addons')
      .getPublicUrl(fileName);
      
    const fileUrl = publicUrlData.publicUrl;

    // 4. Save product details in the Supabase Database
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert([{ name: name, price: parseFloat(price), file_url: fileUrl }])
      .select();

    if (insertError) throw insertError;

    return res.json({ success: true, message: 'Product added successfully!', product: insertData[0] });

  } catch (error) {
    console.error('Add product error:', error.message);
    return res.status(500).json({ success: false, message: 'Error adding product.' });
  }
});

// --- 3. BUYER: VERIFY PAYMENT ---
app.post('/api/verify-payment', slipUpload.single('slip'), async (req, res) => {
  try {
    const { productId } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: 'Please select a slip image.' });
    if (!req.file.mimetype?.startsWith('image/')) return res.status(400).json({ success: false, message: 'Upload an image file.' });

    // 1. Look up the product in Supabase to get the exact price
    const { data: product, error: dbError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (dbError || !product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const branchId = process.env.SLIPOK_BRANCH_ID;
    const apiKey = process.env.SLIPOK_API_KEY;

    // 2. Send slip buffer to SlipOK
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('files', blob, req.file.originalname || 'slip.jpg');
    formData.append('log', 'true');
    formData.append('amount', product.price.toFixed(2)); // Check against specific product price!

    const response = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: 'POST',
      headers: { 'x-authorization': apiKey },
      body: formData
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success || !result.data) {
      return res.status(400).json({ success: false, message: result?.message || 'Invalid bank slip.' });
    }

    // 3. Return the Supabase file URL to the buyer!
    return res.json({
      success: true,
      message: 'Payment confirmed!',
      downloadUrl: product.file_url, 
      transRef: result.data.transRef
    });

  } catch (error) {
    console.error('Server Error:', error.message);
    return res.status(500).json({ success: false, message: 'Verification endpoint error.' });
  }
});

// --- ERROR HANDLING ---
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large.' });
  }
  console.error('Global Error:', error);
  return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

export default app;
