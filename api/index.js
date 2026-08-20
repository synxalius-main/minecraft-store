import express from 'express';
import multer from 'multer';
import fetch, { Blob, FormData } from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; // npm install cors

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors()); // Allow frontend dev servers
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- SUPABASE ADMIN CLIENT ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- MULTER MEMORY STORAGE ---
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
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
    if (error || !user) return res.status(401).json({ success: false, message: 'Invalid session.' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Auth failed.' });
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
// PUBLIC STORE
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// CREATOR CRUD
// ==========================================
app.get('/api/creator/products', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('creator_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/creator/products', requireAuth, upload.fields([
  { name: 'productFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Upload attempt by:', req.user.id);
    console.log('Files received:', Object.keys(req.files || {}));
    
    const { name, description, price } = req.body;
    const productFile = req.files?.productFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!name || !price || !productFile) {
      return res.status(400).json({ success: false, message: 'Name, price, and addon file are required.' });
    }

    // 1. Upload Addon
    const addonFileName = `${Date.now()}-${productFile.originalname.replace(/\s+/g, '_')}`;
    const { error: fileErr } = await supabase.storage
      .from('addons')
      .upload(addonFileName, productFile.buffer, { 
        contentType: productFile.mimetype || 'application/octet-stream',
        upsert: false 
      });
    if (fileErr) {
      console.error('Addon upload error:', fileErr);
      return res.status(500).json({ success: false, message: 'Failed to upload addon file: ' + fileErr.message });
    }
    const fileUrl = supabase.storage.from('addons').getPublicUrl(addonFileName).data.publicUrl;

    // 2. Upload Thumbnail
    let thumbnailUrl = '';
    if (thumbnailFile) {
      const thumbName = `${Date.now()}-${thumbnailFile.originalname.replace(/\s+/g, '_')}`;
      const { error: thumbErr } = await supabase.storage
        .from('thumbnails')
        .upload(thumbName, thumbnailFile.buffer, { contentType: thumbnailFile.mimetype });
      if (thumbErr) {
        console.error('Thumbnail upload error:', thumbErr);
      } else {
        thumbnailUrl = supabase.storage.from('thumbnails').getPublicUrl(thumbName).data.publicUrl;
      }
    }

    // 3. Save to DB
    const { data, error } = await supabase.from('products').insert([{
      creator_id: req.user.id,
      name,
      description: description || '',
      price: parseFloat(price),
      thumbnail_url: thumbnailUrl,
      file_url: fileUrl
    }]).select();

    if (error) {
      console.error('DB insert error:', error);
      throw error;
    }
    
    console.log('Product created:', data[0].id);
    res.json({ success: true, product: data[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      price: price ? parseFloat(price) : existing.price
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
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/creator/products/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id).eq('creator_id', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// CART & PAYMENT
// ==========================================
app.post('/api/verify-cart-payment', optionalAuth, upload.single('slip'), async (req, res) => {
  try {
    const productIds = JSON.parse(req.body.productIds || '[]');
    if (!productIds.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a payment slip.' });

    const { data: cartItems, error: dbErr } = await supabase.from('products').select('*').in('id', productIds);
    if (dbErr || !cartItems.length) return res.status(400).json({ success: false, message: 'Invalid cart items.' });

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
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Server verification error.' });
  }
});

// ==========================================
// USER LIBRARY
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Store live at http://localhost:${PORT}`));
