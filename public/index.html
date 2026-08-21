import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingCart, Search, Menu, X, ChevronDown, User, 
  Package, Download, CreditCard, CheckCircle, AlertCircle, 
  Upload, Trash2, Edit3, Plus, ArrowLeft, ArrowRight, 
  FileText, Gamepad2, Globe, Box, ShieldCheck, Zap, Lock, Gift, BookOpen, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://czuqcewdobkobohavbwo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2vycFL8nvwoEpWCW3oEYBQ_RqEnIIJF';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATS = ['All', 'Addons', 'Worlds', 'Items', 'Textures', 'Other'];
const CAT_LABELS = { All: 'ทั้งหมด', Addons: 'แอดออน', Worlds: 'โลก', Items: 'ไอเทม', Textures: 'เทกซ์เจอร์', Other: 'อื่นๆ' };

// --- UTILS ---
const formatPrice = (val) => {
  if (!val) return '0.00';
  const num = parseFloat(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const formatDesc = (text) => {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  let html = '', inList = false;
  const close = () => { if (inList) { html += '</ul>'; inList = false; } };
  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (!inList) { html += '<ul class="list-disc pl-5 space-y-1 my-2">'; inList = true; }
      html += `<li>${esc(bullet[1])}</li>`;
    } else if (line === '') { close(); }
    else { close(); html += `<p class="mb-2">${esc(line)}</p>`; }
  }
  close();
  return html || '<p class="text-muted-foreground">ไม่มีคำอธิบาย</p>';
};

