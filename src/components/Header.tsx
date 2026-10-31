import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Store as StoreIcon,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  Package,
  Lock,
  ExternalLink,
  Mail,
  LogOut,
  HelpCircle,
  MapPin,
  ChevronRight,
  Home,
  X,
  Settings,
  Megaphone,
  Eye,
  LayoutDashboard,
  Power,
  Globe,
  Download,
} from 'lucide-react';
import { User, Store, Product } from '../types';
import { storageService } from '../services/storageService';
import { mediaStorage } from '../services/mediaStorage';
import { formatFCFA } from '../utils/formatters';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../i18n/LanguageContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  currentUser: User | null;
  onNavigate: (view: 'home' | 'categories' | 'stores' | 'track' | 'seller' | 'admin' | 'customer', param?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenTrack: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeView: string;
  onOpenFounderModal?: () => void;
  onOpenCustomerService?: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'register_buyer' | 'register_seller') => void;
  products?: Product[];
  stores?: Store[];
  selectedCity?: string;
  onSelectProduct?: (product: Product) => void;
  onSelectStore?: (storeSlug: string) => void;
  onSelectCity?: (city: string) => void;
  sellerActiveTab?: 'overview' | 'products' | 'orders' | 'abandoned_carts' | 'promotions' | 'settings';
  onSellerTabChange?: (tab: 'overview' | 'products' | 'orders' | 'abandoned_carts' | 'promotions' | 'settings') => void;
  onPreviewOwnStore?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onNavigate,
  cartCount,
  onOpenCart,
  onOpenTrack,
  searchQuery,
  onSearchChange,
  activeView,
  onOpenFounderModal,
  onOpenCustomerService,
  onOpenAuthModal,
  products = [],
  stores = [],
  selectedCity,
  onSelectProduct,
  onSelectStore,
  onSelectCity,
  sellerActiveTab = 'overview',
  onSellerTabChange,
  onPreviewOwnStore,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const { language, currentLanguageOption, setLanguage, t } = useLanguage();
  const { isInstalled, triggerInstall } = usePWAInstall();

  const isOwnerAdmin =
    currentUser?.role === 'admin' &&
    currentUser?.email?.toLowerCase() === 'kazottimahutondj@gmail.com';
  const isBuyerSpace = activeView !== 'seller' && activeView !== 'admin';
  const isSellerSpace = activeView === 'seller';
  const isAdminSpace = activeView === 'admin';

  const sellerStore =
    currentUser?.role === 'seller'
      ? stores.find((s) => s.id === currentUser.storeId || s.sellerId === currentUser.id) || stores[0]
      : null;

  const cleanQ = searchQuery.trim().toLowerCase();

  const matchingProducts = cleanQ
    ? products.filter((p) => {
        const store = stores.find((s) => s.id === p.storeId);
        if (store?.isBlocked) return false;
        return (
          p.name.toLowerCase().includes(cleanQ) ||
          p.category.toLowerCase().includes(cleanQ) ||
          p.description.toLowerCase().includes(cleanQ) ||
          (store && (store.name.toLowerCase().includes(cleanQ) || store.city.toLowerCase().includes(cleanQ)))
        );
      }).slice(0, 5)
    : [];

  const matchingStores = cleanQ
    ? stores.filter(
        (s) =>
          !s.isBlocked &&
          (s.name.toLowerCase().includes(cleanQ) ||
            s.category.toLowerCase().includes(cleanQ) ||
            s.city.toLowerCase().includes(cleanQ))
      ).slice(0, 3)
    : [];

  const BENIN_CITIES = ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Ouidah', 'Bohicon', 'Natitingou'];
  const matchingCities = cleanQ
    ? BENIN_CITIES.filter((c) => c.toLowerCase().includes(cleanQ))
    : [];

  const renderSearchDropdown = () => {
    if (!searchFocused || !cleanQ) return null;
    const hasAnyResults = matchingCities.length > 0 || matchingStores.length > 0 || matchingProducts.length > 0;

    return (
      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
        {/* Lieux / Villes correspondants */}
        {matchingCities.length > 0 && (
          <div className="p-3 bg-amber-50/70">
            <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1 mb-2">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Villes & Lieux où trouver des produits ({matchingCities.length})</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {matchingCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onMouseDown={() => {
                    if (onSelectCity) onSelectCity(city);
                    setSearchFocused(false);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>{city}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Boutiques correspondantes */}
        {matchingStores.length > 0 && (
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1 mb-2">
              <StoreIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Boutiques & Vendeurs ({matchingStores.length})</span>
            </span>
            <div className="space-y-1.5">
              {matchingStores.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onMouseDown={() => {
                    if (onSelectStore) onSelectStore(st.slug);
                    setSearchFocused(false);
                  }}
                  className="w-full text-left p-2 hover:bg-slate-50 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={mediaStorage.resolveUrl(st.logo)}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{st.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        <span>{st.city}</span>
                        <span>·</span>
                        <span>{st.category}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Produits correspondants */}
        {matchingProducts.length > 0 ? (
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1 mb-2">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>Articles & Produits ({matchingProducts.length})</span>
            </span>
            <div className="space-y-1.5">
              {matchingProducts.map((p) => {
                const store = stores.find((s) => s.id === p.storeId);
                const activePrice = p.isPromoActive && p.promoPrice ? p.promoPrice : p.price;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => {
                      if (onSelectProduct) onSelectProduct(p);
                      setSearchFocused(false);
                    }}
                    className="w-full text-left p-2 hover:bg-slate-50 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={mediaStorage.resolveUrl(p.images[0])}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-700">{formatFCFA(activePrice)}</span>
                          <span>·</span>
                          <span className="truncate">{store?.name}</span>
                          <span>·</span>
                          <span className="text-slate-400 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {store?.city}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {p.stock > 0 ? `${p.stock} en stock` : 'Rupture'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          !hasAnyResults && (
            <div className="p-4 text-center text-slate-400 text-xs">
              Aucun produit, boutique ou lieu trouvé pour « {searchQuery} ».
            </div>
          )
        )}
      </div>
    );
  };

  // DEDICATED SELLER PLATFORM HEADER: Zero access to buyer marketplace when in seller space
  if (isSellerSpace) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full max-w-full overflow-hidden">
        {/* Top Reassurance Bar for Seller */}
        <div className="bg-slate-950 text-slate-200 text-xs py-1.5 px-3 sm:px-4 border-b border-slate-800 overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-amber-400 text-[11px] sm:text-xs truncate">Plateforme Vendeur</span>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <span className="text-slate-300 hidden md:inline">Catalogue Illimité · 10 000+ Visiteurs Simultanés</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 text-slate-300 text-[10px] sm:text-[11px] shrink-0">
              <button
                onClick={onOpenCustomerService}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Support vendeurs"
              >
                <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Support :</span>
                <span className="font-bold text-amber-300">kgmservices229@gmail.com</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navigation Row for Seller (NO competitor search, NO buyer cart) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
          {/* Official Brand Logo + Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
          >
            <img
              src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
              alt="Logo BéninMarket"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-contain bg-white border border-slate-200 shadow-2xs p-0.5 shrink-0"
            />
            <div className="text-lg sm:text-2xl font-black tracking-tight leading-none">
              <span className="text-emerald-700">Bénin</span>
              <span className="text-amber-500">Market</span>
            </div>
            <span className="bg-slate-900 text-amber-400 border border-slate-700 font-extrabold text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg uppercase tracking-wider hidden xs:inline-block">
              Espace Vendeur
            </span>
          </button>

          {/* Center: Seller's Store Card (visible on sm+) */}
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs min-w-0">
            <img
              src={mediaStorage.resolveUrl(sellerStore?.logo || '') || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=100&q=80'}
              alt=""
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
            />
            <div className="text-left leading-tight min-w-0">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span className="truncate max-w-[120px] lg:max-w-[180px]">{sellerStore?.name || 'Ma Boutique'}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${sellerStore?.isOpen !== false ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <span className="text-[10px] text-slate-500 truncate block">
                {sellerStore?.city || 'Bénin'} · {sellerStore?.isOpen !== false ? 'Ouverte' : 'En Pause'}
              </span>
            </div>
          </div>

          {/* Right: Seller Platform Shortcuts & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Direct switch to Espace Acheteur */}
            <button
              onClick={() => onNavigate('home')}
              className="px-3 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-2 border-emerald-400/80"
              title="Basculer vers l'Espace Acheteur"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-100" />
              <span>Espace Acheteur</span>
            </button>

            {!isInstalled && (
              <button
                onClick={triggerInstall}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Installer l'application sur téléphone ou ordinateur"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t('nav.installApp')}</span>
              </button>
            )}

            {onPreviewOwnStore && (
              <button
                onClick={onPreviewOwnStore}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
                title="Prévisualiser votre boutique"
              >
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Aperçu vitrine</span>
              </button>
            )}

            <button
              onClick={() => onSellerTabChange?.('settings')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer ${
                sellerActiveTab === 'settings'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
              title="Configurer les paramètres de la boutique"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Paramètres</span>
            </button>

            <button
              onClick={() => {
                storageService.logout();
                onNavigate('home');
              }}
              className="px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95 touch-manipulation"
              title="Fermer la session vendeur"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Mobile App Bottom Navigation Bar for Seller (With direct Déconnexion for Android / iOS) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[52px] bg-slate-900 text-white border-t border-slate-800 px-1 py-1 flex items-center justify-around shadow-2xl safe-area-bottom select-none">
          <button
            onClick={() => onSellerTabChange?.('overview')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-bold transition-colors cursor-pointer ${
              sellerActiveTab === 'overview' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau</span>
          </button>

          <button
            onClick={() => onSellerTabChange?.('products')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-bold transition-colors cursor-pointer ${
              sellerActiveTab === 'products' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produits</span>
          </button>

          <button
            onClick={() => onSellerTabChange?.('orders')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-bold transition-colors cursor-pointer ${
              sellerActiveTab === 'orders' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            <span>Commandes</span>
          </button>

          <button
            onClick={() => onSellerTabChange?.('settings')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-bold transition-colors cursor-pointer ${
              sellerActiveTab === 'settings' ? 'text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </button>

          <button
            onClick={() => {
              storageService.logout();
              onNavigate('home');
            }}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-black text-rose-400 hover:text-rose-300 transition-colors cursor-pointer active:scale-90"
            title="Se déconnecter"
          >
            <div className="p-0.5 rounded-md bg-rose-500/20 text-rose-400">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Quitter</span>
          </button>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full max-w-full overflow-hidden pt-1 sm:pt-2">
      {/* Top Reassurance Bar: 1 slim bar for Cash on Delivery guarantee */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-3 sm:px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span className="font-medium tracking-wide truncate text-[10px] sm:text-xs">{t('nav.codGuarantee')}</span>
            <span className="text-slate-400 hidden md:inline">·</span>
            <span className="text-slate-300 hidden md:inline">{t('nav.zeroOnline')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-slate-300 text-[10px] sm:text-[11px] shrink-0">
            {/* 10-Language Selector in Top Bar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu((prev) => !prev)}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Traduire la plateforme (10 langues)"
              >
                <Globe className="w-3 h-3 text-amber-400" />
                <span>{currentLanguageOption.flag}</span>
                <span className="hidden xs:inline">{currentLanguageOption.nativeName}</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="fixed sm:absolute right-2 sm:right-0 top-8 sm:top-full mt-1 w-48 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-2xl p-1.5 z-50 text-xs grid grid-cols-1 gap-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 mb-0.5">
                    10 Langues disponibles
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code as LanguageCode);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        language === lang.code
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isInstalled && (
              <button
                type="button"
                onClick={triggerInstall}
                className="px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                title="Installer l'application directement sur téléphone ou ordinateur"
              >
                <Download className="w-3 h-3" />
                <span>{t('nav.installApp')}</span>
              </button>
            )}

            <button
              onClick={onOpenTrack}
              className="hover:text-white transition-colors items-center gap-1 cursor-pointer hidden sm:flex"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('nav.trackOrder')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header - Lowered with ample vertical clearance for Android and iOS */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-4 md:gap-6 overflow-hidden">
        {/* Zone 1: Official Brand Logo + Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="text-lg sm:text-2xl font-extrabold tracking-tight whitespace-nowrap shrink-0 text-left hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-2 sm:gap-2.5"
        >
          <img
            src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
            alt="Logo BéninMarket"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-contain bg-white border border-slate-200 shadow-2xs p-0.5 shrink-0"
          />
          <div>
            <span className="text-emerald-700">Bénin</span>
            <span className="text-amber-500">Market</span>
          </div>
          {isAdminSpace && (
            <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.5 rounded-full hidden xs:inline-block">
              Super Admin
            </span>
          )}
        </button>

        {/* Category Navigation Links (Accueil button removed as requested) */}
        {isBuyerSpace && (
          <div className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs font-bold text-slate-600 shrink-0">
            <button
              onClick={() => onNavigate('categories')}
              className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg transition-colors hover:text-slate-900 hover:bg-slate-100 cursor-pointer ${
                activeView === 'categories' ? 'text-amber-700 font-extrabold bg-amber-50' : ''
              }`}
            >
              {t('nav.allProducts')}
            </button>
            <button
              onClick={() => onNavigate('stores')}
              className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg transition-colors hover:text-slate-900 hover:bg-slate-100 cursor-pointer ${
                activeView === 'stores' ? 'text-amber-700 font-extrabold bg-amber-50' : ''
              }`}
            >
              {t('nav.stores')}
            </button>
            <button
              onClick={onOpenTrack}
              className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg transition-colors hover:text-slate-900 hover:bg-slate-100 cursor-pointer ${
                activeView === 'track' ? 'text-amber-700 font-extrabold bg-amber-50' : ''
              }`}
            >
              {t('nav.track')}
            </button>
          </div>
        )}

        {/* Search Input (only when browsing) */}
        {isBuyerSpace && (
          <div className="flex-1 max-w-xs md:max-w-sm hidden md:block relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
              placeholder={t('nav.searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {renderSearchDropdown()}
          </div>
        )}

        {/* Zone 3: Actions & Account (Clean Header) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* If not logged in, show Connexion button */}
          {!currentUser && (
            <button
              onClick={() => onOpenAuthModal?.('login')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95 touch-manipulation shrink-0"
              title="Se connecter"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Connexion</span>
            </button>
          )}

          {/* If Owner Admin is logged in, show their private dashboard button */}
          {isOwnerAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAdminSpace
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Administration Propriétaire"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Active User Account Pill if logged in */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Mon Profil"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="font-semibold text-slate-800 max-w-[60px] sm:max-w-[110px] truncate">
                  {isOwnerAdmin ? '👑 Propriétaire' : currentUser.firstName || currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Connecté en tant que :</div>
                    <div className="font-bold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-slate-500 truncate text-[11px]">{currentUser.email}</div>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOwnerAdmin
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentUser.role === 'seller'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isOwnerAdmin ? '👑 Propriétaire & Admin' : currentUser.role === 'seller' ? 'Vendeur Marchand' : 'Client Acheteur'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    {currentUser.role === 'seller' ? (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('seller');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2 text-slate-800 font-semibold cursor-pointer"
                      >
                        <StoreIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>Mon Tableau de Bord Vendeur</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('customer');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2 text-slate-800 font-semibold cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        <span>Mon Espace Client & Commandes</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenCustomerService?.();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Écrire au Responsable (kgmservices229@gmail.com)</span>
                    </button>
                  </div>

                  {/* Owner admin private dashboard */}
                  {isOwnerAdmin && (
                    <div className="border-t border-slate-100 pt-1 mt-1 bg-emerald-50/50 p-2">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-200" />
                        <span>Administration Propriétaire</span>
                      </button>
                    </div>
                  )}

                  {/* Disconnect button */}
                  <div className="border-t border-slate-100 pt-1 mt-1 px-2">
                    <button
                      onClick={() => {
                        storageService.logout();
                        setShowUserDropdown(false);
                        onNavigate('home');
                      }}
                      className="w-full text-left px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart Trigger Button (Buyer mode) */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Voir le panier"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] sm:text-[11px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-sm tabular-nums">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search bar (Buyer mode) */}
      {isBuyerSpace && (
        <div className="md:hidden px-3 sm:px-4 pb-2.5">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
              placeholder="Rechercher article, boutique, lieu..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {renderSearchDropdown()}
          </div>
        </div>
      )}

      {/* Mobile App Bottom Navigation Bar (5 Native App Tabs for Android & iOS) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[52px] bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1.5 py-1 flex items-center justify-around shadow-2xl safe-area-bottom select-none">
        {/* Tab 1: Acheteur */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold transition-all active:scale-90 cursor-pointer touch-manipulation ${
            activeView === 'home'
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Espace Acheteur"
        >
          <div className={`p-1 rounded-lg transition-colors ${activeView === 'home' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="truncate max-w-[55px]">Acheteur</span>
        </button>

        {/* Tab 2: Vendeur */}
        <button
          onClick={() => {
            if (currentUser?.role === 'seller') {
              onNavigate('seller');
            } else {
              onOpenAuthModal?.('register_seller');
            }
          }}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold transition-all active:scale-90 cursor-pointer touch-manipulation ${
            activeView === 'seller'
              ? 'text-amber-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Espace Vendeur"
        >
          <div className={`p-1 rounded-lg transition-colors relative ${activeView === 'seller' ? 'bg-amber-100 text-amber-800' : ''}`}>
            <StoreIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-amber-500 text-[8px] font-black text-slate-950 px-1 rounded-full scale-75">
              0F
            </span>
          </div>
          <span className="truncate max-w-[55px]">Vendeur</span>
        </button>

        {/* Tab 3: Explorer */}
        <button
          onClick={() => onNavigate('categories')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold transition-all active:scale-90 cursor-pointer touch-manipulation ${
            activeView === 'categories' || activeView === 'stores' || activeView === 'boutique'
              ? 'text-slate-900 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Explorer le catalogue"
        >
          <div className={`p-1 rounded-lg transition-colors ${activeView === 'categories' || activeView === 'stores' || activeView === 'boutique' ? 'bg-slate-200 text-slate-900' : ''}`}>
            <Search className="w-5 h-5" />
          </div>
          <span className="truncate max-w-[55px]">Explorer</span>
        </button>

        {/* Tab 4: Panier */}
        <button
          onClick={onOpenCart}
          className="flex-1 relative flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-all active:scale-90 cursor-pointer touch-manipulation"
          title="Mon Panier"
        >
          <div className="relative p-1">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-1.5 bg-amber-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="truncate max-w-[55px]">Panier</span>
        </button>

        {/* Tab 5: Compte */}
        <button
          onClick={() => {
            if (currentUser?.role === 'seller') {
              onNavigate('seller');
            } else if (currentUser?.role === 'customer') {
              onNavigate('customer');
            } else if (currentUser?.role === 'admin') {
              onNavigate('admin');
            } else {
              onOpenAuthModal?.('login');
            }
          }}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl text-[10px] font-bold transition-all active:scale-90 cursor-pointer touch-manipulation ${
            activeView === 'customer' || activeView === 'admin'
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Mon Compte"
        >
          <div className={`p-1 rounded-lg transition-colors ${activeView === 'customer' || activeView === 'admin' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <UserIcon className="w-5 h-5" />
          </div>
          <span className="truncate max-w-[55px]">{currentUser ? (currentUser.role === 'seller' ? 'Boutique' : 'Compte') : 'Connexion'}</span>
        </button>
      </nav>
    </header>
  );
};
