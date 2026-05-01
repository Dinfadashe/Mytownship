'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import type { Profile, Merchant, Product, Order, ProductCategory } from '@/types/database'
import { Package, ShoppingBag, TrendingUp, Plus, Edit2, Trash2, Star, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function MerchantDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [tab, setTab] = useState<'overview'|'products'|'orders'|'add'>('overview')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name:'', description:'', price:'', sale_price:'', stock_qty:'', category_id:'', unit:'piece', cover_image:'' })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: m } = await supabase.from('merchants').select('*').eq('user_id', user.id).single()
      setMerchant(m)
      if (m) {
        const [{ data: p }, { data: o }, { data: c }] = await Promise.all([
          supabase.from('products').select('*').eq('merchant_id', m.id).order('created_at', { ascending: false }),
          supabase.from('orders').select('*, order_items(*), profiles(full_name,phone)').eq('merchant_id', m.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('product_categories').select('*').order('sort_order')
        ])
        setProducts(p || []); setOrders(o || []); setCategories(c || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant) return
    const supabase = createClient()
    const { error } = await supabase.from('products').insert({
      merchant_id: merchant.id,
      name: form.name, description: form.description,
      price: parseFloat(form.price),
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      stock_qty: parseInt(form.stock_qty) || 0,
      category_id: form.category_id || null,
      unit: form.unit,
      cover_image: form.cover_image || null,
      city_id: merchant.city_id,
      country_id: merchant.country_id,
      status: 'active'
    })
    if (error) { toast.error(error.message); return }
    toast.success('Product added!')
    setForm({ name:'', description:'', price:'', sale_price:'', stock_qty:'', category_id:'', unit:'piece', cover_image:'' })
    setTab('products')
    const { data } = await supabase.from('products').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false })
    setProducts(data || [])
  }

  const toggleProductStatus = async (productId: string, current: string) => {
    const supabase = createClient()
    const newStatus = current === 'active' ? 'inactive' : 'active'
    await supabase.from('products').update({ status: newStatus }).eq('id', productId)
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus as any } : p))
    toast.success(`Product ${newStatus}`)
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    toast.success('Order updated')
  }

  const navStyle = (active: boolean): React.CSSProperties => ({
    padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: active ? '#0f2044' : 'transparent',
    color: active ? '#ffffff' : '#6b6560', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)'
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2ddd8',
    background: '#faf7f2', fontSize: 14, fontFamily: 'var(--font-dm-sans)', color: '#0d1117',
    outline: 'none', boxSizing: 'border-box'
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'var(--font-dm-sans)', color: '#6b6560' }}>Loading...</p></div>

  if (!merchant) return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: '#f4f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <ShoppingBag size={36} style={{ color: '#c9b99e' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>No Merchant Profile</h2>
        <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.8, marginBottom: 24 }}>
          You need to register as a merchant to access this dashboard.
        </p>
        <button onClick={() => router.push('/become-merchant')} style={{ padding: '13px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#c9973a,#e4b55a)', color: '#0f2044', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}>
          Become a Merchant
        </button>
      </div>
    </div>
  )

  const revenue = orders.filter(o => o.payment_status === 'paid').reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
  const pendingOrders = orders.filter(o => ['pending','confirmed'].includes(o.status)).length

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700 }}>{merchant.business_name}</h1>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: merchant.status === 'approved' ? '#f0fdf4' : '#fff7ed', color: merchant.status === 'approved' ? '#166534' : '#c2410c', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                {merchant.status}
              </span>
            </div>
            <p style={{ color: '#6b6560', fontSize: 14, fontFamily: 'var(--font-dm-sans)' }}>Merchant Dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['overview','products','orders','add'] as const).map(t => (
              <button key={t} style={navStyle(tab === t)} onClick={() => setTab(t)}>
                {t === 'add' ? '+ Add Product' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Revenue', value: `₦${revenue.toLocaleString()}`, icon: TrendingUp, color: '#22c55e', bg: '#f0fdf4' },
            { label: 'Products', value: products.filter(p => p.status === 'active').length, icon: Package, color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Total Orders', value: merchant.total_orders, icon: ShoppingBag, color: '#c9973a', bg: '#fdf6e8' },
            { label: 'Pending Orders', value: pendingOrders, icon: CheckCircle2, color: '#f97316', bg: '#fff7ed' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.6rem', fontWeight: 700 }}>{value}</p>
              <p style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Products */}
        {tab === 'products' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>My Products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
              {products.map(p => (
                <div key={p.id} style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2ddd8' }}>
                  <div style={{ height: 140, background: '#f4f0eb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {p.cover_image ? <img src={p.cover_image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={32} style={{ color: '#c9b99e' }} />}
                    <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 20, background: p.status === 'active' ? 'rgba(34,197,94,0.9)' : 'rgba(156,163,175,0.9)', color: '#ffffff', fontSize: 10, fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>
                      {p.status}
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, marginBottom: 4 }}>{p.name}</p>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', fontWeight: 700, color: '#c9973a', marginBottom: 8 }}>₦{p.price.toLocaleString()}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>Stock: {p.stock_qty}</span>
                      <button onClick={() => toggleProductStatus(p.id, p.status)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e2ddd8', background: 'transparent', fontSize: 11, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', color: '#6b6560', fontWeight: 600 }}>
                        {p.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>Orders</h2>
            {orders.map(o => (
              <div key={o.id} style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}>{o.order_number}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f4f0eb', color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontWeight: 600, textTransform: 'capitalize' }}>{o.status}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>{o.profiles?.full_name} · {o.order_items?.length} item{o.order_items?.length !== 1 ? 's' : ''}</p>
                    <p style={{ fontSize: 12, color: '#a09890', fontFamily: 'var(--font-dm-sans)', marginTop: 2 }}>{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '1.1rem' }}>₦{o.total_amount?.toLocaleString()}</p>
                      <p style={{ fontSize: 11, color: o.payment_status === 'paid' ? '#22c55e' : '#f97316', fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>{o.payment_status}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {o.status === 'pending' && <button onClick={() => updateOrderStatus(o.id, 'confirmed')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0f2044', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>Confirm</button>}
                      {o.status === 'confirmed' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#c9973a', color: '#0f2044', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>Preparing</button>}
                      {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready_for_pickup')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#ffffff', fontSize: 12, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', fontWeight: 600 }}>Ready</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Product */}
        {tab === 'add' && (
          <div style={{ maxWidth: 640 }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>Add New Product</h2>
            <form onSubmit={addProduct} style={{ background: '#ffffff', borderRadius: 20, padding: 32, border: '1px solid #e2ddd8', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Product Name *</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Fresh Tomatoes" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Category</label>
                  <select style={inputStyle} value={form.category_id} onChange={e => setForm(p => ({...p, category_id: e.target.value}))}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Describe your product..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Price (₦) *</label>
                  <input style={inputStyle} type="number" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} placeholder="0.00" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Sale Price (₦)</label>
                  <input style={inputStyle} type="number" value={form.sale_price} onChange={e => setForm(p => ({...p, sale_price: e.target.value}))} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Stock Qty</label>
                  <input style={inputStyle} type="number" value={form.stock_qty} onChange={e => setForm(p => ({...p, stock_qty: e.target.value}))} placeholder="0" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Unit</label>
                  <select style={inputStyle} value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))}>
                    {['piece','kg','litre','pack','box','dozen','set','pair','metre','bag'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, fontFamily: 'var(--font-dm-sans)', color: '#0d1117' }}>Cover Image URL</label>
                  <input style={inputStyle} value={form.cover_image} onChange={e => setForm(p => ({...p, cover_image: e.target.value}))} placeholder="https://..." />
                </div>
              </div>
              <button type="submit" style={{ padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0f2044,#1a3260)', color: '#ffffff', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', boxShadow: '0 4px 20px rgba(15,32,68,0.25)' }}>
                Add Product
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}