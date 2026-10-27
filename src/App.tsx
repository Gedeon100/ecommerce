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

import { storageService } from './services/storageService';
import { Product, Store, Order, CartItem, User } from './types';
import { CATEGORIES } from './data/initialData';
import { formatFCFA, calculateDiscountPercent } from './utils/formatters';

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
} from 'lucide-react';

export default function App() {
  // Reactive state synced with storageService
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [stores, setStores] = useState<Store[]>(() => storageService.getStores());
  const [cart, setCart] = useState<CartItem[]>(() => storageService.getCart());

  // Views & Routing
  const [currentView, setCurrentView] = useState<'home' | 'categories' | 'stores' | 'boutique' | 'seller' | 'admin' | 'customer'>('home');
  const [activeStoreSlug, setActiveStoreSlug] = useState<string>('danxome-creations');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes les catégories');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular'>('featured');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
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

  // Filtered and sorted products for home/categories view
  const filteredProducts = products.filter((p) => {
    if (!p.isPublished) return false;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Toutes les catégories' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.isPromoActive && a.promoPrice ? a.promoPrice : a.price;
    const priceB = b.isPromoActive && b.promoPrice ? b.promoPrice : b.price;

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'popular') return (b.salesCount || 0) - (a.salesCount || 0);
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  // Promotional items
  const promoProducts = products.filter((p) => p.isPublished && p.isPromoActive && p.promoPrice);
  // Video items
  const videoProducts = products.filter((p) => p.isPublished && p.videoUrl);

  // Navigation Handler
  const handleNavigate = (view: 'home' | 'categories' | 'stores' | 'track' | 'seller' | 'admin' | 'customer', param?: string) => {
    if (view === 'track') {
      setIsTrackingOpen(true);
      return;
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
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
      />

      {/* Main View Switcher */}
      <main className="flex-1">
        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <div>
            {/* Hero Section: African E-Commerce & Cash on Delivery focus */}
            <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white overflow-hidden py-12 md:py-16">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-6">
                  {/* First Text: Major platform stats requested */}
                  <div className="inline-flex flex-wrap items-center gap-2 bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-amber-500/20 border border-amber-400/40 text-amber-200 px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-lg">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                    </span>
                    <span className="text-white">Plus de 20 000 utilisateurs</span>
                    <span className="text-amber-400 font-normal">·</span>
                    <span className="text-amber-300">Plus de 12 000 commandes traitées en 2026</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white font-display">
                    Achetez en toute confiance auprès des commerçants du Bénin.
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                    Rejoignez plus de <strong>20 000 utilisateurs</strong> avec plus de <strong>12 000 commandes traitées en 2026</strong>. Commandez sans carte bancaire ni prépaiement : vos colis sont livrés chez vous à Cotonou, Calavi, Porto-Novo et partout au Bénin avec paiement 100% à la livraison.
                  </p>

                  {/* Reassurance Feature Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>0 FCFA payé en ligne</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-lg">
                      <Truck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Livraison à domicile</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-lg">
                      <StoreIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Boutiques vérifiées</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="#catalogue"
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Explorer les produits</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        setAuthModalMode('register_seller');
                        setIsAuthModalOpen(true);
                      }}
                      className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/20 transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      <StoreIcon className="w-4 h-4 text-amber-400" />
                      <span>Créer ma boutique (Devenir Vendeur)</span>
                    </button>
                  </div>
                </div>

                {/* Hero Showcase Card */}
                <div className="lg:col-span-5">
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl shadow-2xl space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-white/10">
                      <span className="font-semibold text-amber-400">En vedette aujourd'hui</span>
                      <span>Paiement à la réception</span>
                    </div>

                    <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-800">
                      <img
                        src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
                        alt="Blazer Royal Wax"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                        -20% Promotion
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-xs">
                        <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                          Danxomè Créations · Cotonou
                        </div>
                        <div className="font-bold text-white text-sm">Blazer Royal Wax & Revers Soie</div>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-base font-extrabold text-amber-400 tabular-nums">28 000 FCFA</span>
                          <span className="text-xs text-slate-400 line-through tabular-nums">35 000 FCFA</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const prod = products.find((p) => p.id === 'prod-wax-blazer');
                        if (prod) setSelectedProduct(prod);
                      }}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center block"
                    >
                      Commander en espèces à la livraison
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Category Selector Bar */}
            <section className="bg-white border-b border-slate-200 py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Video Demonstration Spotlight Section */}
            {videoProducts.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                      <Video className="w-4 h-4 text-amber-600" />
                      <span>Vidéos Démonstratives</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                      Découvrez les produits en action
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Vérifiez la qualité réelle avant de commander
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {videoProducts.slice(0, 3).map((vp) => {
                    const st = stores.find((s) => s.id === vp.storeId);
                    return (
                      <div
                        key={vp.id}
                        onClick={() => setSelectedProduct(vp)}
                        className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
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
                            <span className="text-xs font-semibold text-amber-700 group-hover:underline">
                              Commander &gt;
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Featured Local Stores */}
            <section className="bg-slate-100/70 border-y border-slate-200 py-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      Entrepreneurs Locaux
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                      Boutiques vérifiées au Bénin
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentView('stores')}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Toutes les boutiques</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stores.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleOpenStore(s.slug)}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3.5 mb-3">
                          <img
                            src={s.logo}
                            alt={s.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                              <span>{s.name}</span>
                              {s.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {s.city}
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
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <span>Entrer dans la boutique</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Main Products Catalogue Section */}
            <section id="catalogue" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Produits disponibles ({sortedProducts.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sélectionnez vos articles et confirmez sans paiement en ligne
                  </p>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Trier par :</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="featured">En vedette</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="popular">Meilleures ventes</option>
                  </select>
                </div>
              </div>

              {sortedProducts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                  <p className="text-slate-500 text-sm">
                    Aucun produit ne correspond à vos critères pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

            <div className="flex gap-2 flex-wrap mb-8">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    selectedCategory === c
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
              {stores.map((s) => (
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
            onBackToMarketplace={() => setCurrentView('home')}
          />
        )}

        {/* VIEW 5: SELLER DASHBOARD */}
        {currentView === 'seller' && (
          <SellerDashboard
            currentUser={currentUser || storageService.getUsers()[1]}
            onOpenStorePublic={handleOpenStore}
            onPrintOrderReceipt={(order) => setConfirmedOrder(order)}
            onSwitchToBuyer={() => setCurrentView('home')}
          />
        )}

        {/* VIEW 6: ADMIN DASHBOARD */}
        {currentView === 'admin' && (
          <AdminDashboard
            currentUser={currentUser || storageService.getUsers()[0]}
            onPrintOrderReceipt={(order) => setConfirmedOrder(order)}
            onOpenStore={handleOpenStore}
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
        onOpenSellerModal={() => {
          setAuthModalMode('register_seller');
          setIsAuthModalOpen(true);
        }}
        onOpenTrack={() => setIsTrackingOpen(true)}
        onNavigateHome={() => setCurrentView('home')}
        onOpenFounderModal={() => setIsFounderModalOpen(true)}
        onOpenCustomerService={() => {
          setCustomerServiceOrderId('');
          setIsCustomerServiceOpen(true);
        }}
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

      {/* MODAL: Secret Founder Access for Pasteur Kazotti */}
      <FounderAccessModal
        isOpen={isFounderModalOpen}
        onClose={() => setIsFounderModalOpen(false)}
        onAccessGranted={(adminUser) => {
          setCurrentUser(adminUser);
          setCurrentView('admin');
        }}
      />

      {/* MODAL: Unified Alibaba-style Auth (Buyer & Seller) */}
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
          } else if (user.role === 'admin') {
            setCurrentView('admin');
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
    </div>
  );
}
