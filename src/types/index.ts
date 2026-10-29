export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  password?: string;
  role: UserRole;
  storeId?: string;
  avatar?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  userType: 'buyer' | 'seller' | 'visitor';
  subject: string;
  message: string;
  targetEmail: string; // kgmservices229@gmail.com
  createdAt: string;
  status: 'NOUVEAU' | 'EN_COURS' | 'RESOLU';
}

export interface DeliveryZone {
  id: string;
  city: string;
  neighborhoods?: string[];
  fee: number; // in XOF / FCFA
  estimatedHours: string;
  freeAbove?: number; // e.g. Free delivery if order > 30000 XOF
}

export interface Store {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  description: string;
  category: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  deliveryZones: DeliveryZone[];
  viewsCount?: number;
  cartAbandonCount?: number;
  cartAbandonTotal?: number;
  slogan?: string;
  isOpen?: boolean; // true = store open, false = store in vacation/pause mode
  whatsappOrderMessage?: string;
  deliveryInstructions?: string;
  lowStockThreshold?: number;
  codAccepted?: boolean;
  createdAt: string;
}

export interface StoreCustomer {
  name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderedItems: string[];
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Taille", "Couleur", "Capacité"
  options: string[]; // e.g. ["M", "L", "XL"] or ["Noir", "Bleu"]
}

export interface ProductTestimonial {
  id: string;
  author: string;
  city?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  verified?: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  detailedDescription?: string; // Rich product presentation / description page
  features?: string[]; // Caractéristiques et points forts du produit
  category: string;
  price: number; // Normal price in FCFA
  promoPrice?: number; // Promotional price in FCFA
  isPromoActive: boolean;
  promoStartDate?: string;
  promoEndDate?: string;
  stock: number;
  images: string[];
  videoUrl?: string; // YouTube, MP4 or direct video embed
  variants?: ProductVariant[];
  weightKg?: number;
  dimensions?: string;
  deliveryInfo?: string;
  isPublished: boolean;
  salesCount: number;
  viewsCount?: number;
  cartAbandonCount?: number;
  rating: number;
  reviewCount: number;
  testimonials?: ProductTestimonial[]; // Témoignages clients sur le produit
  featured?: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  storeId: string;
  productName: string;
  productImage: string;
  price: number; // current active price (promo or normal)
  normalPrice: number;
  quantity: number;
  selectedVariants?: Record<string, string>; // e.g. { "Taille": "XL", "Couleur": "Noir" }
}

export type OrderStatus =
  | 'NOUVELLE'
  | 'CONFIRMEE'
  | 'EN_PREPARATION'
  | 'PRETE_EXPEDITION'
  | 'EN_COURS_LIVRAISON'
  | 'LIVREE_ENCAISSEE'
  | 'ANNULEE'
  | 'LIVRAISON_ECHOUEE'
  | 'RETOUR_DEMANDE'
  | 'RETOURNEE';

export interface OrderItem {
  productId: string;
  storeId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  selectedVariants?: Record<string, string>;
}

export interface SellerSubOrder {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  storePhone: string;
  storeWhatsapp: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  sellerNotes?: string;
  deliveredAt?: string;
  cashCollected?: number;
}

export interface Order {
  id: string; // e.g. BM-2026-8942
  trackingCode: string;
  customerFirstName: string;
  customerLastName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  city: string;
  neighborhood: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: 'CASH_ON_DELIVERY'; // Strictly COD
  status: OrderStatus;
  items: OrderItem[];
  subOrders: SellerSubOrder[];
  productsTotal: number;
  deliveryTotal: number;
  grandTotal: number;
  cashCollectedAmount?: number;
  cashEncaissedBy?: string;
  driverName?: string;
  driverPhone?: string;
  bonDeCommandeSentAt?: string;
  bonDeCommandeEmail?: string;
  receiptNumber?: string;
  receiptSentAt?: string;
  receiptSentEmail?: string;
  receiptSentWhatsapp?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbandonedCart {
  id: string;
  storeId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCity?: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  lastActivityAt: string;
  status: 'abandoned' | 'recovered' | 'relanced';
  recoveryAttemptsCount: number;
  lastRecoverySentAt?: string;
  lastRecoveryChannel?: 'whatsapp' | 'email';
  lastGeneratedRecoveryMessage?: string;
}

export interface AISalesCopyResponse {
  salesTitle: string;
  hook: string;
  persuasiveDescription: string;
  bulletPoints: string[];
  codGuaranteeArgument: string;
  faq: { question: string; answer: string }[];
}

export interface AICartRecoveryResponse {
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
  suggestedDiscountPromoCode?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  storeId: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  orderId?: string;
  createdAt: string;
}

export interface PlatformSettings {
  marketplaceName: string;
  currency: string;
  currencySymbol: string;
  supportPhone: string;
  supportEmail: string;
  defaultCommissionRate: number; // e.g. 5%
  enableStoreRegistration: boolean;
  requireStoreVerification: boolean;
  primaryCountry: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
}
