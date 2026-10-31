/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { StorePublicPage } from './components/StorePublicPage';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { SellerRegistrationModal } from './components/seller/SellerRegistrationModal';
import { FounderAccessModal } from './components/admin/FounderAccessModal';
import { AuthModal } from './components/auth/AuthModal';
import { CustomerServiceModal } from './components/CustomerServiceModal';
import { HighLoadMonitorModal } from './components/common/HighLoadMonitorModal';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { promptPWAInstall } from './hooks/usePWAInstall';
import { VisitorAIAssistant } from './components/common/VisitorAIAssistant';
import { BonDeCommandeModal } from './components/common/BonDeCommandeModal';
import { PaymentReceiptModal } from './components/common/PaymentReceiptModal';

import { storageService } from './services/storageService';
import { Product, Store, Order, CartItem, User } from './types';
import { CATEGORIES } from './data/initialData';
import { formatFCFA, calculateDiscountPercent } from './utils/formatters';
import { useLanguage } from './i18n/LanguageContext';

import {
  ShieldCheck,
  Truck,
  Store as StoreIcon,
  Tag,
  ArrowRight,
  Video,
  Star,
  MapPin,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Check,
  Phone,
  Package,
  Activity,
  Zap,
  ShoppingBag,
  ChevronDown,
  X,
  LogOut,
  Mail,
  Flame,
  Clock,
  BadgePercent,
  ThumbsUp,
  Shield,
  Layers,
} from 'lucide-react';

