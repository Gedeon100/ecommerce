import React, { useState } from 'react';
import { User, Store, Product, Order } from '../../types';
import { storageService } from '../../services/storageService';
import { formatFCFA, formatDateFR, ORDER_STATUS_CONFIG } from '../../utils/formatters';
import {
  ShieldCheck,
  Store as StoreIcon,
  Package,
  Users,
  Settings,
  CheckCircle2,
  Printer,
  Database,
  Download,
  Upload,
  FileJson,
  RotateCcw,
  Star,
  MessageSquareQuote,
  Search,
  Home,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Lock,
  LogOut,
  Ban,
  Unlock,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onPrintOrderReceipt: (order: Order) => void;
  onOpenStore: (slug: string) => void;
  onNavigateHome?: () => void;
  onOpenLogin?: () => void;
}

interface UnifiedClientReview {
  id: string;
  source: 'platform_review' | 'product_testimonial';
  customerName: string;
  city?: string;
  rating: number;
  comment: string;
  productName: string;
  productImage?: string;
  storeName: string;
  dateLabel: string;
  isVerified: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onPrintOrderReceipt,
  onOpenStore,
  onNavigateHome,
  onOpenLogin,
}) => {
  const isOwnerAuthorized =
    currentUser?.role === 'admin' &&
    (currentUser?.email?.toLowerCase() === 'kazottimahutondji@gmail.com' ||
      currentUser?.email?.toLowerCase() === 'kazottimahutondj@gmail.com');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'stores' | 'orders' | 'reviews' | 'products' | 'settings' | 'database'
  >('overview');
  const [orderFilter, setOrderFilter] = useState<'validated' | 'delivered' | 'all'>('validated');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'all'>('all');
  const [dbSubTab, setDbSubTab] = useState<'orders' | 'stores' | 'products' | 'users'>('orders');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Seller & Store Moderation States (Block / Unblock / Delete)
  const [storeSearch, setStoreSearch] = useState('');
  const [storeStatusFilter, setStoreStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [moderationFeedback, setModerationFeedback] = useState<string | null>(null);
  const [blockTargetStore, setBlockTargetStore] = useState<Store | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('Non-respect de la charte qualité BéninMarket');
  const [deleteTargetStore, setDeleteTargetStore] = useState<Store | null>(null);

  const stores = storageService.getStores();
  const products = storageService.getProducts();
  const orders = storageService.getOrders();
  const platformReviews = storageService.getReviews();
  const settings = storageService.getSettings();
  const users = storageService.getUsers();

  // Settings form state
  const [commissionRate, setCommissionRate] = useState(settings.defaultCommissionRate);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Strict owner guard
  if (!isOwnerAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Espace Administrateur Réservé au Propriétaire
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cette rubrique est accessible uniquement sur connexion avec les identifiants du propriétaire du site.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Retour à l’Accueil
              </button>
            )}
            {onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                Se connecter (Propriétaire)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Validated orders = all active/confirmed/delivered orders (excluding cancelled or failed)
  const validatedOrders = orders.filter(
    (o) => o.status !== 'ANNULEE' && o.status !== 'LIVRAISON_ECHOUEE' && o.status !== 'RETOURNEE'
  );
  const deliveredOrders = orders.filter((o) => o.status === 'LIVREE_ENCAISSEE');
  const displayedOrders =
    orderFilter === 'validated'
      ? validatedOrders
      : orderFilter === 'delivered'
      ? deliveredOrders
      : orders;

  // Aggregate ALL customer reviews across the entire platform (live reviews + product testimonials)
  const allClientReviews: UnifiedClientReview[] = [
    ...platformReviews.map((r) => {
      const prod = products.find((p) => p.id === r.productId);
      const st = stores.find((s) => s.id === r.storeId || s.id === prod?.storeId);
      return {
        id: r.id,
        source: 'platform_review' as const,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        productName: prod?.name || 'Article BéninMarket',
        productImage: prod?.images?.[0],
        storeName: st?.name || 'Boutique BéninMarket',
        dateLabel: formatDateFR(r.createdAt),
        isVerified: r.isVerifiedPurchase,
      };
    }),
    ...products.flatMap((prod) => {
      const st = stores.find((s) => s.id === prod.storeId);
      return (prod.testimonials || []).map((t) => ({
        id: `${prod.id}-${t.id}`,
        source: 'product_testimonial' as const,
        customerName: t.author,
        city: t.city,
        rating: t.rating,
        comment: t.comment,
        productName: prod.name,
        productImage: prod.images?.[0],
        storeName: st?.name || 'Boutique BéninMarket',
        dateLabel: t.date,
        isVerified: t.verified !== false,
      }));
    }),
  ];

  const filteredReviews = allClientReviews.filter((rev) => {
    const matchesRating = reviewRatingFilter === 'all' || rev.rating === reviewRatingFilter;
    const q = reviewSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      rev.customerName.toLowerCase().includes(q) ||
      rev.comment.toLowerCase().includes(q) ||
      rev.productName.toLowerCase().includes(q) ||
      rev.storeName.toLowerCase().includes(q);
    return matchesRating && matchesQuery;
  });

  const averagePlatformRating =
    allClientReviews.length > 0
      ? (allClientReviews.reduce((acc, r) => acc + r.rating, 0) / allClientReviews.length).toFixed(1)
      : '5.0';

  const totalStores = stores.length;
  const blockedStoresCount = stores.filter((s) => s.isBlocked).length;
  const activeStoresCount = totalStores - blockedStoresCount;
  const verifiedStores = stores.filter((s) => s.isVerified && !s.isBlocked).length;
  const totalCashCollected = deliveredOrders.reduce(
    (sum, o) => sum + (o.cashCollectedAmount || o.grandTotal),
    0
  );
  const totalValidatedVolume = validatedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const filteredAdminStores = stores.filter((s) => {
    const sellerAcc = users.find((u) => u.id === s.sellerId || u.storeId === s.id);
    const matchesStatus =
      storeStatusFilter === 'all'
        ? true
        : storeStatusFilter === 'blocked'
        ? Boolean(s.isBlocked)
        : !s.isBlocked;
    const q = storeSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (sellerAcc && sellerAcc.name.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const showAdminFeedback = (msg: string) => {
    setModerationFeedback(msg);
    setTimeout(() => setModerationFeedback(null), 5000);
  };

  const handleToggleStoreVerification = (store: Store) => {
    storageService.updateStore({
      ...store,
      isVerified: !store.isVerified,
    });
    showAdminFeedback(
      !store.isVerified
        ? `La boutique « ${store.name} » est désormais certifiée Vendeur Vérifié.`
        : `Le badge vérifié de « ${store.name} » a été retiré.`
    );
  };

  const handleConfirmBlockStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTargetStore) return;
    storageService.toggleStoreBlock(blockTargetStore.id, true, blockReasonInput);
    showAdminFeedback(
      `⛔ La boutique « ${blockTargetStore.name} » a été bloquée. Ses produits sont retirés du catalogue public.`
    );
    setBlockTargetStore(null);
  };

  const handleUnblockStore = (store: Store) => {
    storageService.toggleStoreBlock(store.id, false);
    showAdminFeedback(`✅ La boutique « ${store.name} » a été débloquée et remise en ligne.`);
  };

  const handleConfirmDeleteSeller = () => {
    if (!deleteTargetStore) return;
    const res = storageService.deleteSellerAndStore(deleteTargetStore.id);
    showAdminFeedback(
      `🗑️ Le vendeur « ${res.deletedSellerName} », sa boutique « ${res.deletedStoreName} » et ses ${res.deletedProductsCount} produit(s) ont été définitivement supprimés.`
    );
    setDeleteTargetStore(null);
  };

  const handleToggleProductPublish = (product: Product) => {
    storageService.saveProduct({
      ...product,
      isPublished: !product.isPublished,
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings({
      ...settings,
      defaultCommissionRate: Number(commissionRate),
      supportPhone,
      supportEmail,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportDatabase = () => {
    const jsonStr = storageService.exportCompleteDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beninmarket_database_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = storageService.importCompleteDatabase(content);
      setImportStatus(res.message);
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const executeResetFactory = () => {
    storageService.resetToFactory();
    setConfirmResetOpen(false);
    setImportStatus('Base de données réinitialisée aux données initiales.');
    setTimeout(() => setImportStatus(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Owner Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white p-0.5 border border-amber-400/50 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
                alt="Logo BéninMarket"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                  Administration Propriétaire — BéninMarket
                </h1>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  {currentUser.email}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervision complète : tous les vendeurs, commandes validées et avis de tous les clients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
              >
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>Accueil du site</span>
              </button>
            )}
            <button
              onClick={() => {
                storageService.logout();
                onNavigateHome?.();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-5 overflow-x-auto text-xs font-semibold border-t border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vue d’ensemble
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stores'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tous les Vendeurs ({totalStores})</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Commandes Validées ({validatedOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Avis des Clients ({allClientReviews.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === 'products'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Produits ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paramètres
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-1.5 font-bold cursor-pointer ${
              activeTab === 'database'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Base de Données</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {moderationFeedback && (
          <div className="mb-5 p-3.5 bg-slate-900 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{moderationFeedback}</span>
            </div>
            <button
              onClick={() => setModerationFeedback(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveTab('stores')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition-colors cursor-pointer"
              >
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Tous les Vendeurs & Boutiques
                </span>
                <div className="text-2xl font-black text-slate-900 tabular-nums flex items-center gap-2">
                  <span>{totalStores}</span>
                  {blockedStoresCount > 0 && (
                    <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                      {blockedStoresCount} bloquée{blockedStoresCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {activeStoresCount} actives · Gérer / Bloquer / Supprimer →
                </span>
              </div>

              <div
                onClick={() => setActiveTab('orders')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition-colors cursor-pointer"
              >
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Commandes Validées
                </span>
                <div className="text-2xl font-black text-emerald-700 tabular-nums">
                  {validatedOrders.length}
                </div>
                <span className="text-[11px] text-slate-500">
                  Volume validé : {formatFCFA(totalValidatedVolume)}
                </span>
              </div>

              <div
                onClick={() => setActiveTab('reviews')}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition-colors cursor-pointer"
              >
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Avis de Tous les Clients
                </span>
                <div className="text-2xl font-black text-amber-600 tabular-nums flex items-center gap-1.5">
                  <span>{allClientReviews.length}</span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    ★ {averagePlatformRating}/5
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Avis vérifiés & témoignages → Consulter
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Espèces COD Encaissées
                </span>
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                  {formatFCFA(totalCashCollected)}
                </div>
                <span className="text-[11px] text-amber-700 font-semibold">
                  Commission ({settings.defaultCommissionRate}%) :{' '}
                  {formatFCFA(totalCashCollected * (settings.defaultCommissionRate / 100))}
                </span>
              </div>
            </div>

            {/* Quick Summary Grid: Latest Validated Orders & Latest Client Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dernières Commandes Validées</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    Tout voir ({validatedOrders.length})
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {validatedOrders.slice(0, 5).map((o) => {
                    const conf = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.NOUVELLE;
                    return (
                      <div key={o.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">
                            {o.id} · {o.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {o.city} · {o.subOrders.map((s) => s.storeName).join(', ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 tabular-nums">
                            {formatFCFA(o.grandTotal)}
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${conf.bg} ${conf.color}`}>
                            {conf.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquareQuote className="w-4 h-4 text-amber-600" />
                    <span>Derniers Avis Clients</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    Tout voir ({allClientReviews.length})
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {allClientReviews.slice(0, 4).map((rev) => (
                    <div key={rev.id} className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rev.customerName}</span>
                        <div className="flex text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 line-clamp-2">« {rev.comment} »</p>
                      <div className="text-[10px] text-slate-400">
                        Produit : <strong className="text-slate-600">{rev.productName}</strong> ({rev.storeName})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Quick Seller Management Preview on Overview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Contrôle Rapide des Vendeurs & Boutiques ({stores.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bloquez temporairement une boutique ou supprimez définitivement un vendeur de la plateforme
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('stores')}
                  className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Ouvrir la gestion complète →
                </button>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {stores.map((s) => {
                  const sellerAcc = users.find((u) => u.id === s.sellerId || u.storeId === s.id);
                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        s.isBlocked ? 'bg-rose-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={s.logo}
                          alt={s.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>{s.name}</span>
                            {s.isBlocked ? (
                              <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold">
                                ⛔ Bloquée
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Vendeur : <strong>{sellerAcc?.name || 'Vendeur'}</strong> · {s.city} · {s.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.isBlocked ? (
                          <button
                            onClick={() => handleUnblockStore(s)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Débloquer</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setBlockReasonInput('Non-respect de la charte qualité BéninMarket');
                              setBlockTargetStore(s);
                            }}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Bloquer boutique</span>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTargetStore(s)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer vendeur</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALL SELLERS & STORES */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Gestion de Tous les Vendeurs & Boutiques ({filteredAdminStores.length} sur {stores.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Certifiez, bloquez/débloquez une boutique ou supprimez définitivement un vendeur de la plateforme
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="relative">
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="Rechercher boutique, vendeur, ville..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg font-semibold">
                  <button
                    onClick={() => setStoreStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      storeStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                  >
                    Tous ({stores.length})
                  </button>
                  <button
                    onClick={() => setStoreStatusFilter('active')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      storeStatusFilter === 'active'
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    Actifs ({activeStoresCount})
                  </button>
                  <button
                    onClick={() => setStoreStatusFilter('blocked')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      storeStatusFilter === 'blocked'
                        ? 'bg-rose-600 text-white shadow-2xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    Bloqués ({blockedStoresCount})
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {filteredAdminStores.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  Aucun vendeur ou boutique ne correspond à votre recherche.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Boutique & Vendeur</th>
                        <th className="py-3 px-4">Ville & Rayon</th>
                        <th className="py-3 px-4">Contacts Vendeur</th>
                        <th className="py-3 px-4">Articles</th>
                        <th className="py-3 px-4">Statut Boutique</th>
                        <th className="py-3 px-4 text-right">Actions Propriétaire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdminStores.map((s) => {
                        const sellerAccount = users.find((u) => u.id === s.sellerId || u.storeId === s.id);
                        const storeProdCount = products.filter((p) => p.storeId === s.id).length;
                        return (
                          <tr
                            key={s.id}
                            className={`transition-colors ${
                              s.isBlocked ? 'bg-rose-50/60 hover:bg-rose-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={s.logo}
                                  alt=""
                                  className={`w-10 h-10 rounded-xl object-cover border ${
                                    s.isBlocked ? 'border-rose-300 grayscale' : 'border-slate-200'
                                  }`}
                                />
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{s.name}</span>
                                    <button
                                      onClick={() => onOpenStore(s.slug)}
                                      title="Inspecter la vitrine"
                                      className="text-slate-400 hover:text-amber-700 cursor-pointer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Vendeur : <strong>{sellerAccount?.name || 'Vendeur Agréé'}</strong>
                                  </div>
                                  {s.isBlocked && s.blockReason && (
                                    <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                                      Motif : {s.blockReason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-amber-600" />
                                <span>{s.city}</span>
                              </div>
                              <div className="text-[11px] text-slate-500">{s.category}</div>
                            </td>
                            <td className="py-3.5 px-4 space-y-0.5 text-slate-600">
                              <div className="flex items-center gap-1 font-medium text-slate-800">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{s.phone}</span>
                              </div>
                              {(s.email || sellerAccount?.email) && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{s.email || sellerAccount?.email}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800 tabular-nums">
                              {storeProdCount} produit{storeProdCount > 1 ? 's' : ''}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col items-start gap-1">
                                {s.isBlocked ? (
                                  <span className="text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                                    <Ban className="w-3 h-3" />
                                    <span>Boutique Bloquée</span>
                                  </span>
                                ) : s.isVerified ? (
                                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                    ✓ Active & Vérifiée
                                  </span>
                                ) : (
                                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                    Active (Non certifiée)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                {!s.isBlocked && (
                                  <button
                                    onClick={() => handleToggleStoreVerification(s)}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] cursor-pointer"
                                  >
                                    {s.isVerified ? 'Retirer badge' : 'Certifier'}
                                  </button>
                                )}

                                {s.isBlocked ? (
                                  <button
                                    onClick={() => handleUnblockStore(s)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>Débloquer boutique</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setBlockReasonInput('Non-respect de la charte qualité BéninMarket');
                                      setBlockTargetStore(s);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>Bloquer boutique</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => setDeleteTargetStore(s)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Supprimer vendeur</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VALIDATED ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Suivi des Commandes Validées ({validatedOrders.length} validées sur {orders.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Visualisez toutes les commandes validées par les clients, les boutiques concernées et les montants COD
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setOrderFilter('validated')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    orderFilter === 'validated'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Commandes Validées ({validatedOrders.length})
                </button>
                <button
                  onClick={() => setOrderFilter('delivered')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    orderFilter === 'delivered'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Livrées & Payées ({deliveredOrders.length})
                </button>
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    orderFilter === 'all'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Toutes ({orders.length})
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">N° Commande</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Client & Contact</th>
                      <th className="py-3 px-4">Vendeur(s) & Articles</th>
                      <th className="py-3 px-4">Ville</th>
                      <th className="py-3 px-4">Montant COD</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Bon / Reçu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedOrders.map((o) => {
                      const conf = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.NOUVELLE;
                      return (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{o.id}</td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatDateFR(o.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{o.customerName}</div>
                            <div className="text-[11px] text-slate-500">{o.customerPhone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-amber-800">
                              {o.subOrders.map((s) => s.storeName).join(', ')}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">{o.city}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                            {formatFCFA(o.grandTotal)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${conf.bg} ${conf.color}`}>
                              {conf.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onPrintOrderReceipt(o)}
                              className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Voir</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ALL CUSTOMER REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Avis de Tous les Clients ({filteredReviews.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Ensemble des retours clients, notes sur 5 et témoignages enregistrés sur les boutiques de la plateforme
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="relative">
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="Rechercher client, produit, vendeur..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                </div>

                <select
                  value={reviewRatingFilter}
                  onChange={(e) =>
                    setReviewRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="all">Toutes les notes (★ {averagePlatformRating})</option>
                  <option value={5}>5 étoiles uniquement</option>
                  <option value={4}>4 étoiles</option>
                  <option value={3}>3 étoiles et moins</option>
                </select>
              </div>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Aucun avis client ne correspond à votre filtre.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3 text-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{rev.customerName}</span>
                            {rev.city && (
                              <span className="text-[11px] font-normal text-slate-500">· {rev.city}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{rev.dateLabel}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, idx) => (
                              <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          {rev.source === 'platform_review' && (
                            <button
                              onClick={() => storageService.deleteReview(rev.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                              title="Supprimer cet avis"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        « {rev.comment} »
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {rev.productImage && (
                          <img
                            src={rev.productImage}
                            alt=""
                            className="w-7 h-7 rounded object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{rev.productName}</div>
                          <div className="text-[10px] text-amber-800 font-semibold truncate">
                            Vendeur : {rev.storeName}
                          </div>
                        </div>
                      </div>

                      {rev.isVerified && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold shrink-0">
                          ✓ Achat vérifié
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PRODUCTS MODERATION */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Catalogue Global des Produits ({products.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Produit</th>
                    <th className="py-2.5 px-4">Boutique</th>
                    <th className="py-2.5 px-4">Prix</th>
                    <th className="py-2.5 px-4">Stock</th>
                    <th className="py-2.5 px-4">Statut</th>
                    <th className="py-2.5 px-4 text-right">Modération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const st = stores.find((s) => s.id === p.storeId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="truncate max-w-xs">{p.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{st?.name}</td>
                        <td className="py-3 px-4 font-bold tabular-nums">
                          {formatFCFA(p.isPromoActive && p.promoPrice ? p.promoPrice : p.price)}
                        </td>
                        <td className="py-3 px-4 tabular-nums">{p.stock}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.isPublished ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.isPublished ? 'En ligne' : 'Masqué'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleProductPublish(p)}
                            className="text-xs font-semibold text-slate-700 hover:text-amber-700 cursor-pointer"
                          >
                            {p.isPublished ? 'Désactiver' : 'Activer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-xl">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-600" />
              <span>Paramètres Généraux de BéninMarket</span>
            </h2>

            {saveSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                Paramètres enregistrés avec succès.
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Taux de commission plateforme (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Téléphone support client (WhatsApp & Appel)
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail support officiel
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Sauvegarder les paramètres
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: DATABASE BACKUP & RAW TABLES */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">
                    Base de Données Propriétaire & Sauvegardes
                  </h2>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Exportez l’intégralité des vendeurs, commandes validées, produits et avis clients au format JSON ou restaurez une sauvegarde.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={handleExportDatabase}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter la BDD (JSON)</span>
                </button>

                <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Restaurer JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDatabase}
                    className="hidden"
                  />
                </label>

                {!confirmResetOpen ? (
                  <button
                    onClick={() => setConfirmResetOpen(true)}
                    className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-950 border border-rose-700 px-3 py-1.5 rounded-xl text-xs">
                    <span className="text-rose-200 font-semibold">Confirmer ?</span>
                    <button
                      onClick={executeResetFactory}
                      className="px-2 py-1 bg-rose-600 text-white rounded font-bold cursor-pointer"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setConfirmResetOpen(false)}
                      className="px-2 py-1 bg-slate-800 text-slate-300 rounded cursor-pointer"
                    >
                      Non
                    </button>
                  </div>
                )}
              </div>
            </div>

            {importStatus && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900">Tables de la Base de Données</h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setDbSubTab('orders')}
                    className={`px-3 py-1 rounded-md cursor-pointer ${
                      dbSubTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Commandes ({orders.length})
                  </button>
                  <button
                    onClick={() => setDbSubTab('stores')}
                    className={`px-3 py-1 rounded-md cursor-pointer ${
                      dbSubTab === 'stores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Boutiques ({stores.length})
                  </button>
                  <button
                    onClick={() => setDbSubTab('products')}
                    className={`px-3 py-1 rounded-md cursor-pointer ${
                      dbSubTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Produits ({products.length})
                  </button>
                  <button
                    onClick={() => setDbSubTab('users')}
                    className={`px-3 py-1 rounded-md cursor-pointer ${
                      dbSubTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Utilisateurs ({users.length})
                  </button>
                </div>
              </div>

              {dbSubTab === 'orders' && (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Code</th>
                        <th className="py-2.5 px-4">Client</th>
                        <th className="py-2.5 px-4">Ville</th>
                        <th className="py-2.5 px-4">Total</th>
                        <th className="py-2.5 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td className="py-2.5 px-4 font-bold">{o.id}</td>
                          <td className="py-2.5 px-4">{o.customerName}</td>
                          <td className="py-2.5 px-4">{o.city}</td>
                          <td className="py-2.5 px-4 font-bold">{formatFCFA(o.grandTotal)}</td>
                          <td className="py-2.5 px-4">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {dbSubTab === 'stores' && (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Boutique</th>
                        <th className="py-2.5 px-4">Ville</th>
                        <th className="py-2.5 px-4">WhatsApp</th>
                        <th className="py-2.5 px-4">Catégorie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stores.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2.5 px-4 font-bold">{s.name}</td>
                          <td className="py-2.5 px-4">{s.city}</td>
                          <td className="py-2.5 px-4">{s.whatsapp}</td>
                          <td className="py-2.5 px-4">{s.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {dbSubTab === 'products' && (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Produit</th>
                        <th className="py-2.5 px-4">Catégorie</th>
                        <th className="py-2.5 px-4">Prix</th>
                        <th className="py-2.5 px-4">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 px-4 font-semibold">{p.name}</td>
                          <td className="py-2.5 px-4">{p.category}</td>
                          <td className="py-2.5 px-4 font-bold">{formatFCFA(p.price)}</td>
                          <td className="py-2.5 px-4">{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {dbSubTab === 'users' && (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Nom</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4">Téléphone</th>
                        <th className="py-2.5 px-4">Rôle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="py-2.5 px-4 font-bold">{u.name}</td>
                          <td className="py-2.5 px-4">{u.email}</td>
                          <td className="py-2.5 px-4">{u.phone}</td>
                          <td className="py-2.5 px-4 uppercase font-bold">{u.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: BLOCK A STORE */}
      {blockTargetStore && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Bloquer la boutique</h3>
                  <p className="text-[11px] text-slate-400">{blockTargetStore.name}</p>
                </div>
              </div>
              <button
                onClick={() => setBlockTargetStore(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBlockStore} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-relaxed">
                En bloquant <strong>« {blockTargetStore.name} »</strong> :
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                  <li>La boutique et tous ses produits sont immédiatement masqués du site public.</li>
                  <li>Le vendeur ne peut plus se connecter à son espace vendeur.</li>
                  <li>Vous pourrez la <strong>débloquer à tout moment</strong> en 1 clic.</li>
                </ul>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Motif du blocage (visible en cas de tentative de connexion)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Non-respect de la charte qualité BéninMarket',
                    'Retards de livraison répétés',
                    'Produits non conformes aux photos',
                    'Vérification administrative en cours',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBlockReasonInput(preset)}
                      className={`px-2 py-1 rounded-md border text-[10px] font-semibold cursor-pointer ${
                        blockReasonInput === preset
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="Précisez la raison du blocage..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBlockTargetStore(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Confirmer le blocage</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PERMANENTLY DELETE A SELLER & STORE */}
      {deleteTargetStore && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-rose-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Supprimer définitivement ce vendeur</h3>
                  <p className="text-[11px] text-rose-200">Action irréversible d’administration</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTargetStore(null)}
                className="p-1 text-rose-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={deleteTargetStore.logo}
                  alt={deleteTargetStore.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{deleteTargetStore.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {deleteTargetStore.city} · {deleteTargetStore.phone}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1 leading-relaxed">
                <div className="font-bold">Cette suppression retirera immédiatement :</div>
                <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                  <li>Le compte vendeur associé et ses accès à la plateforme</li>
                  <li>La boutique publique <strong>« {deleteTargetStore.name} »</strong></li>
                  <li>
                    Les{' '}
                    <strong>
                      {products.filter((p) => p.storeId === deleteTargetStore.id).length} produit(s)
                    </strong>{' '}
                    publiés par cette boutique
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetStore(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSeller}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer définitivement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