// --- COMPONENTS ---

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-gradient-to-r from-[#00e676] to-[#00b359] text-[#00160a] shadow-lg shadow-[#00e676]/20 hover:shadow-[#00e676]/40 hover:-translate-y-0.5",
    secondary: "bg-white/5 border border-white/10 text-white hover:border-[#00e676]/50 hover:bg-white/10",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
    accent: "bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/30 hover:bg-[#a78bfa]/20"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = ({ label, error, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-bold uppercase tracking-wider text-white/50">{label}</label>}
    <input 
      className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00e676] focus:ring-2 focus:ring-[#00e676]/20 transition-all`}
      {...props} 
    />
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden hover:border-[#00e676]/40 hover:shadow-2xl hover:shadow-[#00e676]/10 transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="bg-[#0c0f15]/95 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-[#0c0f15]/95 border-b border-white/5">
            <h2 className="text-xl font-black text-white">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- MAIN APP ---

export default function App() {
  // State
  const [view, setView] = useState('intro'); // intro, store, dashboard, profile, account
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [sortOrder, setSortOrder] = useState('new');
  
  // Modals & UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [productDetail, setProductDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const [ownedIds, setOwnedIds] = useState(new Set());

  // Checkout Flow
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [uploadedSlip, setUploadedSlip] = useState(null);

  // Auth Init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN') showToast(`ยินดีต้อนรับ!`, 'success');
      if (_event === 'SIGNED_OUT') showToast('ออกจากระบบแล้ว', 'info');
    });
    loadProducts();
    loadCart();
    return () => subscription.unsubscribe();
  }, []);

  // Load Data
  const loadProducts = async () => {
    try {
      // Note: In a real app without backend API routes, this would fail. 
      // Assuming the user has the /api/products endpoint running as per original code.
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadCart = () => {
    const saved = localStorage.getItem('mc_cart');
    if (saved) setCart(JSON.parse(saved));
  };

  const checkOwnership = async () => {
    if (!user) return;
    try {
      const session = await supabase.auth.getSession();
      const res = await fetch('/api/user/library', { headers: { 'Authorization': `Bearer ${session.data.session.access_token}` } });
      if (res.ok) {
        const purchases = await res.json();
        const ids = new Set(purchases.map(p => p.products?.id || p.product_id).filter(Boolean));
        setOwnedIds(ids);
      }
    } catch {}
  };

  useEffect(() => { checkOwnership(); }, [user]);

  // Cart Logic
  const addToCart = (product) => {
    if (ownedIds.has(product.id)) return showToast('มีอยู่ในคลังแล้ว', 'warn');
    if (cart.find(i => i.id === product.id)) return showToast('อยู่ในตะกร้าแล้ว', 'warn');
    const newCart = [...cart, { id: product.id, name: product.name, price: product.price, thumb: product.thumbnail_url }];
    setCart(newCart);
    localStorage.setItem('mc_cart', JSON.stringify(newCart));
    showToast(`เพิ่ม "${product.name}" ลงตะกร้า`, 'success');
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    const newCart = cart.filter(i => i.id !== id);
    setCart(newCart);
    localStorage.setItem('mc_cart', JSON.stringify(newCart));
  };

  // Toast Helper
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filtered Products
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = (p.name + ' ' + (p.description || '')).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCat === 'All' || (p.category === selectedCat || (selectedCat === 'Other' && !CATS.slice(1, -1).includes(p.category)));
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (sortOrder === 'priceAsc') return a.price - b.price;
      if (sortOrder === 'priceDesc') return b.price - a.price;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // Render Views
  const renderContent = () => {
    switch(view) {
      case 'intro': return <IntroView onStart={() => setView('store')} />;
      case 'store': return <StoreView products={filteredProducts} loading={loading} onAddToCart={addToCart} onViewDetail={setProductDetail} ownedIds={ownedIds} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedCat={selectedCat} setSelectedCat={setSelectedCat} sortOrder={sortOrder} setSortOrder={setSortOrder} />;
      case 'dashboard': return <DashboardView user={user} showToast={showToast} />;
      case 'profile': return <ProfileView user={user} ownedIds={ownedIds} />;
      case 'account': return <AccountView user={user} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-white font-sans selection:bg-[#00e676] selection:text-black overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#00e676]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#a78bfa]/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      {view !== 'intro' && (
        <header className="sticky top-0 z-40 bg-[#07090d]/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('store')} className="flex items-center gap-2 font-['Press_Start_2P'] text-xs md:text-sm tracking-widest hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-[#00e676]/10 border border-[#00e676]/40 rounded-lg flex items-center justify-center text-lg">⛏️</div>
                MC STORE
              </button>
              <nav className="hidden md:flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                {['store', 'dashboard', 'profile', 'account'].map(v => {
                  if (v === 'dashboard' && (!user || user.user_metadata?.role !== 'creator')) return null;
                  if ((v === 'profile' || v === 'account') && !user) return null;
                  return (
                    <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view === v ? 'bg-[#00e676]/20 text-[#00e676]' : 'text-white/50 hover:text-white'}`}>
                      {v === 'store' ? 'สำรวจ' : v === 'dashboard' ? 'สตูดิโอ' : v === 'profile' ? 'คลัง' : 'โปรไฟล์'}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <Button variant="secondary" className="hidden sm:flex text-xs" onClick={() => supabase.auth.signOut()}>
                   👤 {user.user_metadata?.username || 'User'}
                </Button>
              ) : (
                <Button variant="ghost" className="text-xs" onClick={() => setAuthModalOpen(true)}>เข้าสู่ระบบ</Button>
              )}
              <Button variant="secondary" className="relative !px-3" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart size={18} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#00e676] text-black text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10 min-h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Drawers & Modals */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} removeFromCart={removeFromCart} user={user} onAuthReq={() => { setIsCartOpen(false); setAuthModalOpen(true); }} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} uploadedSlip={uploadedSlip} setUploadedSlip={setUploadedSlip} showToast={showToast} />
      
      <ProductDetailModal product={productDetail} onClose={() => setProductDetail(null)} owned={productDetail ? ownedIds.has(productDetail.id) : false} onClaim={() => {}} onAddToCart={addToCart} />
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-[#0c0f15] border border-white/10 px-4 py-3 rounded-xl shadow-2xl">
            {toast.type === 'success' && <CheckCircle className="text-[#00e676]" size={20} />}
            {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
            {toast.type === 'warn' && <AlertCircle className="text-yellow-500" size={20} />}
            <span className="font-medium text-sm">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function IntroView({ onStart }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onStart} className="absolute top-6 right-6 text-white/50 hover:text-white text-sm font-bold flex items-center gap-2">
        ข้าม →
      </motion.button>

      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="text-6xl mb-6 filter drop-shadow-[0_0_30px_rgba(0,230,118,0.5)]">⛏️</motion.div>
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="font-['Press_Start_2P'] text-3xl md:text-5xl mb-6 bg-gradient-to-r from-[#00e676] to-[#a78bfa] bg-clip-text text-transparent leading-tight">
        MC STORE
      </motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
        ตลาดกลางแอดออน Minecraft ที่ใหญ่ที่สุดในไทย<br/>ดาวน์โหลดง่าย ปลอดภัย จ่ายผ่าน PromptPay
      </motion.p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="flex gap-4 justify-center flex-wrap">
        <Button onClick={onStart} className="px-8 py-4 text-lg">🧭 เริ่มสำรวจร้านค้า</Button>
        <Button variant="secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>เรียนรู้เพิ่มเติม</Button>
      </motion.div>

      <div id="features" className="mt-32 max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {[
          { icon: <ShieldCheck size={32} />, title: 'ผู้สร้างยืนยันตัวตน', desc: 'ทุกแอดออนผ่านการตรวจสอบ ปลอดภัย 100%' },
          { icon: <Zap size={32} />, title: 'ดาวน์โหลดทันที', desc: 'ระบบอัตโนมัติ 24/7 ไม่ต้องรอ' },
          { icon: <Lock size={32} />, title: 'ชำระเงินปลอดภัย', desc: 'รองรับ PromptPay ตรวจสอบสลิปอัตโนมัติ' }
        ].map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors text-left">
            <div className="w-14 h-14 bg-[#00e676]/10 rounded-xl flex items-center justify-center text-[#00e676] mb-6">{f.icon}</div>
            <h3 className="text-xl font-bold mb-2">{f.title}</h3>
            <p className="text-white/50">{f.desc}</p>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-32 mb-10 text-white/30 animate-bounce">↓ เลื่อนลงเพื่อดูเพิ่มเติม</div>
    </div>
  );
}

function StoreView({ products, loading, onAddToCart, onViewDetail, ownedIds, searchQuery, setSearchQuery, selectedCat, setSelectedCat, sortOrder, setSortOrder }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toolbar */}
      <div className="sticky top-20 z-30 bg-[#07090d]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหาแอดออน..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#00e676] transition-colors"
          />
        </div>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer">
          <option value="new">ใหม่ล่าสุด</option>
          <option value="priceAsc">ราคา ↑</option>
          <option value="priceDesc">ราคา ↓</option>
        </select>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
        {CATS.map(c => (
          <button key={c} onClick={() => setSelectedCat(c)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCat === c ? 'bg-[#00e676] text-black shadow-[0_0_15px_rgba(0,230,118,0.4)]' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">ไม่พบแอดออน</h3>
          <p>ลองคำค้นหาอื่น หรือเปลี่ยนหมวดหมู่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(p => (
            <Card key={p.id} className="group flex flex-row h-36 cursor-pointer" onClick={() => onViewDetail(p)}>
              <div className="w-32 h-full bg-[#122036] relative overflow-hidden shrink-0">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
                )}
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1">{p.name}</h3>
                    <span className="text-[10px] bg-[#a78bfa]/10 text-[#a78bfa] px-2 py-0.5 rounded-full font-bold shrink-0">{CAT_LABELS[p.category] || p.category}</span>
                  </div>
                  <p className="text-xs text-white/40 line-clamp-2">{p.description || 'ไม่มีคำอธิบาย'}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-black text-[#00e676]">{parseFloat(p.price) === 0 ? 'ฟรี' : `฿${formatPrice(p.price)}`}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                    disabled={ownedIds.has(p.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${ownedIds.has(p.id) ? 'bg-white/5 text-white/30 cursor-default' : 'bg-[#00e676] text-black hover:bg-[#00b359]'}`}
                  >
                    {ownedIds.has(p.id) ? 'มีแล้ว' : parseFloat(p.price) === 0 ? 'รับเลย' : '+ ตะกร้า'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CartDrawer({ isOpen, onClose, cart, removeFromCart, user, onAuthReq, checkoutStep, setCheckoutStep, uploadedSlip, setUploadedSlip, showToast }) {
  const total = cart.reduce((acc, item) => acc + parseFloat(item.price), 0);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedSlip(file);
      showToast('อัปโหลดสลิปสำเร็จ', 'success');
    }
  };

  const handleSubmit = async () => {
    if (!uploadedSlip) return showToast('กรุณาอัปโหลดสลิป', 'warn');
    setCheckoutStep(3); // Simulate success for demo
    // In real app: fetch('/api/verify-cart-payment'...)
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0d12] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0a0d12]">
              <h2 className="text-lg font-black flex items-center gap-2">🛒 ตะกร้าของคุณ</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center justify-center py-4 bg-white/5 gap-2">
              {[1, 2, 3].map(step => (
                <React.Fragment key={step}>
                  <div className={`flex flex-col items-center gap-1 ${checkoutStep >= step ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${checkoutStep > step ? 'bg-[#00e676] border-[#00e676] text-black' : checkoutStep === step ? 'border-[#00e676] text-[#00e676]' : 'border-white/20 text-white/40'}`}>
                      {checkoutStep > step ? <CheckCircle size={14} /> : step}
                    </div>
                    <span className="text-[10px] font-bold">{step === 1 ? 'สินค้า' : step === 2 ? 'ชำระเงิน' : 'เสร็จสิ้น'}</span>
                  </div>
                  {step < 3 && <div className={`w-8 h-0.5 ${checkoutStep > step ? 'bg-[#00e676]' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {checkoutStep === 1 && (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                      <ShoppingCart size={48} className="mx-auto mb-4" />
                      <p>ตะกร้าว่างเปล่า</p>
                      <Button variant="ghost" onClick={onClose} className="mt-4">ไปช้อปปิ้ง →</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={item.id} className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="w-12 h-12 bg-[#122036] rounded-lg overflow-hidden shrink-0">
                            {item.thumb && <img src={item.thumb} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{item.name}</h4>
                            <span className="text-[#00e676] font-bold text-xs">฿{formatPrice(item.price)}</span>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-white/30 hover:text-red-400 self-center"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {checkoutStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="font-bold mb-3 text-sm">สรุปคำสั่งซื้อ</h3>
                    <div className="space-y-2 mb-3 max-h-32 overflow-y-auto text-sm text-white/70">
                      {cart.map(i => <div key={i.id} className="flex justify-between"><span>{i.name}</span><span>฿{formatPrice(i.price)}</span></div>)}
                    </div>
                    <div className="flex justify-between pt-3 border-t border-white/10 font-black text-lg">
                      <span>ยอดรวม</span>
                      <span className="text-[#00e676]">฿{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl flex gap-4 items-center">
                     <img src="/qrcode.jpg" onError={(e) => e.target.src = 'https://placehold.co/150x150/white/black?text=QR+Code'} alt="QR" className="w-24 h-24 object-contain" />
                     <div>
                       <p className="text-black font-bold text-sm">PromptPay QR Code</p>
                       <p className="text-black/60 text-xs mt-1">ยอดโอน: <span className="text-green-600 font-black text-lg">฿{total.toFixed(2)}</span></p>
                       <p className="text-black/40 text-[10px] mt-1">⏱️ กรุณาโอนให้ตรงยอดภายใน 15 นาที</p>
                     </div>
                  </div>

                  <div>
                    <label className="block border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#00e676]/50 hover:bg-[#00e676]/5 transition-all">
                      <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
                      <Upload className="mx-auto mb-2 text-white/50" />
                      <p className="font-bold text-sm">อัปโหลดสลิปการโอนเงิน</p>
                      <p className="text-xs text-white/40">คลิกหรือลากไฟล์มาวาง</p>
                    </label>
                    {uploadedSlip && (
                      <div className="mt-3 relative rounded-lg overflow-hidden border border-[#00e676]">
                        <img src={URL.createObjectURL(uploadedSlip)} className="w-full h-32 object-cover" />
                        <button onClick={() => setUploadedSlip(null)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500"><X size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {checkoutStep === 3 && (
                <div className="text-center py-10">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-[#00e676]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#00e676]">
                    <CheckCircle size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-black mb-2">ชำระเงินสำเร็จ! 🎉</h3>
                  <p className="text-white/60 mb-8">ระบบกำลังตรวจสอบสลิป<br/>แอดออนจะปรากฏในคลังของคุณทันที</p>
                  <Button onClick={() => { onClose(); window.location.hash = '#profile'; }} className="w-full">ไปที่คลังของฉัน</Button>
                </div>
              )}
            </div>

            {/* Footer */}
            {checkoutStep < 3 && cart.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-[#0a0d12]">
                {checkoutStep === 1 ? (
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white/50 text-sm">ยอดรวม ({cart.length} รายการ)</span>
                    <span className="text-xl font-black text-[#00e676]">฿{total.toFixed(2)}</span>
                  </div>
                ) : (
                  <Button variant="ghost" onClick={() => setCheckoutStep(1)} className="w-full mb-3 text-xs">← กลับไปแก้ไข</Button>
                )}
                
                <Button 
                  className="w-full" 
                  disabled={checkoutStep === 2 && !uploadedSlip}
                  onClick={() => {
                    if (checkoutStep === 1) {
                      if (!user) onAuthReq();
                      else setCheckoutStep(2);
                    } else {
                      handleSubmit();
                    }
                  }}
                >
                  {checkoutStep === 1 ? 'ดำเนินการชำระเงิน →' : 'ยืนยันการชำระเงิน ✓'}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ProductDetailModal({ product, onClose, owned, onClaim, onAddToCart }) {
  if (!product) return null;
  return (
    <Modal isOpen={!!product} onClose={onClose} title="">
      <div className="-m-6">
        <div className="aspect-video bg-[#122036] relative group">
           {product.thumbnail_url ? (
             <img src={product.thumbnail_url} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📦</div>
           )}
           <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full hover:bg-black/80 text-white"><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-black mb-1">{product.name}</h2>
              <span className="text-xs bg-[#a78bfa]/10 text-[#a78bfa] px-2 py-1 rounded-full font-bold">{CAT_LABELS[product.category] || product.category}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#00e676]">{parseFloat(product.price) === 0 ? 'ฟรี' : `฿${formatPrice(product.price)}`}</div>
              {owned && <span className="text-xs text-[#a78bfa] font-bold flex items-center justify-end gap-1"><CheckCircle size={12} /> มีแล้ว</span>}
            </div>
          </div>
          
          <div className="prose prose-invert prose-sm max-w-none mb-6 text-white/70" dangerouslySetInnerHTML={{ __html: formatDesc(product.description) }} />
          
          <div className="flex gap-3">
            {owned ? (
              <>
                <Button className="flex-1" onClick={() => { /* download logic */ }}>⬇️ ดาวน์โหลด</Button>
                <Button variant="secondary" onClick={onClose}>ปิด</Button>
              </>
            ) : (
              parseFloat(product.price) === 0 ? (
                <Button className="w-full" onClick={() => { onClaim(); onClose(); }}>🎁 รับฟรีทันที</Button>
              ) : (
                <Button className="w-full" onClick={() => { onAddToCart(product); onClose(); }}>เพิ่มลงตะกร้า</Button>
              )
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมล');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isSignUp ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}>
      <div className="space-y-4">
        <Input label="อีเมล" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" />
        <Input label="รหัสผ่าน" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        
        {isSignUp && (
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
             <Input label="ชื่อผู้ใช้" placeholder="Username" />
             <Input label="เบอร์โทรศัพท์" placeholder="08xxxxxxxx" />
             <div className="flex gap-2">
               <button className="flex-1 py-2 bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 rounded-lg text-sm font-bold">สมาชิก</button>
               <button className="flex-1 py-2 bg-white/5 text-white/50 border border-white/10 rounded-lg text-sm font-bold">ผู้สร้าง</button>
             </div>
          </div>
        )}

        <Button className="w-full" onClick={handleAuth} disabled={loading}>
          {loading ? 'กำลังดำเนินการ...' : (isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ')}
        </Button>
        
        <p className="text-center text-sm text-white/50 cursor-pointer hover:text-white" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
        </p>
      </div>
    </Modal>
  );
}

// Placeholder views for other sections
function DashboardView() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-black mb-6">🛠️ สตูดิโอผู้สร้าง</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6"><div className="text-white/50 text-sm font-bold uppercase">รายได้รวม</div><div className="text-3xl font-black text-[#00e676] mt-2">฿0.00</div></Card>
        <Card className="p-6"><div className="text-white/50 text-sm font-bold uppercase">ยอดขาย</div><div className="text-3xl font-black text-[#a78bfa] mt-2">0</div></Card>
        <Card className="p-6"><div className="text-white/50 text-sm font-bold uppercase">สินค้า aktif</div><div className="text-3xl font-black text-white mt-2">0</div></Card>
      </div>
      <div className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center hover:border-[#00e676]/50 hover:bg-[#00e676]/5 transition-all cursor-pointer">
        <Upload className="mx-auto mb-4 text-white/30" size={40} />
        <h3 className="font-bold text-lg">อัปโหลดแอดออนใหม่</h3>
        <p className="text-white/40 text-sm">ลากไฟล์ .mcaddon หรือ .zip มาวางที่นี่</p>
      </div>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-black mb-6">📚 คลังของฉัน</h2>
      <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
        <BookOpen className="mx-auto mb-4 text-white/20" size={48} />
        <p className="text-white/50">ยังไม่มีแอดออนในคลัง</p>
        <Button variant="ghost" className="mt-4">ไปช้อปปิ้ง</Button>
      </div>
    </div>
  );
}

function AccountView({ user }) {
  if (!user) return <div className="p-10 text-center">กรุณาเข้าสู่ระบบ</div>;
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-black mb-6">👤 โปรไฟล์ของฉัน</h2>
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00e676] to-[#a78bfa] rounded-2xl flex items-center justify-center text-2xl font-black text-black">
            {(user.user_metadata?.username || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg">{user.user_metadata?.username || 'User'}</h3>
            <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">Member</span>
          </div>
        </div>
        <div className="space-y-4 border-t border-white/10 pt-4">
          <div className="flex justify-between text-sm"><span className="text-white/50">อีเมล</span><span>{user.email}</span></div>
          <div className="flex justify-between text-sm"><span className="text-white/50">เบอร์โทร</span><span>{user.user_metadata?.phone || '-'}</span></div>
          <div className="flex justify-between text-sm"><span className="text-white/50">Minecraft IGN</span><span>{user.user_metadata?.minecraft_ign || '-'}</span></div>
        </div>
      </Card>
      <Button variant="danger" className="w-full" onClick={() => supabase.auth.signOut()}>ออกจากระบบ</Button>
    </div>
  );
}
