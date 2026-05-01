'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Globe, ChevronDown } from 'lucide-react'
import type { Continent, Country, State, City } from '@/types/database'

interface LocationSelectorProps {
  onSelect: (location: { continent?: Continent; country?: Country; state?: State; city?: City }) => void
  compact?: boolean
}

export function LocationSelector({ onSelect, compact = false }: LocationSelectorProps) {
  const [continents, setContinents] = useState<Continent[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [sel, setSel] = useState({ continent: '', country: '', state: '', city: '' })
  const supabase = createClient()

  useEffect(() => {
    supabase.from('continents').select('*').order('name').then(({ data }) => setContinents(data || []))
  }, [])

  const selectContinent = async (id: string) => {
    setSel({ continent: id, country: '', state: '', city: '' })
    setCountries([]); setStates([]); setCities([])
    const { data } = await supabase.from('countries').select('*').eq('continent_id', id).order('name')
    setCountries(data || [])
    const c = continents.find(x => x.id === id)
    onSelect({ continent: c })
  }

  const selectCountry = async (id: string) => {
    setSel(p => ({ ...p, country: id, state: '', city: '' }))
    setStates([]); setCities([])
    const { data } = await supabase.from('states').select('*').eq('country_id', id).order('name')
    setStates(data || [])
    const country = countries.find(x => x.id === id)
    const continent = continents.find(x => x.id === sel.continent)
    onSelect({ continent, country })
  }

  const selectState = async (id: string) => {
    setSel(p => ({ ...p, state: id, city: '' }))
    setCities([])
    const { data } = await supabase.from('cities').select('*').eq('state_id', id).eq('is_active', true).order('name')
    setCities(data || [])
  }

  const selectCity = (id: string) => {
    setSel(p => ({ ...p, city: id }))
    const city = cities.find(x => x.id === id)
    const state = states.find(x => x.id === sel.state)
    const country = countries.find(x => x.id === sel.country)
    const continent = continents.find(x => x.id === sel.continent)
    onSelect({ continent, country, state, city })
  }

  const selectStyle: React.CSSProperties = {
    padding: compact ? '8px 12px' : '12px 16px',
    borderRadius: 10, border: '1.5px solid #e2ddd8',
    background: '#faf7f2', fontSize: compact ? 13 : 15,
    fontFamily: 'var(--font-dm-sans)', color: '#0d1117',
    outline: 'none', width: '100%', cursor: 'pointer',
    appearance: 'none', WebkitAppearance: 'none'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Globe size={16} style={{ color: '#c9973a' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0d1117', fontFamily: 'var(--font-dm-sans)' }}>Select Location</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <select style={selectStyle} value={sel.continent} onChange={e => selectContinent(e.target.value)}>
            <option value="">Continent</option>
            {continents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6560', pointerEvents: 'none' }} />
        </div>

        {countries.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select style={selectStyle} value={sel.country} onChange={e => selectCountry(e.target.value)}>
              <option value="">Country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6560', pointerEvents: 'none' }} />
          </div>
        )}

        {states.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select style={selectStyle} value={sel.state} onChange={e => selectState(e.target.value)}>
              <option value="">State / Region</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6560', pointerEvents: 'none' }} />
          </div>
        )}

        {cities.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select style={selectStyle} value={sel.city} onChange={e => selectCity(e.target.value)}>
              <option value="">City</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6560', pointerEvents: 'none' }} />
          </div>
        )}
      </div>
    </div>
  )
}