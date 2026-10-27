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
} from 'lucide-react';
import { User, Store } from '../types';
import { storageService } from '../services/storageService';

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
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBuyerMenu, setShowBuyerMenu] = useState(false);
  const [showSellerMenu, setShowSellerMenu] = useState(false);

  const isPasteurKazotti = currentUser?.email === 'pasteurkazotti@gmail.com' || currentUser?.role === 'admin';
  const isBuyerSpace = activeView !== 'seller' && activeView !== 'admin';
  const isSellerSpace = activeView === 'seller';
  const isAdminSpace = activeView === 'admin';

  const handleBuyerSpaceClick = () => {
    if (currentUser?.role === 'customer') {
      onNavigate('customer');
      return;
    }
    setShowBuyerMenu(!showBuyerMenu);
    setShowSellerMenu(false);
  };

  const handleSellerSpaceClick = () => {
    if (currentUser?.role === 'seller') {
      onNavigate('seller');
      return;
    }
    setShowSellerMenu(!showSellerMenu);
    setShowBuyerMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Reassurance Bar: 1 slim bar for Cash on Delivery guarantee */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium tracking-wide">Paiement 100% à la livraison au Bénin</span>
            <span className="text-slate-400 hidden sm:inline">·</span>
            <span className="text-slate-300 hidden sm:inline">Aucune carte ni paiement en ligne requis</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-[11px]">
            <button
              onClick={onOpenCustomerService}
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Écrire au responsable du site"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Service Client :</span>
              <span className="font-bold text-amber-300">kgmservices229@gmail.com</span>
            </button>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <button
              onClick={onOpenTrack}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Suivre mon colis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 md:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
        >
          <div>
            <span className="text-amber-600">Bénin</span>
            <span>Market</span>
          </div>
          {isAdminSpace && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full">
              Super Admin
            </span>
          )}
        </button>

        {/* Zone 2: Navigation Links (Buyer mode) or Search */}
        {isBuyerSpace ? (
          <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 ${
                activeView === 'home' ? 'text-amber-700 font-bold border-b-2 border-amber-600' : ''
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => onNavigate('categories')}
              className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 ${
                activeView === 'categories' ? 'text-amber-700 font-bold border-b-2 border-amber-600' : ''
              }`}
            >
              Tous les Articles
            </button>
            <button
              onClick={() => onNavigate('stores')}
              className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 ${
                activeView === 'stores' ? 'text-amber-700 font-bold border-b-2 border-amber-600' : ''
              }`}
            >
              Boutiques Vendeurs
            </button>
            <button
              onClick={onOpenTrack}
              className={`whitespace-nowrap transition-colors hover:text-slate-900 pb-0.5 ${
                activeView === 'track' ? 'text-amber-700 font-bold border-b-2 border-amber-600' : ''
              }`}
            >
              Suivi Colis
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-800">
              {isSellerSpace ? 'Espace Vendeur Indépendant (Alibaba Style)' : 'Supervision Générale BéninMarket'}
            </span>
            <span className="text-slate-400">·</span>
            <button
              onClick={() => onNavigate('home')}
              className="text-amber-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Voir la Marketplace Acheteurs</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Search Input (only when browsing) */}
        {isBuyerSpace && (
          <div className="flex-1 max-w-xs sm:max-w-sm hidden md:block relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher un article, catégorie, ville..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        )}

        {/* Zone 3: Distinct Espace Switcher & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Dual Space Portals: Espace Acheteur & Espace Vendeur */}
          {/* 1. ESPACE ACHETEUR PORTAL */}
          <div className="relative">
            <button
              onClick={handleBuyerSpaceClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isBuyerSpace
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title="Portail Acheteurs (Commander, Suivi de colis, Inscription & Connexion)"
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${isBuyerSpace ? 'text-amber-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Espace</span>
              <span>Acheteur</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showBuyerMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs space-y-1">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Espace Acheteurs
                </div>

                {currentUser?.role === 'customer' ? (
                  <>
                    <button
                      onClick={() => {
                        setShowBuyerMenu(false);
                        onNavigate('customer');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded-lg font-semibold text-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mon Compte Client ({currentUser.firstName || currentUser.name.split(' ')[0]})</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowBuyerMenu(false);
                        onNavigate('home');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Explorer tous les produits</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowBuyerMenu(false);
                        onOpenAuthModal?.('login');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded-lg font-bold text-slate-900 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>Connexion Acheteur</span>
                      </div>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">Déjà inscrit</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowBuyerMenu(false);
                        onOpenAuthModal?.('register_buyer');
                      }}
                      className="w-full text-left px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 rounded-lg font-bold flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                        <span>Inscription Acheteur</span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-semibold">Gratuit</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setShowBuyerMenu(false);
                    onOpenTrack();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  <span>Suivre ma commande en direct</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. ESPACE VENDEUR PORTAL */}
          <div className="relative">
            <button
              onClick={handleSellerSpaceClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isSellerSpace
                  ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-900 hover:bg-amber-500/20'
              }`}
              title="Portail Vendeurs (Gérer mes produits, commandes reçues, inscription boutique)"
            >
              <StoreIcon className={`w-3.5 h-3.5 ${isSellerSpace ? 'text-white' : 'text-amber-700'}`} />
              <span className="hidden sm:inline">Espace</span>
              <span>Vendeur</span>
              <ChevronDown className={`w-3 h-3 ${isSellerSpace ? 'text-white/80' : 'text-amber-700/80'}`} />
            </button>

            {showSellerMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs space-y-1">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Espace Vendeurs & Boutiques
                </div>

                {currentUser?.role === 'seller' ? (
                  <>
                    <button
                      onClick={() => {
                        setShowSellerMenu(false);
                        onNavigate('seller');
                      }}
                      className="w-full text-left px-3 py-2 bg-amber-50 hover:bg-amber-100 rounded-lg font-bold text-amber-900 flex items-center gap-2 cursor-pointer"
                    >
                      <StoreIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mon Tableau de bord Vendeur</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowSellerMenu(false);
                        onOpenAuthModal?.('login');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 rounded-lg font-bold text-slate-900 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <StoreIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>Connexion Vendeur</span>
                      </div>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">Ma Boutique</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSellerMenu(false);
                        onOpenAuthModal?.('register_seller');
                      }}
                      className="w-full text-left px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center justify-between cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <StoreIcon className="w-3.5 h-3.5" />
                        <span>Créer ma boutique</span>
                      </div>
                      <span className="text-[10px] text-amber-100 bg-white/20 px-1.5 py-0.5 rounded font-bold">0 frais</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* If Super Admin is logged in, show their private dashboard button */}
          {isPasteurKazotti && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAdminSpace
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Accès exclusif Super Admin & Base de Données (Pasteur Kazotti)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Super Admin &</span>
              <span>BDD</span>
            </button>
          )}

          {/* Active User Account Pill if logged in */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Mon Profil"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold text-slate-800 max-w-[80px] sm:max-w-[110px] truncate">
                  {isPasteurKazotti ? '👑 Pasteur K.' : currentUser.firstName || currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Connecté en tant que :</div>
                    <div className="font-bold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-slate-500 truncate text-[11px]">{currentUser.email}</div>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPasteurKazotti
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentUser.role === 'seller'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isPasteurKazotti ? '👑 Super Admin & Propriétaire' : currentUser.role === 'seller' ? 'Vendeur Marchand' : 'Client Acheteur'}
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

                  {/* Super admin private dashboard */}
                  {isPasteurKazotti && (
                    <div className="border-t border-slate-100 pt-1 mt-1 bg-emerald-50/50 p-2">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-200" />
                        <span>Base de Données Globale</span>
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
            className="relative flex items-center justify-center p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Voir le panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm tabular-nums">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search bar (Buyer mode) */}
      {isBuyerSpace && (
        <div className="md:hidden px-4 pb-2.5">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher un article, vendeur, ville..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      )}
    </header>
  );
};
