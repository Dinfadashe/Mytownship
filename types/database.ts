export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'user' | 'admin' | 'hotel_manager' | 'hotel_reception' | 'dispatch_rider' | 'merchant'
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed'
export type PaymentMethod = 'paystack' | 'flutterwave' | 'char_token' | 'bank_transfer' | 'cash'
export type RoomStatus = 'available' | 'booked' | 'occupied' | 'maintenance' | 'blocked'
export type ShipmentStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned' | 'cancelled'
export type RiderStatus = 'offline' | 'available' | 'busy' | 'on_delivery'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'delivered' | 'cancelled' | 'refunded'
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock' | 'deleted'
export type MerchantStatus = 'pending' | 'approved' | 'suspended'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  email: string | null
  role: UserRole
  city_id: string | null
  country_id: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Continent { id: string; name: string; code: string }
export interface Country { id: string; continent_id: string; name: string; code: string; currency: string; phone_code: string | null }
export interface State { id: string; country_id: string; name: string; code: string | null }
export interface City { id: string; state_id: string; country_id: string; name: string; latitude: number | null; longitude: number | null; is_active: boolean }

export interface Hotel {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  city_id: string | null
  country_id: string | null
  city_name: string | null
  state_name: string | null
  country_name: string | null
  latitude: number | null
  longitude: number | null
  star_rating: number | null
  amenities: string[]
  images: string[]
  cover_image: string | null
  phone: string | null
  email: string | null
  check_in_time: string
  check_out_time: string
  is_active: boolean
  is_approved: boolean
  manager_id: string | null
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  hotel_id: string
  room_number: string
  room_type: string
  floor: number | null
  description: string | null
  price_per_night: number
  currency: string
  capacity: number
  amenities: string[]
  images: string[]
  status: RoomStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id: string
  hotel_id: string
  room_id: string
  check_in: string
  check_out: string
  guests: number
  nights: number
  total_amount: number
  currency: string
  status: BookingStatus
  payment_method: PaymentMethod | null
  payment_ref: string | null
  payment_status: PaymentStatus
  special_requests: string | null
  guest_name: string | null
  guest_phone: string | null
  checked_in_at: string | null
  checked_out_at: string | null
  created_at: string
  updated_at: string
}

export interface Rider {
  id: string
  user_id: string
  city_id: string | null
  country_id: string | null
  vehicle_type: string
  vehicle_plate: string | null
  status: RiderStatus
  latitude: number | null
  longitude: number | null
  rating: number
  total_deliveries: number
  is_approved: boolean
  is_active: boolean
  last_seen: string | null
  created_at: string
  updated_at: string
}

export interface Shipment {
  id: string
  user_id: string
  rider_id: string | null
  tracking_code: string
  description: string | null
  weight_kg: number | null
  origin_address: string
  origin_city_id: string | null
  origin_lat: number | null
  origin_lng: number | null
  dest_address: string
  dest_city_id: string | null
  dest_lat: number | null
  dest_lng: number | null
  status: ShipmentStatus
  price: number | null
  currency: string
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  estimated_delivery: string | null
  actual_delivery: string | null
  distance_km: number | null
  notes: string | null
  fragile: boolean
  created_at: string
  updated_at: string
}

export interface ShipmentEvent {
  id: string
  shipment_id: string
  status: string
  location: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  created_at: string
}

export interface Merchant {
  id: string
  user_id: string
  business_name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  city_id: string | null
  country_id: string | null
  address: string | null
  phone: string | null
  email: string | null
  category: string | null
  status: MerchantStatus
  is_active: boolean
  rating: number
  total_orders: number
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  parent_id: string | null
  sort_order: number
}

export interface Product {
  id: string
  merchant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  sale_price: number | null
  currency: string
  images: string[]
  cover_image: string | null
  stock_qty: number
  unit: string
  sku: string | null
  weight_kg: number | null
  status: ProductStatus
  tags: string[]
  city_id: string | null
  country_id: string | null
  views: number
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  merchant_id: string
  shipment_id: string | null
  order_number: string
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total_amount: number
  currency: string
  payment_method: PaymentMethod | null
  payment_ref: string | null
  payment_status: PaymentStatus
  delivery_address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  type: string | null
  link: string | null
  read: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      continents: { Row: Continent; Insert: Partial<Continent>; Update: Partial<Continent> }
      countries: { Row: Country; Insert: Partial<Country>; Update: Partial<Country> }
      states: { Row: State; Insert: Partial<State>; Update: Partial<State> }
      cities: { Row: City; Insert: Partial<City>; Update: Partial<City> }
      hotels: { Row: Hotel; Insert: Partial<Hotel>; Update: Partial<Hotel> }
      rooms: { Row: Room; Insert: Partial<Room>; Update: Partial<Room> }
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> }
      riders: { Row: Rider; Insert: Partial<Rider>; Update: Partial<Rider> }
      shipments: { Row: Shipment; Insert: Partial<Shipment>; Update: Partial<Shipment> }
      shipment_events: { Row: ShipmentEvent; Insert: Partial<ShipmentEvent>; Update: Partial<ShipmentEvent> }
      merchants: { Row: Merchant; Insert: Partial<Merchant>; Update: Partial<Merchant> }
      product_categories: { Row: ProductCategory; Insert: Partial<ProductCategory>; Update: Partial<ProductCategory> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      cart_items: { Row: CartItem; Insert: Partial<CartItem>; Update: Partial<CartItem> }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> }
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
    }
  }
}