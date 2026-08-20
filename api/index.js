import express from 'express';
import multer from 'multer';
import fetch, { Blob, FormData } from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- SUPABASE ADMIN CLIENT ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- MULTER MEMORY STORAGE ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mcaddon', '.mcpack', '.mcworld', '.zip'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const name = (file.originalname || '').toLowerCase();
    
    // Debug log - check Vercel logs to see what filename actually arrives
    console.log('Upload received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      ext: ext
    });
    
    const isAllowed = allowed.includes(ext) || allowed.some(a => name.endsWith(a));
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Only .mcaddon, .mcpack, .mcworld, .zip files are allowed (got: ${ext || 'none'})`), false);
    }
  }
});

// --- AUTH MIDDLEWARE ---
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
}

async function optionalAuth(req, res, next) {
  req.user = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    req.user = user || null;
  }
  next();
}

// ==========================================
// 1. PUBLIC STORE ROUTES
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('GET /api/products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. CREATOR DASHBOARD & PRODUCT CRUD
// ==========================================
app.get('/api/creator/products', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('creator_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('GET creator products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/creator/products', requireAuth, upload.fields([
  { name: 'productFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('--- UPLOAD START ---');
    console.log('User:', req.user.id);
    console.log('Body:', req.body);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'NO FILES');
    
    // Log each file's details
    if (req.files?.productFile?.[0]) {
      console.log('Product file:', {
        name: req.files.productFile[0].originalname,
        size: req.files.productFile[0].size,
        mimetype: req.files.productFile[0].mimetype
      });
    }

app.put('/api/creator/products/:id', requireAuth, upload.fields([
  { name: 'productFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;
    const productFile = req.files?.productFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    const { data: existing, error: findErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('creator_id', req.user.id)
      .single();

    if (findErr || !existing) {
      return res.status(403).json({ success: false, message: 'You do not own this product.' });
    }

    const updates = {
      name: name ? name.trim() : existing.name,
      description: description !== undefined ? description.trim() : existing.description,
      price: price !== undefined ? parseFloat(price) : existing.price
    };

    if (productFile) {
      const addonFileName = `${Date.now()}-${productFile.originalname.replace(/\s+/g, '_')}`;
      await supabase.storage.from('addons').upload(addonFileName, productFile.buffer, { contentType: productFile.mimetype });
      updates.file_url = supabase.storage.from('addons').getPublicUrl(addonFileName).data.publicUrl;
    }

    if (thumbnailFile) {
      const thumbName = `${Date.now()}-${thumbnailFile.originalname.replace(/\s+/g, '_')}`;
      await supabase.storage.from('thumbnails').upload(thumbName, thumbnailFile.buffer, { contentType: thumbnailFile.mimetype });
      updates.thumbnail_url = supabase.storage.from('thumbnails').getPublicUrl(thumbName).data.publicUrl;
    }

    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select();
    if (error) throw error;

    res.json({ success: true, product: data[0] });
  } catch (error) {
    console.error('PUT product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/creator/products/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .eq('creator_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. CART & PAYMENT
// ==========================================
app.post('/api/verify-cart-payment', optionalAuth, upload.single('slip'), async (req, res) => {
  try {
    const productIds = JSON.parse(req.body.productIds || '[]');
    if (!productIds.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a payment slip.' });
    }

    const { data: cartItems, error: dbErr } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (dbErr || !cartItems.length) {
      return res.status(400).json({ success: false, message: 'Invalid cart items.' });
    }

    const totalPrice = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);

    const branchId = process.env.SLIPOK_BRANCH_ID;
    const apiKey = process.env.SLIPOK_API_KEY;

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('files', blob, req.file.originalname || 'slip.jpg');
    formData.append('log', 'true');
    formData.append('amount', totalPrice.toFixed(2));

    const response = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: 'POST',
      headers: { 'x-authorization': apiKey },
      body: formData
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success || !result.data) {
      return res.status(400).json({ success: false, message: result?.message || 'Slip verification failed.' });
    }

    if (req.user) {
      const purchases = cartItems.map(item => ({
        user_id: req.user.id,
        product_id: item.id,
        trans_ref: result.data.transRef,
        amount_paid: item.price
      }));
      await supabase.from('purchases').insert(purchases);
    }

    res.json({
      success: true,
      message: 'Payment verified!',
      downloads: cartItems.map(item => ({ name: item.name, downloadUrl: item.file_url }))
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, message: 'Server verification error.' });
  }
});

// ==========================================
// 4. USER LIBRARY
// ==========================================
app.get('/api/user/library', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('created_at, products(id, name, thumbnail_url, file_url, price)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. ERROR HANDLER (MUST BE LAST!)
// ==========================================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large (max 50MB)' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

// ==========================================
// 6. EXPORT FOR VERCEL
// ==========================================
export default app;
