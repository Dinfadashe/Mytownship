'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { LocationSelector } from '@/components/location/location-selector'
import type { Profile, Product, ProductCategory, Merchant } from '@/types/database'
import { ShoppingBag, ShoppingCart, Search, Filter, Star, Package, Coins, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'

export default function MarketplacePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<(Product & { merchants?: Merchant })[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [countryId, setCountryId] = useState('')
  const [cityId, setCityId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof)
        const { data: cartItems } = await supabase.from('cart_items').select('product_id, quantity').eq('user_id', user.id)
        const cartMap: Record<string, number> = {}
        cartItems?.forEach(c => { cartMap[c.product_id] = c.quantity })
        setCart(cartMap)
      }
      const { data: cats } = await supabase.from('product_categories').select('*').order('sort_order')
      setCategories(cats || [])
      await fetchProducts(supabase, '', '', '', '')
      setLoading(false)
    }
    load()
  }, [])

  const fetchProducts = async (supabase: any, q: string, cat: string, country: string, city: string) => {
    let query = supabase.from('products').select('*, merchants(business_name,logo_url,rating)').eq('status', 'active')
    if (q) query = query.ilike('name', `%${q}%`)
    if (cat) query = query.eq('category_id', cat)
    if (city) query = query.eq('city_id', city)
    else if (country) query = query.eq('country_id', country)
    const { data } = await query.order('created_at', { ascending: false }).limit(60)
    setProducts(data || [])
  }

  const updateSearch = async (q: string) => {
    setSearch(q)
    const supabase = createClient()
    await fetchProducts(supabase, q, selectedCategory, countryId, cityId)
  }

  const updateCategory = async (cat: string) => {
    setSelectedCategory(cat)
    const supabase = createClient()
    await fetchProducts(supabase, search, cat, countryId, cityId)
  }

  const addToCart = async (productId: string) => {
    if (!profile) { toast.error('Sign in to add to cart'); return }
    const supabase = createClient()
    const current = cart[productId] || 0
    if (current === 0) {
      await supabase.from('cart_items').upsert({ user_id: profile.id, product_id: productId, quantity: 1 })
    } else {
      await supabase.from('cart_items').update({ quantity: current + 1 }).eq('user_id', profile.id).eq('product_id', productId)
    }
    setCart(prev => ({ ...prev, [productId]: current + 1 }))
    toast.success('Added to cart')
  }

  const removeFromCart = async (productId: string) => {
    if (!profile) return
    const supabase = createClient()
    const current = cart[productId] || 0
    if (current <= 1) {
      await supabase.from('cart_items').delete().eq('user_id', profile.id).eq('product_id', productId)
      setCart(prev => { const n = { ...prev }; delete n[productId]; return n })
    } else {
      await supabase.from('cart_items').update({ quantity: current - 1 }).eq('user_id', profile.id).eq('product_id', productId)
      setCart(prev => ({ ...prev, [productId]: current - 1 }))
    }
  }

  const cartTotal = Object.keys(cart).length
  const cartValue = products.filter(p => cart[p.id]).reduce((sum, p) => sum + (p.sale_price || p.price) * (cart[p.id] || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <Navbar profile={profile} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0f2044,#1a3260)', padding: '40px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <ShoppingBag size={24} style={{ color: '#c9973a' }} />
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, color: '#ffffff' }}>Marketplace</h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans)', marginBottom: 24 }}>
            Shop from verified merchants worldwide. Delivered to your door.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b6560' }} />
              <input value={search} onChange={e => updateSearch(e.target.value)} placeholder="Search products..." style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#ffffff', fontSize: 14, fontFamily: 'var(--font-dm-sans)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {profile && cartTotal > 0 && (
              <Link href="/marketplace/cart" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#c9973a,#e4b55a)', cursor: 'pointer' }}>
                  <ShoppingCart size={18} style={{ color: '#0f2044' }} />
                  <span style={{ color: '#0f2044', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-dm-sans)' }}>{cartTotal} · ₦{cartValue.toLocaleString()}</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>

          {/* Sidebar */}
          <aside>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8', marginBottom: 20 }}>
              <LocationSelector compact onSelect={({ country, city }) => {
                const cId = country?.id || ''; const ciId = city?.id || ''
                setCountryId(cId); setCityId(ciId)
                const supabase = createClient()
                fetchProducts(supabase, search, selectedCategory, cId, ciId)
              }} />
            </div>

            <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2ddd8' }}>
              <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 12 }}>Categories</p>
              <button onClick={() => updateCategory('')} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: selectedCategory === '' ? '#0f2044' : 'transparent', color: selectedCategory === '' ? '#ffffff' : '#0d1117', fontSize: 13, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', textAlign: 'left', marginBottom: 4 }}>
                All Categories
              </button>
              {categories.map(c => (
                <button key={c.id} onClick={() => updateCategory(c.id)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: selectedCategory === c.id ? '#0f2044' : 'transparent', color: selectedCategory === c.id ? '#ffffff' : '#0d1117', fontSize: 13, fontFamily: 'var(--font-dm-sans)', cursor: 'pointer', textAlign: 'left', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{c.icon}</span> {c.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Products grid */}
          <main>
            <p style={{ fontSize: 13, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 20 }}>
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 64, background: '#ffffff', borderRadius: 20, border: '2px dashed #e2ddd8' }}>
                <Package size={40} style={{ color: '#c9b99e', margin: '0 auto 16px' }} />
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', marginBottom: 8 }}>No products found</p>
                <p style={{ color: '#6b6560', fontFamily: 'var(--font-dm-sans)', fontSize: 14 }}>Try a different location or category</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                {products.map(p => {
                  const qty = cart[p.id] || 0
                  const price = p.sale_price || p.price
                  return (
                    <div key={p.id} style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2ddd8', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(15,32,68,0.1)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                    >
                      <div style={{ height: 160, background: '#f4f0eb', position: 'relative', overflow: 'hidden' }}>
                        {p.cover_image ? <img src={p.cover_image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={32} style={{ color: '#c9b99e' }} /></div>}
                        {p.sale_price && <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 20, background: '#dc2626', color: '#ffffff', fontSize: 10, fontFamily: 'var(--font-dm-sans)', fontWeight: 700 }}>SALE</div>}
                        {p.stock_qty === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#ffffff', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-dm-sans)' }}>Out of Stock</span></div>}
                      </div>
                      <div style={{ padding: 14 }}>
                        <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        {(p as any).merchants && <p style={{ fontSize: 11, color: '#6b6560', fontFamily: 'var(--font-dm-sans)', marginBottom: 8 }}>{(p as any).merchants.business_name}</p>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#c9973a', fontSize: '1.05rem' }}>₦{price.toLocaleString()}</span>
                            {p.sale_price && <span style={{ fontSize: 11, color: '#a09890', textDecoration: 'line-through', marginLeft: 6 }}>₦{p.price.toLocaleString()}</span>}
                          </div>
                          <span style={{ fontSize: 11, color: '#6b6560', fontFamily: 'var(--font-dm-sans)' }}>/{p.unit}</span>
                        </div>
                        {qty === 0 ? (
                          <button onClick={() => addToCart(p.id)} disabled={p.stock_qty === 0} style={{ width: '100%', padding: '9px', borderRadius: 10, border: 'none', background: p.stock_qty === 0 ? '#e2ddd8' : 'linear-gradient(135deg,#0f2044,#1a3260)', color: '#ffffff', fontSize: 13, fontFamily: 'var(--font-dm-sans)', cursor: p.stock_qty === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Plus size={14} /> Add to Cart
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                            <button onClick={() => removeFromCart(p.id)} style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid #e2ddd8', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '1.1rem' }}>{qty}</span>
                            <button onClick={() => addToCart(p.id)} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: '#0f2044', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} style={{ color: '#ffffff' }} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}