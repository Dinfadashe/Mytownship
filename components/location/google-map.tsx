'use client'
import { useEffect, useRef } from 'react'

interface GoogleMapProps {
  latitude: number
  longitude: number
  zoom?: number
  markers?: Array<{ lat: number; lng: number; title: string; type?: 'hotel' | 'rider' | 'pickup' | 'dropoff' }>
  height?: number | string
  className?: string
}

export function GoogleMap({ latitude, longitude, zoom = 14, markers = [], height = 320, className }: GoogleMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div style={{ height, borderRadius: 16, background: 'linear-gradient(135deg,#0f2044,#1a3260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }} className={className}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(201,151,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#c9973a"/></svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ffffff', fontSize: 14, fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}>Map View</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'var(--font-dm-sans)' }}>
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'var(--font-dm-sans)', marginTop: 4 }}>
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable maps
          </p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      width="100%"
      height={height}
      style={{ borderRadius: 16, border: 'none' }}
      className={className}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=${zoom}`}
    />
  )
}

export function GoogleMapsLink({ latitude, longitude, label }: { latitude: number; longitude: number; label?: string }) {
  return (
    <a
      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#c9973a', fontSize: 13, fontFamily: 'var(--font-dm-sans)', fontWeight: 500, textDecoration: 'none' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/></svg>
      {label || 'View on Google Maps'}
    </a>
  )
}