export default function App() {
  const { t, translateCategory } = useLanguage();
  // Reactive state synced with storageService
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [stores, setStores] = useState<Store[]>(() => storageService.getStores());
  const [cart, setCart] = useState<CartItem[]>(() => storageService.getCart());

  // Views & Routing - Only owner admin defaults to admin
  const [currentView, setCurrentView] = useState<'home' | 'categories' | 'stores' | 'boutique' | 'seller' | 'admin' | 'customer'>(
    () =>
      currentUser?.role === 'seller'
        ? 'seller'
        : currentUser?.role === 'admin' && currentUser?.email?.toLowerCase() === 'kazottimahutondj@gmail.com'
        ? 'admin'
        : 'home'
  );
  const [sellerActiveTab, setSellerActiveTab] = useState<'overview' | 'products' | 'orders' | 'abandoned_carts' | 'promotions' | 'settings'>('overview');
  const [isSellerBoundaryModalOpen, setIsSellerBoundaryModalOpen] = useState(false);
  const [activeStoreSlug, setActiveStoreSlug] = useState<string>('danxome-creations');

  // Foreground Dedicated Menus for Buyer and Seller Spaces
  const [isBuyerMenuOpen, setIsBuyerMenuOpen] = useState(false);
  const [isSellerMenuOpen, setIsSellerMenuOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes les catégories');
  const [selectedCity, setSelectedCity] = useState('Toutes les villes');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular'>('featured');

  const BENIN_CITIES = ['Toutes les villes', 'Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Ouidah', 'Bohicon', 'Natitingou'];

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [bonDeCommandeOrder, setBonDeCommandeOrder] = useState<Order | null>(null);
  const [paymentReceiptOrder, setPaymentReceiptOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingInitialCode, setTrackingInitialCode] = useState('');
  const [isSellerRegOpen, setIsSellerRegOpen] = useState(false);
  const [isFounderModalOpen, setIsFounderModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register_buyer' | 'register_seller'>('login');
  const [authPromptReason, setAuthPromptReason] = useState<string>('');
  const [pendingOrderAction, setPendingOrderAction] = useState<{
    type: 'quick_buy' | 'cart_checkout';
    product?: Product;
    quantity?: number;
    variants?: Record<string, string>;
  } | null>(null);
  const [isCustomerServiceOpen, setIsCustomerServiceOpen] = useState(false);
  const [customerServiceOrderId, setCustomerServiceOrderId] = useState('');
  const [isHighLoadModalOpen, setIsHighLoadModalOpen] = useState(false);
  const [visibleCatalogLimit, setVisibleCatalogLimit] = useState(16);

  // Subscribe to storage changes and founder shortcuts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      if (search.includes('admin') || search.includes('kazotti')) {
        setIsFounderModalOpen(true);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsFounderModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const unsubscribe = storageService.subscribe(() => {
      setCurrentUser(storageService.getCurrentUser());
      setProducts(storageService.getProducts());
      setStores(storageService.getStores());
      setCart(storageService.getCart());
    });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribe();
    };
  }, []);

    //Filtered and sorted products for home/categories view (exclude blocked stores)
  const publicStores = stores.filter((s) => !s.isBlocked);

  const filteredProducts = products.filter((p) => {
    if (!p.isPublished) return false;
    const store = stores.find((s) => s.id === p.storeId);
    if (store?.isBlocked) return false;
    const cleanQ = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !cleanQ ||
      p.name.toLowerCase().includes(cleanQ) ||
      p.description.toLowerCase().includes(cleanQ) ||
      p.category.toLowerCase().includes(cleanQ) ||
      (store && store.name.toLowerCase().includes(cleanQ)) ||
      (store && store.city.toLowerCase().includes(cleanQ));

    const matchesCategory =
      selectedCategory === 'Toutes les catégories' || p.category === selectedCategory;

    const matchesCity =
      selectedCity === 'Toutes les villes' ||
      (store && store.city.toLowerCase() === selectedCity.toLowerCase());

    return matchesSearch && matchesCategory && matchesCity;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.isPromoActive && a.promoPrice ? a.promoPrice : a.price;
    const priceB = b.isPromoActive && b.promoPrice ? b.promoPrice : b.price;

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'popular') return (b.salesCount || 0) - (a.salesCount || 0);
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  // Promotional items (exclude blocked stores)
  const promoProducts = products.filter((p) => {
    const st = stores.find((s) => s.id === p.storeId);
    return p.isPublished && !st?.isBlocked && p.isPromoActive && p.promoPrice;
  });
  // Video items (exclude blocked stores)
  const videoProducts = products.filter((p) => {
    const st = stores.find((s) => s.id === p.storeId);
    return p.isPublished && !st?.isBlocked && p.videoUrl;
  });

  // Navigation Handler - Enforces strict boundary between seller platform and buyer space
  const handleNavigate = (view: 'home' | 'categories' | 'stores' | 'track' | 'seller' | 'admin' | 'customer', param?: string) => {
    if (view === 'track') {
      setIsTrackingOpen(true);
      return;
    }

    if (view === 'admin') {
      const isOwner =
        currentUser?.role === 'admin' &&
        currentUser?.email?.toLowerCase() === 'kazottimahutondj@gmail.com';
      if (!isOwner) {
        setIsFounderModalOpen(true);
        return;
      }
    }

    if (view === 'seller' && currentUser?.role !== 'seller') {
      const users = storageService.getUsers();
      const seller = users.find((u) => {
        if (u.role !== 'seller' || u.isBlocked) return false;
        const st = stores.find((s) => s.id === u.storeId || s.sellerId === u.id);
        return !st?.isBlocked;
      });
      if (seller) {
        storageService.setCurrentUser(seller);
      } else {
        setAuthModalMode('register_seller');
        setIsAuthModalOpen(true);
        return;
      }
    }

    if (param && view === 'stores') {
      setActiveStoreSlug(param);
      setCurrentView('boutique');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenStore = (slug: string) => {
    setActiveStoreSlug(slug);
    setCurrentView('boutique');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add to cart
  const handleAddToCart = (product: Product, quantity = 1, variants: Record<string, string> = {}) => {
    const price = product.isPromoActive && product.promoPrice ? product.promoPrice : product.price;
    storageService.addToCart({
      productId: product.id,
      storeId: product.storeId,
      productName: product.name,
      productImage: product.images[0] || '',
      price,
      normalPrice: product.price,
      quantity,
      selectedVariants: variants,
    });
    setIsCartOpen(true);
  };

  // Quick buy (1 click COD purchase)
  const handleQuickBuy = (product: Product, quantity = 1, variants: Record<string, string> = {}) => {
    // A buyer MUST be registered and logged in before having access to order any product
    if (!currentUser) {
      setPendingOrderAction({ type: 'quick_buy', product, quantity, variants });
      setAuthPromptReason(`Pour commander l'article « ${product.name} », vous devez d'abord vous inscrire en tant qu'acheteur. Vous réglerez le livreur à la réception.`);
      setAuthModalMode('register_buyer');
      setIsAuthModalOpen(true);
      return;
    }

    const price = product.isPromoActive && product.promoPrice ? product.promoPrice : product.price;
    const directItem: CartItem = {
      id: `direct-${Date.now()}`,
      productId: product.id,
      storeId: product.storeId,
      productName: product.name,
      productImage: product.images[0] || '',
      price,
      normalPrice: product.price,
      quantity,
      selectedVariants: variants,
    };
    setCheckoutItems([directItem]);
    setIsCheckoutOpen(true);
  };

  // Checkout from cart
  const handleCheckoutFromCart = () => {
    if (cart.length === 0) return;

    // A buyer MUST be registered and logged in before having access to order any product
    if (!currentUser) {
      setIsCartOpen(false);
      setPendingOrderAction({ type: 'cart_checkout' });
      setAuthPromptReason("Pour valider et commander votre panier avec paiement à la livraison, vous devez d'abord vous inscrire en tant qu'acheteur.");
      setAuthModalMode('register_buyer');
      setIsAuthModalOpen(true);
      return;
    }

    setCheckoutItems([...cart]);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setIsCheckoutOpen(false);
    setSelectedProduct(null);
    setConfirmedOrder(order);
  };

  const handleOpenTrackingWithCode = (code: string) => {
    setTrackingInitialCode(code);
    setIsTrackingOpen(true);
  };

  // Current active store for public page view
  const activeStore = stores.find((s) => s.slug === activeStoreSlug) || stores[0];
  const activeStoreProducts = products.filter((p) => p.storeId === activeStore?.id);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 text-slate-800">
      {/* PWA Mobile App Install Bar for Android & iPhone */}
      <PWAInstallBanner />

      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onNavigate={handleNavigate}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrack={() => setIsTrackingOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={currentView}
        onOpenFounderModal={() => setIsFounderModalOpen(true)}
        onOpenCustomerService={() => {
          setCustomerServiceOrderId('');
          setIsCustomerServiceOpen(true);
        }}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        products={products}
        stores={stores}
        selectedCity={selectedCity}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          storageService.recordProductView(p.id);
        }}
        onSelectStore={(slug) => handleOpenStore(slug)}
        onSelectCity={(city) => {
          setSelectedCity(city);
          if (currentView !== 'categories' && currentView !== 'home') {
            setCurrentView('categories');
          }
        }}
        sellerActiveTab={sellerActiveTab}
        onSellerTabChange={(tab) => {
          setSellerActiveTab(tab);
          setCurrentView('seller');
        }}
        onPreviewOwnStore={() => {
          const s = stores.find((st) => st.id === currentUser?.storeId || st.sellerId === currentUser?.id) || stores[0];
          handleOpenStore(s.slug);
        }}
      />

      {/* SECTION PREMIER PLAN : BOUTONS ESPACE ACHETEUR & ESPACE VENDEUR CÔTE À CÔTE (TAILLE RÉDUITE & FORMAT ERGONOMIQUE ANDROID/IPHONE - FOND BLANC) */}
      <section className="relative z-30 bg-white border-b border-slate-200/90 shadow-2xs py-2 px-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 items-stretch">
            {/* 1. BOUTON ESPACE ACHETEUR (Taille compacte, Vert Émeraude Officiel avec icône panier et menu dédié) */}
            <div className="relative">
              <div
                className={`w-full h-full rounded-xl p-2 sm:p-2.5 text-left transition-all duration-200 select-none touch-manipulation cursor-pointer flex flex-col justify-between ${
                  currentView === 'home' || currentView === 'categories'
                    ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white border-2 border-emerald-300 shadow-md ring-1 ring-emerald-400/40'
                    : 'bg-gradient-to-br from-emerald-700/90 to-teal-900 text-white border-2 border-emerald-500/80 shadow-xs hover:border-emerald-300'
                }`}
                onClick={() => {
                  handleNavigate('home');
                  const el = document.getElementById('catalogue');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="flex items-start justify-between gap-1 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center text-white shrink-0 shadow-2xs">
                      <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase text-emerald-200">
                          Officiel
                        </span>
                        <span className="inline-flex items-center px-1 py-0.1 rounded text-[8px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-400/30">
                          COD
                        </span>
                      </div>
                      <h2 className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">
                        Espace Acheteur
                      </h2>
                    </div>
                  </div>

                  {/* Bouton Menu Dédié */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBuyerMenuOpen(!isBuyerMenuOpen);
                      setIsSellerMenuOpen(false);
                    }}
                    className="p-1 sm:px-1.5 sm:py-0.5 bg-black/30 hover:bg-black/50 text-emerald-100 rounded-md border border-white/20 transition-colors flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold shrink-0 cursor-pointer active:scale-95"
                    title="Menu Acheteur"
                  >
                    <span className="hidden sm:inline">Menu</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isBuyerMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="mt-1 pt-1 border-t border-white/15 flex items-center justify-between text-[9px] sm:text-[10px] text-emerald-100 font-medium">
                  <span className="truncate">Paiement à livraison</span>
                  <span className="font-bold text-white shrink-0 ml-1">0F en ligne</span>
                </div>
              </div>

              {/* Menu Dédié Acheteur Popup */}
              {isBuyerMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                    onClick={() => setIsBuyerMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-slate-900 border-2 border-emerald-400 text-white rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black uppercase text-emerald-400">Menu Espace Acheteur</span>
                      </div>
                      <button
                        onClick={() => setIsBuyerMenuOpen(false)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="py-2 space-y-1 text-xs">
                      <button
                        onClick={() => {
                          handleNavigate('categories');
                          setIsBuyerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Explorer tout le catalogue COD</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsTrackingOpen(true);
                          setIsBuyerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Suivre mon colis en direct</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsCartOpen(true);
                          setIsBuyerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Voir mon panier ({cart.length})</span>
                      </button>

                      <button
                        onClick={() => {
                          if (currentUser) {
                            handleNavigate('customer');
                          } else {
                            setAuthModalMode('register_buyer');
                            setIsAuthModalOpen(true);
                          }
                          setIsBuyerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Mon compte & Historique commandes</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsCustomerServiceOpen(true);
                          setIsBuyerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-950/60 hover:text-emerald-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Service client & Réclamations</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[10px] text-emerald-200/80 bg-emerald-950/40 p-2 rounded-xl">
                      🛡️ <strong>Garantie Zéro Risque :</strong> Aucun paiement bancaire en ligne, vous inspectez le colis avant de régler au livreur.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 2. BOUTON ESPACE VENDEUR (Taille compacte, Ambre doré brillant avec badge d'accès boutique « 0 frais » / « Vendre ») */}
            <div className="relative">
              <div
                className={`w-full h-full rounded-xl p-2 sm:p-2.5 text-left transition-all duration-200 select-none touch-manipulation cursor-pointer flex flex-col justify-between ${
                  currentView === 'seller'
                    ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black border-2 border-amber-200 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-bold border-2 border-amber-300 shadow-xs hover:border-amber-200'
                }`}
                onClick={() => {
                  if (currentUser?.role === 'seller') {
                    handleNavigate('seller');
                  } else {
                    setAuthModalMode('register_seller');
                    setIsAuthModalOpen(true);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-1 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-950 text-amber-400 border border-amber-300/40 flex items-center justify-center shrink-0 shadow-2xs">
                      <StoreIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Badge officiel d'accès boutique « 0 frais » / « Vendre » */}
                        <span className="inline-flex items-center px-1 sm:px-1.5 py-0.1 rounded text-[8px] sm:text-[9px] font-black bg-slate-950 text-amber-300 border border-amber-400/60 shadow-2xs">
                          « 0 frais » / « Vendre »
                        </span>
                      </div>
                      <h2 className="text-xs sm:text-sm font-black text-slate-950 leading-tight truncate">
                        Espace Vendeur
                      </h2>
                    </div>
                  </div>

                  {/* Bouton Menu Dédié */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSellerMenuOpen(!isSellerMenuOpen);
                      setIsBuyerMenuOpen(false);
                    }}
                    className="p-1 sm:px-1.5 sm:py-0.5 bg-slate-950/25 hover:bg-slate-950/40 text-slate-950 rounded-md border border-slate-950/30 transition-colors flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black shrink-0 cursor-pointer active:scale-95"
                    title="Menu Vendeur"
                  >
                    <span className="hidden sm:inline">Menu</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isSellerMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="mt-1 pt-1 border-t border-slate-950/20 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-950 font-bold">
                  <span className="truncate">Boutique gratuite 2 min</span>
                  <span className="bg-slate-950 text-amber-400 px-1 py-0.1 rounded font-black shrink-0 ml-1">
                    0% com.
                  </span>
                </div>
              </div>

              {/* Menu Dédié Vendeur Popup */}
              {isSellerMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                    onClick={() => setIsSellerMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-slate-900 border-2 border-amber-400 text-white rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <StoreIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black uppercase text-amber-400">Menu Espace Vendeur</span>
                      </div>
                      <button
                        onClick={() => setIsSellerMenuOpen(false)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="py-2 space-y-1 text-xs">
                      <button
                        onClick={() => {
                          setAuthModalMode('register_seller');
                          setIsAuthModalOpen(true);
                          setIsSellerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-950/60 hover:text-amber-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Ouvrir ma boutique gratuite (0 frais)</span>
                      </button>

                      <button
                        onClick={() => {
                          if (currentUser?.role === 'seller') {
                            handleNavigate('seller');
                          } else {
                            setAuthModalMode('login');
                            setIsAuthModalOpen(true);
                          }
                          setIsSellerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-950/60 hover:text-amber-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Mon tableau de bord marchand</span>
                      </button>

                      <button
                        onClick={() => {
                          if (currentUser?.role === 'seller') {
                            setSellerActiveTab('orders');
                            handleNavigate('seller');
                          } else {
                            setAuthModalMode('login');
                            setIsAuthModalOpen(true);
                          }
                          setIsSellerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-950/60 hover:text-amber-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Commandes reçues & Expéditions COD</span>
                      </button>

                      <button
                        onClick={() => {
                          if (currentUser?.role === 'seller') {
                            setSellerActiveTab('products');
                            handleNavigate('seller');
                          } else {
                            setAuthModalMode('login');
                            setIsAuthModalOpen(true);
                          }
                          setIsSellerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-950/60 hover:text-amber-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Créateur IA Page de vente & Affiches</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsCustomerServiceOpen(true);
                          setIsSellerMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-950/60 hover:text-amber-300 font-bold flex items-center gap-2 transition cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Assistance & Support vendeurs</span>
                      </button>

                      {/* Direct Logout Option for connected sellers */}
                      {currentUser?.role === 'seller' && (
                        <button
                          onClick={() => {
                            storageService.logout();
                            setCurrentUser(null);
                            handleNavigate('home');
                            setIsSellerMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 font-bold flex items-center gap-2 transition cursor-pointer mt-1 border border-rose-800/40 active:scale-95"
                        >
                          <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Se déconnecter de la boutique</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[10px] text-amber-200/90 bg-amber-950/40 p-2 rounded-xl">
                      ⚡ <strong>Formule 0 Frais :</strong> Vous encaissez directement vos fonds auprès des clients ou livreurs COD.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main View Switcher - pb-20 on mobile prevents bottom navigation overlap */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-20 md:pb-0">
        {/* VIEW 1: HOME - ALIBABA PRESENTATION SUR FOND BLANC */}
        {currentView === 'home' && (
          <div className="bg-white">
            {/* 1. TOP QUICK SOURCING BAR: Uniquement Catégories et Villes avec sélection déroulante */}
            <section className="bg-white border-b border-slate-200/90 py-2.5 sticky top-0 z-20 backdrop-blur-md bg-white/95">
              <div className="max-w-7xl mx-auto px-3 sm:px-6">
                <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center">
                  {/* Select 1: Catégories */}
                  <div className="relative">
                    <label htmlFor="category-select" className="sr-only">Sélectionner une catégorie</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-2.5 sm:left-3 pointer-events-none text-amber-600 flex items-center">
                        <Layers className="w-4 h-4" />
                      </div>
                      <select
                        id="category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all appearance-none cursor-pointer truncate shadow-2xs"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {translateCategory(cat)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 sm:right-3 pointer-events-none text-slate-400 flex items-center">
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Select 2: Villes du Bénin */}
                  <div className="relative">
                    <label htmlFor="city-select" className="sr-only">Sélectionner une ville</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-2.5 sm:left-3 pointer-events-none text-emerald-600 flex items-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <select
                        id="city-select"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all appearance-none cursor-pointer truncate shadow-2xs"
                      >
                        {BENIN_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city === 'Toutes les villes' ? t('filter.allCities') : city}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 sm:right-3 pointer-events-none text-slate-400 flex items-center">
                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtres actifs si sélection non par défaut */}
                {(selectedCategory !== 'Toutes les catégories' || selectedCity !== 'Toutes les villes') && (
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 flex-wrap">
                      <span className="font-semibold text-slate-400">Filtré par :</span>
                      {selectedCategory !== 'Toutes les catégories' && (
                        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                          {translateCategory(selectedCategory)}
                        </span>
                      )}
                      {selectedCity !== 'Toutes les villes' && (
                        <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                          {selectedCity}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCategory('Toutes les catégories');
                        setSelectedCity('Toutes les villes');
                      }}
                      className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer shrink-0 ml-2"
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 2. ALIBABA MASTER MARKETPLACE HERO BANNER (FOND BLANC PROFESSIONNEL) */}
            <section className="bg-gradient-to-b from-slate-50/80 via-white to-white py-6 sm:py-10 border-b border-slate-200/80">
              <div className="max-w-7xl mx-auto px-3 sm:px-6">
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-7 lg:p-9 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                    
                    {/* Left Column: Présentation Marketplace & Garanties */}
                    <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                      {/* Logo Officiel BéninMarket + Badge Confiance */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white rounded-xl p-1 shadow-xs border border-amber-300 shrink-0">
                          <img
                            src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
                            alt="Logo BéninMarket"
                            className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg"
                          />
                        </div>
                        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-2xs">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                          </span>
                          <span>🇧🇯 N°1 Marketplace COD au Bénin</span>
                          <span className="text-emerald-400 font-normal">·</span>
                          <span className="text-emerald-700 font-extrabold">+12 800 clients livrés</span>
                        </div>
                      </div>

                      {/* Titre Principal Alibaba-style */}
                      <div className="space-y-2">
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight font-display">
                          Achetez en direct des boutiques du Bénin, <span className="text-amber-600">payez à la livraison</span>
                        </h1>
                        <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-xl">
                          Commandez en 1 clic sans carte bancaire : ouvrez et inspectez votre colis en mains propres avec le livreur, puis réglez en <strong>espèces</strong> ou par <strong>Mobile Money (MTN / Moov)</strong>.
                        </p>
                      </div>

                      {/* 3 Badges de réassurance immédiate */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-slate-700">
                        <div className="bg-slate-50 border border-slate-200/80 p-2 sm:p-2.5 rounded-xl text-center">
                          <span className="block text-xs sm:text-sm font-black text-emerald-600">0 FCFA</span>
                          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">À l'avance</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 p-2 sm:p-2.5 rounded-xl text-center">
                          <span className="block text-xs sm:text-sm font-black text-amber-600">100% COD</span>
                          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Inspection libre</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 p-2 sm:p-2.5 rounded-xl text-center">
                          <span className="block text-xs sm:text-sm font-black text-slate-800">24h / 48h</span>
                          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Livraison Bénin</span>
                        </div>
                      </div>

                      {/* Boutons d'Action Alibaba */}
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
                        <a
                          href="#catalogue"
                          className="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-98"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Explorer les offres COD</span>
                          <ArrowRight className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => {
                            setAuthModalMode('register_seller');
                            setIsAuthModalOpen(true);
                          }}
                          className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs sm:text-sm border-2 border-emerald-600 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-2xs active:scale-98"
                        >
                          <StoreIcon className="w-4 h-4 text-emerald-600" />
                          <span>Ouvrir ma boutique gratuite (0%)</span>
                        </button>
                        <button
                          onClick={() => setIsTrackingOpen(true)}
                          className="px-3.5 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          <span>Suivre un colis</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Alibaba Super Deal Card (Offre Vedette COD) */}
                    <div className="lg:col-span-5">
                      <div className="bg-slate-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                          <span className="font-black text-amber-700 uppercase flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Super Deal du Jour</span>
                          </span>
                          <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            Paiement à la réception
                          </span>
                        </div>

                        {/* Image produit & Badge Promo */}
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                          <img
                            src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
                            alt="Blazer Royal Wax"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-xs">
                            -20% PROMO
                          </div>
                          <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Danxomè Créations · Cotonou
                          </div>
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                            <div className="font-extrabold text-slate-900 text-sm truncate">
                              Blazer Royal Wax & Revers Soie
                            </div>
                            <div className="flex justify-between items-baseline mt-1">
                              <span className="text-base sm:text-lg font-black text-amber-600 tabular-nums">
                                28 000 FCFA
                              </span>
                              <span className="text-xs text-slate-400 line-through tabular-nums">
                                35 000 FCFA
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bouton de Commande Directe COD */}
                        <button
                          onClick={() => {
                            const prod = products.find((p) => p.id === 'prod-wax-blazer');
                            if (prod) setSelectedProduct(prod);
                          }}
                          className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer text-center block active:scale-98"
                        >
                          Commander en 1 Clic (0F d'avance)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. ALIBABA 4 TRUST PILLARS (GARANTIES ACHETEUR & VENDEUR SUR FOND BLANC) */}
            <section className="bg-white border-b border-slate-200/80 py-5 sm:py-8">
              <div className="max-w-7xl mx-auto px-3 sm:px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  {/* Pilier 1 */}
                  <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-xl transition-all flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-black text-sm">
                      💵
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                        0 FCFA à l'avance
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                        Paiement 100% à la livraison en espèces ou Mobile Money (MTN / Moov).
                      </p>
                    </div>
                  </div>

                  {/* Pilier 2 */}
                  <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-xl transition-all flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-black text-sm">
                      🔍
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                        Inspection libre
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                        Déballez et examinez la qualité du colis avec le livreur avant de régler.
                      </p>
                    </div>
                  </div>

                  {/* Pilier 3 */}
                  <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-xl transition-all flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-black text-sm">
                      ⚡
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                        Livraison 24h / 48h
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                        Expédition rapide à domicile ou au bureau dans toutes les villes du Bénin.
                      </p>
                    </div>
                  </div>

                  {/* Pilier 4 */}
                  <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-xl transition-all flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 font-black text-sm">
                      🛡️
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                        Vendeurs Certifiés
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                        Boutiques locales authentifiées, contacts directs et assistance réactive.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. ALIBABA FLASH DEALS : VENTES FLASH & SUPER PROMOTIONS COD */}
            {promoProducts.length > 0 && (
              <section className="bg-white border-b border-slate-200/80 py-7 sm:py-10">
                <div className="max-w-7xl mx-auto px-3 sm:px-6">
                  {/* Header Ventes Flash avec Compte à Rebours */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                        <Flame className="w-5 h-5 fill-rose-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                            Ventes Flash & Super Promos
                          </h2>
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            COD
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Remises exceptionnelles valables uniquement aujourd'hui avec paiement à la livraison
                        </p>
                      </div>
                    </div>

                    {/* Timer Alibaba Indicatif */}
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] text-slate-300">Offre du jour expire dans :</span>
                      <span className="font-mono text-amber-400 tracking-wider">07:42:15</span>
                    </div>
                  </div>

                  {/* Grille Flash Deals Alibaba (2 colonnes mobile, 4 colonnes desktop) */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {promoProducts.slice(0, 4).map((p) => {
                      const st = stores.find((s) => s.id === p.storeId);
                      const discount = calculateDiscountPercent(p.price, p.promoPrice || p.price);
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className="group bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400 p-2.5 sm:p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            {/* Image avec Badge Promo */}
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-2 left-2 bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs">
                                -{discount}%
                              </span>
                              <span className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded truncate text-center">
                                {st?.city || 'Bénin'}
                              </span>
                            </div>

                            <span className="text-[10px] font-bold text-slate-400 uppercase truncate block">
                              {st?.name}
                            </span>
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 mt-0.5">
                              {p.name}
                            </h3>

                            {/* Prix Promo */}
                            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-sm sm:text-base font-black text-rose-600 tabular-nums">
                                {formatFCFA(p.promoPrice || p.price)}
                              </span>
                              <span className="text-[11px] text-slate-400 line-through tabular-nums">
                                {formatFCFA(p.price)}
                              </span>
                            </div>

                            {/* Barre de progression des ventes style Alibaba */}
                            <div className="mt-2 space-y-1">
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-1.5 rounded-full w-[78%]"></div>
                              </div>
                              <span className="text-[9px] text-slate-500 font-semibold block">
                                🔥 78% déjà réservés en COD
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickBuy(p);
                            }}
                            className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg transition-colors cursor-pointer text-center block"
                          >
                            Acheter en COD
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* 5. ALIBABA FOURNISSEURS LOCAUX & BOUTIQUES OFFICIELLES VÉRIFIÉES */}
            <section className="bg-slate-50/70 border-b border-slate-200/80 py-8 sm:py-12">
              <div className="max-w-7xl mx-auto px-3 sm:px-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Fournisseurs Locaux Agréés</span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">
                      Boutiques et Artisans vérifiés au Bénin
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentView('stores')}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs"
                  >
                    <span>Toutes les boutiques</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {publicStores.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleOpenStore(s.slug)}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3.5 mb-3">
                          <img
                            src={s.logo}
                            alt={s.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1 truncate">
                              <span className="truncate">{s.name}</span>
                              {s.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{s.city}</span>
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                          {s.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{s.rating}</span>
                          <span className="text-slate-400 font-normal">({s.reviewCount})</span>
                        </div>
                        <span className="text-amber-700 font-bold flex items-center gap-1 hover:underline">
                          <span>Visiter la boutique</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. ALIBABA PRODUITS EN VIDÉO DÉMONSTRATIVE */}
            {videoProducts.length > 0 && (
              <section className="bg-white border-b border-slate-200/80 py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-3 sm:px-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                        <Video className="w-4 h-4 text-amber-600" />
                        <span>Démonstrations en Action</span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">
                        Testez les articles en vidéo avant de commander
                      </h2>
                    </div>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      100% Produits réels filmés au Bénin
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {videoProducts.slice(0, 3).map((vp) => {
                      const st = stores.find((s) => s.id === vp.storeId);
                      return (
                        <div
                          key={vp.id}
                          onClick={() => setSelectedProduct(vp)}
                          className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div className="relative aspect-16/9 bg-slate-900 overflow-hidden">
                            <img
                              src={vp.images[0]}
                              alt={vp.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Video className="w-6 h-6 ml-0.5 fill-white" />
                              </div>
                            </div>
                            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                              Voir la vidéo
                            </span>
                          </div>

                          <div className="p-4">
                            <span className="text-[10px] font-bold text-amber-800 uppercase">
                              {st?.name}
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mt-0.5">
                              {vp.name}
                            </h3>
                            <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-slate-100">
                              <span className="font-extrabold text-slate-900 tabular-nums text-sm">
                                {formatFCFA(vp.isPromoActive && vp.promoPrice ? vp.promoPrice : vp.price)}
                              </span>
                              <span className="text-xs font-bold text-amber-700 group-hover:underline">
                                Commander en COD &gt;
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Main Products Catalogue Section - ALIBABA GRAND MARCHÉ */}
            <section id="catalogue" className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {t('catalog.available')} ({sortedProducts.length})
                    </h2>
                    <span className="text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold shadow-2xs">
                      ✓ 100% Paiement à la Réception
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('catalog.subtitle')} · Déballez et inspectez avant de payer en espèces ou Mobile Money
                  </p>
                </div>

                {/* Sort selector & High load stats trigger */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setIsHighLoadModalOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold transition cursor-pointer"
                    title="Voir les métriques de trafic en direct"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>10 000+ En ligne (Fluide)</span>
                  </button>
                  <span className="text-slate-500">{t('catalog.sortBy')}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="featured">{t('catalog.sortFeatured')}</option>
                    <option value="price-asc">{t('catalog.sortPriceAsc')}</option>
                    <option value="price-desc">{t('catalog.sortPriceDesc')}</option>
                    <option value="popular">{t('catalog.sortPopular')}</option>
                  </select>
                </div>
              </div>

              {sortedProducts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                  <p className="text-slate-500 text-sm">
                    {t('catalog.empty')}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
                    {sortedProducts.slice(0, visibleCatalogLimit).map((p) => {
                      const st = stores.find((s) => s.id === p.storeId);
                      return (
                        <ProductCard
                          key={p.id}
                          product={p}
                          store={st}
                          onSelect={setSelectedProduct}
                          onQuickBuy={handleQuickBuy}
                          onAddToCart={(prod) => handleAddToCart(prod, 1)}
                        />
                      );
                    })}
                  </div>

                  {visibleCatalogLimit < sortedProducts.length && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setVisibleCatalogLimit((prev) => prev + 16)}
                        className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                      >
                        <span>Charger 16 articles supplémentaires</span>
                        <span className="text-slate-400 font-normal">
                          ({sortedProducts.length - visibleCatalogLimit} restants)
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 2: CATEGORIES */}
        {currentView === 'categories' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Rayons & Catégories</h1>
            <p className="text-xs text-slate-500 mb-6">
              Tous nos articles physiques livrables à domicile au Bénin
            </p>

            <div className="flex gap-2 flex-wrap mb-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    selectedCategory === c
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* City location filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-4 border-b border-slate-200 scrollbar-none">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Filtrer par ville :</span>
              </span>
              {BENIN_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCity === city
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {city}
                </button>
              ))}
              {selectedCity !== 'Toutes les villes' && (
                <button
                  onClick={() => setSelectedCity('Toutes les villes')}
                  className="text-xs text-amber-700 hover:underline font-semibold ml-2 shrink-0 cursor-pointer"
                >
                  Réinitialiser la ville
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {sortedProducts.map((p) => {
                const st = stores.find((s) => s.id === p.storeId);
                return (
                  <ProductCard
                    key={p.id}
                    product={p}
                    store={st}
                    onSelect={setSelectedProduct}
                    onQuickBuy={handleQuickBuy}
                    onAddToCart={(prod) => handleAddToCart(prod, 1)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: STORES DIRECTORY */}
        {currentView === 'stores' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Boutiques Vendeurs BéninMarket</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Découvrez les boutiques indépendantes et leurs catalogues exclusifs
                </p>
              </div>

              <button
                onClick={() => setIsSellerRegOpen(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm w-fit"
              >
                <StoreIcon className="w-4 h-4" />
                <span>Ouvrir ma boutique gratuite</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicStores.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="h-32 bg-slate-800 relative">
                    <img src={s.banner} alt="" className="w-full h-full object-cover opacity-80" />
                  </div>

                  <div className="p-5 relative -mt-8">
                    <img
                      src={s.logo}
                      alt={s.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md bg-white mb-3"
                    />

                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                      {s.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{s.city} ({s.category})</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {s.description}
                    </p>

                    <button
                      onClick={() => handleOpenStore(s.slug)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                    >
                      Visiter la boutique
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: BOUTIQUE PUBLIQUE DÉDIÉE */}
        {currentView === 'boutique' && activeStore && (
          <StorePublicPage
            store={activeStore}
            products={activeStoreProducts}
            onSelectProduct={setSelectedProduct}
            onQuickBuy={handleQuickBuy}
            onAddToCart={(prod) => handleAddToCart(prod, 1)}
            onBackToMarketplace={() => {
              if (currentUser?.role === 'seller') {
                setCurrentView('seller');
              } else {
                setCurrentView('home');
              }
            }}
          />
        )}

        {/* VIEW 5: SELLER DASHBOARD (PLATEFORME PERSONNELLE VENDEUR) */}
        {currentView === 'seller' && (
          <SellerDashboard
            currentUser={currentUser || storageService.getUsers()[1]}
            onOpenStorePublic={handleOpenStore}
            onPrintOrderReceipt={(order) => setConfirmedOrder(order)}
            activeTab={sellerActiveTab}
            onTabChange={setSellerActiveTab}
          />
        )}

        {/* VIEW 6: ADMIN DASHBOARD (OWNER ONLY) */}
        {currentView === 'admin' && (
          <AdminDashboard
            currentUser={currentUser || ({} as User)}
            onPrintOrderReceipt={(order) => setConfirmedOrder(order)}
            onOpenStore={handleOpenStore}
            onNavigateHome={() => setCurrentView('home')}
            onOpenLogin={() => setIsFounderModalOpen(true)}
          />
        )}

        {/* VIEW 7: CUSTOMER DASHBOARD */}
        {currentView === 'customer' && (
          <CustomerDashboard
            currentUser={currentUser || storageService.getUsers()[4]}
            onOpenOrderReceipt={(order) => setConfirmedOrder(order)}
            onTrackOrder={handleOpenTrackingWithCode}
            onNavigateShopping={() => setCurrentView('home')}
            onOpenCustomerService={(orderId) => {
              setCustomerServiceOrderId(orderId || '');
              setIsCustomerServiceOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        currentUser={currentUser}
        onOpenSellerModal={() => {
          setAuthModalMode('register_seller');
          setIsAuthModalOpen(true);
        }}
        onOpenTrack={() => setIsTrackingOpen(true)}
        onNavigateHome={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFounderModal={() => setIsFounderModalOpen(true)}
        onNavigateAdmin={() => {
          setCurrentView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCustomerService={() => {
          setCustomerServiceOrderId('');
          setIsCustomerServiceOpen(true);
        }}
        onOpenPWAInstall={promptPWAInstall}
      />

      {/* MODAL: Product Detail */}
      <ProductDetailModal
        product={selectedProduct}
        store={stores.find((s) => s.id === selectedProduct?.storeId)}
        isLoggedIn={!!currentUser}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onDirectOrder={handleQuickBuy}
        onOpenStore={handleOpenStore}
      />

      {/* DRAWER: Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        stores={stores}
        onUpdateQuantity={(id, q) => storageService.updateCartQuantity(id, q)}
        onCheckout={handleCheckoutFromCart}
      />

      {/* MODAL: Checkout */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={checkoutItems}
        stores={stores}
        currentUser={currentUser}
        onOrderSuccess={handleOrderSuccess}
        onRequireAuth={() => {
          setAuthModalMode('register_buyer');
          setAuthPromptReason("Pour avoir accès à l'option de commander un produit, vous devez d'abord vous inscrire en tant qu'acheteur.");
          setIsAuthModalOpen(true);
        }}
      />

      {/* MODAL: Order Confirmation & Receipt Generator */}
      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onTrackOrder={handleOpenTrackingWithCode}
        onOpenBonDeCommande={(o) => setBonDeCommandeOrder(o)}
      />

      {/* MODAL: Order Tracking */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => {
          setIsTrackingOpen(false);
          setTrackingInitialCode('');
        }}
        initialTrackingCode={trackingInitialCode}
        onOpenCustomerService={(orderId) => {
          setCustomerServiceOrderId(orderId || '');
          setIsCustomerServiceOpen(true);
        }}
      />

      {/* MODAL: Seller Onboarding (Legacy quick modal) */}
      <SellerRegistrationModal
        isOpen={isSellerRegOpen}
        onClose={() => setIsSellerRegOpen(false)}
        onRegistrationSuccess={(user, store) => {
          setIsSellerRegOpen(false);
          handleOpenStore(store.slug);
        }}
      />

      {/* MODAL: Owner Administrator Access */}
      <FounderAccessModal
        isOpen={isFounderModalOpen}
        onClose={() => setIsFounderModalOpen(false)}
        onAccessGranted={(adminUser) => {
          setCurrentUser(adminUser);
          setCurrentView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* MODAL: Unified Alibaba-style Auth (Buyer, Seller & Owner Admin) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingOrderAction(null);
          setAuthPromptReason('');
        }}
        initialMode={authModalMode}
        authPromptReason={authPromptReason}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);

          if (user.role === 'admin') {
            setPendingOrderAction(null);
            setAuthPromptReason('');
            setCurrentView('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }

          // If the user was trying to place an order, automatically resume the checkout!
          if (pendingOrderAction) {
            const pending = pendingOrderAction;
            setPendingOrderAction(null);
            setAuthPromptReason('');

            if (pending.type === 'quick_buy' && pending.product) {
              const { product, quantity = 1, variants = {} } = pending;
              const price = product.isPromoActive && product.promoPrice ? product.promoPrice : product.price;
              const directItem: CartItem = {
                id: `direct-${Date.now()}`,
                productId: product.id,
                storeId: product.storeId,
                productName: product.name,
                productImage: product.images[0] || '',
                price,
                normalPrice: product.price,
                quantity,
                selectedVariants: variants,
              };
              setCheckoutItems([directItem]);
              setIsCheckoutOpen(true);
              return;
            }

            if (pending.type === 'cart_checkout') {
              setCheckoutItems([...cart]);
              setIsCheckoutOpen(true);
              return;
            }
          }

          if (user.role === 'seller') {
            setCurrentView('seller');
          } else {
            setCurrentView('customer');
          }
        }}
      />

      {/* MODAL: Customer Service & Grievance Portal to kgmservices229@gmail.com */}
      <CustomerServiceModal
        isOpen={isCustomerServiceOpen}
        onClose={() => {
          setIsCustomerServiceOpen(false);
          setCustomerServiceOrderId('');
        }}
        currentUser={currentUser}
        initialOrderId={customerServiceOrderId}
      />

      {/* MODAL: SELLER BOUNDARY CONFIRMATION (Chaque vendeur est sur sa plateforme personnelle) */}
      {isSellerBoundaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <StoreIcon className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Vous êtes sur votre Plateforme Vendeur
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Votre compte vendeur est dédié à la gestion de votre boutique, de vos produits et du traitement de vos commandes clients. Chaque vendeur opère en toute confidentialité sur sa propre plateforme personnelle.
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Pour explorer les articles d'autres vendeurs et commander en tant que client avec paiement à la livraison, vous devez fermer votre session vendeur.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setIsSellerBoundaryModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                Rester sur mon espace vendeur
              </button>
              <button
                type="button"
                onClick={() => {
                  storageService.logout();
                  setIsSellerBoundaryModalOpen(false);
                  setCurrentView('home');
                }}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center border border-rose-200"
              >
                Se déconnecter pour acheter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High Concurrency Monitor Modal (10,000+ simultaneous users) */}
      <HighLoadMonitorModal
        isOpen={isHighLoadModalOpen}
        onClose={() => setIsHighLoadModalOpen(false)}
        totalProductsCount={products.length}
      />

      {/* Official Bon De Commande Modal */}
      <BonDeCommandeModal
        order={bonDeCommandeOrder}
        isOpen={!!bonDeCommandeOrder}
        onClose={() => setBonDeCommandeOrder(null)}
      />

      {/* Official Payment Receipt Modal */}
      <PaymentReceiptModal
        order={paymentReceiptOrder}
        isOpen={!!paymentReceiptOrder}
        onClose={() => setPaymentReceiptOrder(null)}
      />

      {/* 24/7 Global AI Assistant for all Platform Visitors */}
      <VisitorAIAssistant
        onOpenTrack={() => setIsTrackingOpen(true)}
        onOpenSellerOnboarding={() => {
          setAuthModalMode('register_seller');
          setIsAuthModalOpen(true);
        }}
        onExploreMarketplace={() => setCurrentView('home')}
      />
    </div>
  );
}
