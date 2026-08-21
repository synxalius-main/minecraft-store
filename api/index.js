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

// --- ENVIRONMENT CHECK ---
const supabaseUrl = process.env.SUPABASE_URL;
// Support either variable name just in case
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ MISSING ENV VARS: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in Vercel.');
  throw new Error('Missing Supabase credentials. Please check Vercel Environment Variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
// ... rest of the code ...


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 } // 4MB limit for Vercel serverless safety
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

// Helper: Secure filename sanitization
const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9.\-_]+/g, '_');

// ==========================================
// ROUTES
// ==========================================

// GET STORE (Public, NO file paths or URLs exposed)
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, thumbnail_url, created_at, category')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== PRODUCT MEDIA (PREVIEW GALLERY) ==========

// GET media for a product (public)
app.get('/api/products/:id/media', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('product_media')
      .select('id, media_url, media_type, sort_order')
      .eq('product_id', req.params.id)
      .order('sort_order');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST — upload preview images (up to 5)
app.post('/api/creator/products/:id/media', requireAuth, upload.array('previews', 5), async (req, res) => {
  try {
    const productId = req.params.id;

    // Verify ownership
    const { data: product } = await supabase
      .from('products').select('id, creator_id').eq('id', productId).single();
    if (!product || product.creator_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your product' });
    }

    // Check existing count
    const { count } = await supabase
      .from('product_media')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);
    
    const youtubeUrls = req.body.youtube_urls
      ? (typeof req.body.youtube_urls === 'string' ? JSON.parse(req.body.youtube_urls) : req.body.youtube_urls)
      : [];

    const totalNew = (req.files?.length || 0) + youtubeUrls.length;
    if ((count || 0) + totalNew > 8) {
      return res.status(400).json({ success: false, message: 'Max 8 preview items per product' });
    }

    const inserts = [];
    let sortBase = (count || 0);

    // Upload image files
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.mimetype)) continue;

        const ext = file.originalname.split('.').pop();
        const fileName = `previews/${productId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('addons')
          .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('addons').getPublicUrl(fileName);
        inserts.push({
          product_id: productId,
          media_url: pub.publicUrl,
          media_type: 'image',
          sort_order: sortBase++
        });
      }
    }

    // Add YouTube videos
    for (const url of youtubeUrls) {
      const videoId = extractYouTubeId(url);
      if (!videoId) continue;
      inserts.push({
        product_id: productId,
        media_url: `https://www.youtube.com/embed/${videoId}`,
        media_type: 'video',
        sort_order: sortBase++
      });
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from('product_media').insert(inserts);
      if (error) throw error;
    }

    res.json({ success: true, added: inserts.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE a single media item
app.delete('/api/creator/products/:id/media/:mediaId', requireAuth, async (req, res) => {
  try {
    const { data: product } = await supabase
      .from('products').select('id, creator_id').eq('id', req.params.id).single();
    if (!product || product.creator_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your product' });
    }

    // Get media to delete storage file if image
    const { data: media } = await supabase
      .from('product_media').select('*').eq('id', req.params.mediaId).single();
    if (!media) return res.status(404).json({ success: false, message: 'Not found' });

    if (media.media_type === 'image' && media.media_url.includes('/previews/')) {
      const path = media.media_url.split('/addons/')[1];
      if (path) await supabase.storage.from('addons').remove([decodeURIComponent(path)]);
    }

    const { error } = await supabase.from('product_media').delete().eq('id', req.params.mediaId);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}


// GET CREATOR DASHBOARD (Includes file_path for management)
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPLOAD PRODUCT
app.post('/api/creator/products', requireAuth, upload.fields([
  { name: 'productFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const productFile = req.files?.productFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!name || price === undefined || price === '') {
      return res.status(400).json({ success: false, message: 'Name and price are required.' });
    }
    if (!productFile) {
      return res.status(400).json({ success: false, message: 'Addon file is required.' });
    }

    const allowed = ['.mcaddon', '.mcpack', '.mcworld', '.zip'];
    const ext = path.extname(productFile.originalname || '').toLowerCase();
    if (!allowed.includes(ext)) {
      return res.status(400).json({ success: false, message: `Invalid file type "${ext}".` });
    }

    // Restrict thumbnail to images only
    if (thumbnailFile && !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(thumbnailFile.mimetype)) {
      return res.status(400).json({ success: false, message: 'Thumbnail must be an image.' });
    }

    // Upload Addon to Private Storage
    const addonFileName = `${req.user.id}/${Date.now()}-${sanitizeFilename(productFile.originalname)}`;
    const { error: fileErr } = await supabase.storage
      .from('addons')
      .upload(addonFileName, productFile.buffer, { contentType: productFile.mimetype || 'application/octet-stream' });

    if (fileErr) throw new Error('Failed to upload addon: ' + fileErr.message);

    // Upload Thumbnail to Public Storage
    let thumbnailUrl = '';
    if (thumbnailFile) {
      const thumbName = `thumbnails/${Date.now()}-${sanitizeFilename(thumbnailFile.originalname)}`;
      const { error: thumbErr } = await supabase.storage
        .from('thumbnails')
        .upload(thumbName, thumbnailFile.buffer, { contentType: thumbnailFile.mimetype });
      if (!thumbErr) {
        thumbnailUrl = supabase.storage.from('thumbnails').getPublicUrl(thumbName).data.publicUrl;
      }
    }

    const { data, error } = await supabase.from('products').insert([{
      creator_id: req.user.id,
      name: name.trim(),
      description: (description || '').trim(),
      price: parseFloat(price),
            category: (req.body.category || 'Addons').trim(),
      thumbnail_url: thumbnailUrl,
      file_path: addonFileName // Save path, NOT URL
    }]).select('id, name, description, price, thumbnail_url');

    if (error) throw error;
    res.json({ success: true, product: data[0] });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
});

// UPDATE PRODUCT
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
      .from('products').select('*').eq('id', id).eq('creator_id', req.user.id).single();
    if (findErr || !existing) return res.status(403).json({ success: false, message: 'Not your product.' });

    const updates = {
      name: name ? name.trim() : existing.name,
      description: description !== undefined ? description.trim() : existing.description,
      price: price !== undefined ? parseFloat(price) : existing.price,
      category: req.body.category ? req.body.category.trim() : existing.category
    };


    if (productFile) {
      const allowed = ['.mcaddon', '.mcpack', '.mcworld', '.zip'];
      const ext = path.extname(productFile.originalname || '').toLowerCase();
      if (!allowed.includes(ext)) return res.status(400).json({ success: false, message: 'Invalid file type' });

      // Delete old file from storage
      if (existing.file_path) await supabase.storage.from('addons').remove([existing.file_path]);

      const addonFileName = `${req.user.id}/${Date.now()}-${sanitizeFilename(productFile.originalname)}`;
      const { error } = await supabase.storage.from('addons').upload(addonFileName, productFile.buffer, { contentType: productFile.mimetype });
      if (error) throw error;
      updates.file_path = addonFileName;
    }

    if (thumbnailFile) {
      const thumbName = `thumbnails/${Date.now()}-${sanitizeFilename(thumbnailFile.originalname)}`;
      await supabase.storage.from('thumbnails').upload(thumbName, thumbnailFile.buffer, { contentType: thumbnailFile.mimetype });
      updates.thumbnail_url = supabase.storage.from('thumbnails').getPublicUrl(thumbName).data.publicUrl;
    }

    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select('id, name, description, price, thumbnail_url');
    if (error) throw error;
    res.json({ success: true, product: data[0] });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATOR STATS (revenue, downloads, 7-day activity)
app.get('/api/creator/stats', requireAuth, async (req, res) => {
  try {
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('amount_paid, created_at, products!inner(creator_id)')
      .eq('products.creator_id', req.user.id);
    if (error) throw error;

    const { count } = await supabase
      .from('products').select('id', { count: 'exact', head: true })
      .eq('creator_id', req.user.id);

    const list = purchases || [];
    const revenue = list.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);

    const days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d;
    });
    const series = days.map(d => {
      const next = new Date(d); next.setDate(d.getDate() + 1);
      return list.filter(p => { const t = new Date(p.created_at); return t >= d && t < next; }).length;
    });

    res.json({ revenue, downloads: list.length, active: count || 0, series });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// DELETE PRODUCT
app.delete('/api/creator/products/:id', requireAuth, async (req, res) => {
  try {
    const { data: existing } = await supabase.from('products').select('file_path').eq('id', req.params.id).eq('creator_id', req.user.id).single();
    if (existing?.file_path) {
      await supabase.storage.from('addons').remove([existing.file_path]); // Clean up storage
    }
    const { error } = await supabase.from('products').delete().eq('id', req.params.id).eq('creator_id', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// VERIFY PAYMENT (SlipOK)
app.post('/api/verify-cart-payment', requireAuth, upload.single('slip'), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Login required to checkout.' });

    const productIds = JSON.parse(req.body.productIds || '[]');
    if (!productIds.length || !req.file) return res.status(400).json({ success: false, message: 'Missing cart or slip.' });

    const { data: cartItems, error: dbErr } = await supabase.from('products').select('*').in('id', productIds);
    if (dbErr || !cartItems.length) return res.status(400).json({ success: false, message: 'Invalid cart items.' });

    const totalPrice = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const branchId = process.env.SLIPOK_BRANCH_ID;
    const apiKey = process.env.SLIPOK_API_KEY;

    const formData = new FormData();
    formData.append('files', new Blob([req.file.buffer], { type: req.file.mimetype }), 'slip.jpg');
    formData.append('log', 'true');
    formData.append('amount', totalPrice.toFixed(2));

    const response = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: 'POST', headers: { 'x-authorization': apiKey }, body: formData
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success || !result.data) {
      return res.status(400).json({ success: false, message: result?.message || 'Slip verification failed.' });
    }

    // SECURITY: Verify amount matches and prevent replay
    const detectedAmount = parseFloat(result.data.amount);
    if (Math.abs(detectedAmount - totalPrice) > 0.01) {
      return res.status(400).json({ success: false, message: 'Payment amount mismatch.' });
    }

    const purchases = cartItems.map(item => ({
      user_id: req.user.id,
      product_id: item.id,
      trans_ref: result.data.transRef, // Unique constraint in DB prevents replays
      amount_paid: item.price
    }));

    const { error: insErr } = await supabase.from('purchases').insert(purchases);
    if (insErr) throw new Error('Database error saving purchase: ' + insErr.message);

    res.json({ success: true, message: 'Payment verified!', count: cartItems.length });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server verification error.' });
  }
});

// GET USER LIBRARY (Only IDs, no direct download links)
app.get('/api/user/library', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('created_at, products(id, name, thumbnail_url)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SECURE DOWNLOAD ENDPOINT (Issues 1-hour signed URL)
app.post('/api/downloads', requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    
    // 1. Verify user actually owns this product
    const { data: owned } = await supabase.from('purchases')
      .select('id').eq('user_id', req.user.id).eq('product_id', productId).maybeSingle();
    if (!owned) return res.status(403).json({ success: false, message: 'Purchase not found.' });

    // 2. Get file path
    const { data: product } = await supabase.from('products')
      .select('file_path, name').eq('id', productId).single();
    if (!product?.file_path) return res.status(404).json({ success: false, message: 'File missing.' });

    // 3. Generate Signed URL (Valid for 1 hour)
    const { data: signed, error } = await supabase.storage
      .from('addons').createSignedUrl(product.file_path, 3600);
    if (error) throw error;

    res.json({ success: true, name: product.name, url: signed.signedUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large (max 4MB for Vercel)' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
});

export default app;
