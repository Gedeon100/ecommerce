import React, { useState } from 'react';
import { User, Store, Product, Order, OrderStatus, ProductVariant, ProductTestimonial } from '../../types';
import { storageService } from '../../services/storageService';
import { formatFCFA, formatDateFR, calculateDiscountPercent, ORDER_STATUS_CONFIG } from '../../utils/formatters';
import {
  Store as StoreIcon,
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Video,
  DollarSign,
  Tag,
  Truck,
  Phone,
  MessageCircle,
  Settings,
  X,
  Printer,
  ChevronRight,
  ExternalLink,
  Star,
  FileText,
  MessageSquare,
} from 'lucide-react';

interface SellerDashboardProps {
  currentUser: User;
  onOpenStorePublic: (storeSlug: string) => void;
  onPrintOrderReceipt: (order: Order) => void;
  onSwitchToBuyer?: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  onOpenStorePublic,
  onPrintOrderReceipt,
  onSwitchToBuyer,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'profile'>('overview');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load stores and products
  const stores = storageService.getStores();
  const sellerStore = stores.find((s) => s.id === currentUser.storeId || s.sellerId === currentUser.id) || stores[0];
  const allProducts = storageService.getProductsByStore(sellerStore.id);
  const allOrders = storageService.getOrdersByStore(sellerStore.id);

  // Stats calculation
  const totalProducts = allProducts.length;
  const storeSubOrders = allOrders.flatMap((o) =>
    o.subOrders.filter((sub) => sub.storeId === sellerStore.id)
  );

  const totalOrdersCount = storeSubOrders.length;
  const pendingCount = storeSubOrders.filter((s) => ['NOUVELLE', 'CONFIRMEE', 'EN_PREPARATION'].includes(s.status)).length;
  const inDeliveryCount = storeSubOrders.filter((s) => s.status === 'EN_COURS_LIVRAISON').length;
  const deliveredCount = storeSubOrders.filter((s) => s.status === 'LIVREE_ENCAISSEE').length;
  const cancelledCount = storeSubOrders.filter((s) => ['ANNULEE', 'LIVRAISON_ECHOUEE', 'RETOURNEE'].includes(s.status)).length;

  // Real cash collected (only on delivered orders)
  const realCashCollected = storeSubOrders
    .filter((s) => s.status === 'LIVREE_ENCAISSEE')
    .reduce((sum, s) => sum + (s.cashCollected !== undefined ? s.cashCollected : s.total), 0);

  // Total order book (including pending, to show potential pipeline)
  const totalOrderBook = storeSubOrders.reduce((sum, s) => sum + s.total, 0);

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Mode & Vêtements');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(10000);
  const [prodPromoPrice, setProdPromoPrice] = useState<number | undefined>(undefined);
  const [prodIsPromoActive, setProdIsPromoActive] = useState(false);
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodImages, setProdImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  ]);
  const [prodNewImageUrl, setProdNewImageUrl] = useState('');
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prodWeight, setProdWeight] = useState<number>(0.5);
  const [prodDimensions, setProdDimensions] = useState('30 x 20 x 5 cm');
  const [prodDetailedDesc, setProdDetailedDesc] = useState('');
  const [prodTestimonials, setProdTestimonials] = useState<ProductTestimonial[]>([]);
  const [productModalTab, setProductModalTab] = useState<'general' | 'description' | 'testimonials'>('general');
  const [newTestimonialAuthor, setNewTestimonialAuthor] = useState('');
  const [newTestimonialCity, setNewTestimonialCity] = useState('Cotonou');
  const [newTestimonialRating, setNewTestimonialRating] = useState(5);
  const [newTestimonialComment, setNewTestimonialComment] = useState('');
  const [formError, setFormError] = useState('');

  // Status update state for orders
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Store Profile State (WhatsApp & Contact details)
  const [profileStoreName, setProfileStoreName] = useState(sellerStore.name);
  const [profileWhatsapp, setProfileWhatsapp] = useState(sellerStore.whatsapp);
  const [profilePhone, setProfilePhone] = useState(sellerStore.phone);
  const [profileAddress, setProfileAddress] = useState(sellerStore.address);
  const [profileCity, setProfileCity] = useState(sellerStore.city);
  const [profileDesc, setProfileDesc] = useState(sellerStore.description);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Store = {
      ...sellerStore,
      name: profileStoreName.trim(),
      whatsapp: profileWhatsapp.trim(),
      phone: profilePhone.trim(),
      address: profileAddress.trim(),
      city: profileCity,
      description: profileDesc.trim(),
    };
    storageService.updateStore(updated);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleAddTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonialAuthor.trim() || !newTestimonialComment.trim()) return;
    const test: ProductTestimonial = {
      id: `testi-${Date.now()}`,
      author: newTestimonialAuthor.trim(),
      city: newTestimonialCity,
      rating: newTestimonialRating,
      comment: newTestimonialComment.trim(),
      date: new Date().toISOString(),
      verified: true,
    };
    setProdTestimonials([...prodTestimonials, test]);
    setNewTestimonialAuthor('');
    setNewTestimonialComment('');
  };

  const handleRemoveTestimonial = (id: string) => {
    setProdTestimonials(prodTestimonials.filter((t) => t.id !== id));
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Mode & Vêtements');
    setProdShortDesc('');
    setProdDesc('');
    setProdDetailedDesc('');
    setProdTestimonials([]);
    setProductModalTab('general');
    setProdPrice(10000);
    setProdPromoPrice(undefined);
    setProdIsPromoActive(false);
    setProdStock(10);
    setProdImages(['https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80']);
    setProdVideoUrl('');
    setProdWeight(0.5);
    setProdDimensions('');
    setFormError('');
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdShortDesc(p.shortDescription);
    setProdDesc(p.description);
    setProdDetailedDesc(p.detailedDescription || p.description || '');
    setProdTestimonials(p.testimonials || []);
    setProductModalTab('general');
    setProdPrice(p.price);
    setProdPromoPrice(p.promoPrice);
    setProdIsPromoActive(p.isPromoActive);
    setProdStock(p.stock);
    setProdImages(p.images && p.images.length > 0 ? p.images : ['']);
    setProdVideoUrl(p.videoUrl || '');
    setProdWeight(p.weightKg || 0.5);
    setProdDimensions(p.dimensions || '');
    setFormError('');
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!prodName.trim()) {
      setFormError('Le nom du produit est obligatoire.');
      return;
    }
    if (prodPrice <= 0) {
      setFormError('Le prix normal doit être supérieur à 0 FCFA.');
      return;
    }
    if (prodIsPromoActive && prodPromoPrice && prodPromoPrice >= prodPrice) {
      setFormError('Le prix promotionnel doit être strictement inférieur au prix normal.');
      return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      storeId: sellerStore.id,
      name: prodName.trim(),
      slug: prodName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      shortDescription: prodShortDesc.trim() || prodName.trim(),
      description: prodDesc.trim() || prodName.trim(),
      detailedDescription: prodDetailedDesc.trim() || undefined,
      testimonials: prodTestimonials,
      category: prodCategory,
      price: Number(prodPrice),
      promoPrice: prodIsPromoActive && prodPromoPrice ? Number(prodPromoPrice) : undefined,
      isPromoActive: prodIsPromoActive,
      stock: Number(prodStock),
      images: prodImages.filter((img) => img.trim().length > 0),
      videoUrl: prodVideoUrl.trim() || undefined,
      weightKg: Number(prodWeight),
      dimensions: prodDimensions,
      isPublished: true,
      salesCount: editingProduct ? editingProduct.salesCount : 0,
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewCount: prodTestimonials.length > 0 ? prodTestimonials.length : (editingProduct ? editingProduct.reviewCount : 0),
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    storageService.saveProduct(newProduct);
    setProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Voulez-vous vraiment retirer ce produit de votre boutique ?')) {
      storageService.deleteProduct(id);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, subId: string, newStatus: OrderStatus) => {
    let collected: number | undefined = undefined;
    if (newStatus === 'LIVREE_ENCAISSEE') {
      const order = allOrders.find((o) => o.id === orderId);
      const sub = order?.subOrders.find((s) => s.id === subId);
      const amount = prompt(
        `Montant en espèces réellement encaissé par le livreur (en FCFA) :`,
        sub ? sub.total.toString() : ''
      );
      if (amount === null) return;
      collected = Number(amount) || (sub ? sub.total : 0);
    }

    storageService.updateOrderStatus(orderId, newStatus, subId, collected);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Banner / Store Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={sellerStore.logo}
              alt={sellerStore.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-700 bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{sellerStore.name}</h1>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
                  Espace Professionnel
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vendeur à {sellerStore.city} · Paiement à la livraison
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onSwitchToBuyer && (
              <button
                onClick={onSwitchToBuyer}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Consulter les produits des autres vendeurs sur la marketplace"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Mode Acheteur</span>
              </button>
            )}
            <button
              onClick={() => onOpenStorePublic(sellerStore.slug)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Voir ma boutique publique</span>
            </button>
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un produit</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 text-xs font-semibold border-t border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tableau de bord commercial
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'products'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Gestion des Produits ({totalProducts})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Commandes clients ({totalOrdersCount})</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Profil & Coordonnées WhatsApp
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Real Cash Collected */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                  <span>Revenu réellement encaissé</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700 tabular-nums">
                  {formatFCFA(realCashCollected)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sur les {deliveredCount} commandes livrées en espèces
                </p>
              </div>

              {/* Card 2: Potential Order Book */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                  <span>Volume total commandé</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {formatFCFA(totalOrderBook)}
                </div>
                <p className="text-[11px] text-amber-800 mt-1 font-medium">
                  {pendingCount + inDeliveryCount} colis en cours d'acheminement
                </p>
              </div>

              {/* Card 3: Active Orders */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                  <span>Commandes à traiter</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {pendingCount}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nouvelles et en préparation
                </p>
              </div>

              {/* Card 4: Delivered vs Cancelled */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                  <span>Taux de succès livraison</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {totalOrdersCount > 0
                    ? `${Math.round((deliveredCount / totalOrdersCount) * 100)}%`
                    : '100%'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {deliveredCount} livrées · {cancelledCount} retours/annulées
                </p>
              </div>
            </div>

            {/* Quick action banners */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  Paiement à la livraison : Rappel de fonctionnement
                </span>
                <p className="text-xs text-slate-700 mt-0.5">
                  Ne considérez jamais une commande comme encaissée tant que votre livreur n'a pas confirmé la remise du colis et l'encaissement des fonds en espèces.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 whitespace-nowrap cursor-pointer shrink-0"
              >
                Traiter les commandes ({pendingCount})
              </button>
            </div>

            {/* Recent Orders Table preview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Dernières commandes reçues pour {sellerStore.name}
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-amber-700 font-semibold hover:underline"
                >
                  Voir tout ({totalOrdersCount})
                </button>
              </div>

              {storeSubOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Aucune commande reçue pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Commande</th>
                        <th className="py-2.5 px-4">Client</th>
                        <th className="py-2.5 px-4">Articles</th>
                        <th className="py-2.5 px-4">Montant</th>
                        <th className="py-2.5 px-4">Statut COD</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {storeSubOrders.slice(0, 5).map((sub) => {
                        const parent = allOrders.find((o) => o.id === sub.orderId);
                        const conf = ORDER_STATUS_CONFIG[sub.status] || ORDER_STATUS_CONFIG.NOUVELLE;
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {sub.orderId}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold">{parent?.customerName}</div>
                              <div className="text-slate-400 text-[11px]">{parent?.city}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {sub.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                            </td>
                            <td className="py-3 px-4 font-bold tabular-nums">
                              {formatFCFA(sub.total)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${conf.bg} ${conf.color}`}>
                                {conf.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {parent && (
                                <button
                                  onClick={() => onPrintOrderReceipt(parent)}
                                  className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Reçu</span>
                                </button>
                              )}
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

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Catalogue de produits ({allProducts.length})
              </h2>
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Produit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProducts.map((p) => {
                const discount = calculateDiscountPercent(p.price, p.promoPrice);
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-16/9 rounded-lg overflow-hidden bg-slate-100 mb-3">
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80'}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            -{discount}%
                          </span>
                        )}
                        {p.videoUrl && (
                          <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Video className="w-3 h-3 text-amber-400" />
                            <span>Démo</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-bold uppercase text-amber-800 mb-1">
                        {p.category}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">{p.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.shortDescription}</p>

                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-base font-extrabold text-slate-900 tabular-nums">
                          {formatFCFA(p.isPromoActive && p.promoPrice ? p.promoPrice : p.price)}
                        </span>
                        {discount > 0 && (
                          <span className="text-xs text-slate-400 line-through tabular-nums">
                            {formatFCFA(p.price)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Stock : <strong>{p.stock}</strong></span>
                        <span>·</span>
                        <span>{p.salesCount} vendus</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="text-xs font-semibold text-slate-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Clients ayant commandé vos articles ({storeSubOrders.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Retrouvez ici tous les clients ayant validé une commande pour vos articles, leurs coordonnées précises pour la livraison au Bénin et contactez-les directement par téléphone ou WhatsApp.
              </p>
            </div>

            <div className="space-y-4">
              {storeSubOrders.map((sub) => {
                const parent = allOrders.find((o) => o.id === sub.orderId);
                const conf = ORDER_STATUS_CONFIG[sub.status] || ORDER_STATUS_CONFIG.NOUVELLE;

                return (
                  <div key={sub.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            Commande {sub.orderId}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${conf.bg} ${conf.color}`}>
                            {conf.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Date : {parent ? formatDateFR(parent.createdAt) : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Total à encaisser :</span>
                          <span className="text-base font-bold text-slate-900 tabular-nums">
                            {formatFCFA(sub.total)}
                          </span>
                        </div>
                        {parent && (
                          <button
                            onClick={() => onPrintOrderReceipt(parent)}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Imprimer le bon de livraison"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-amber-800">
                            Client ayant commandé
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm mb-1">{parent?.customerName}</div>
                        <div className="text-slate-600 flex items-center gap-1.5 mb-2 font-medium">
                          <Phone className="w-3.5 h-3.5 text-amber-600" />
                          <span>{parent?.customerPhone}</span>
                          {parent?.customerEmail && (
                            <span className="text-slate-400 text-[11px] truncate">({parent.customerEmail})</span>
                          )}
                        </div>

                        {/* Direct Seller-to-Customer contact actions */}
                        <div className="flex items-center gap-2 pt-1">
                          {parent?.customerPhone && (
                            <a
                              href={`https://wa.me/${parent.customerPhone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(parent.customerName || '')},%20je%20suis%20le%20vendeur%20${encodeURIComponent(sellerStore.name)}%20sur%20BéninMarket%20concernant%20votre%20commande%20${encodeURIComponent(sub.orderId)}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp client</span>
                            </a>
                          )}
                          {parent?.customerPhone && (
                            <a
                              href={`tel:${parent.customerPhone}`}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>Appeler</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-500 block mb-1">
                          Adresse & Repères de livraison
                        </span>
                        <div className="font-bold text-slate-900">{parent?.neighborhood}, {parent?.city}</div>
                        <div className="text-slate-700 mt-0.5">{parent?.deliveryAddress}</div>
                        {parent?.deliveryInstructions && (
                          <div className="mt-1.5 p-2 bg-amber-50/70 border border-amber-200/60 rounded text-slate-700 italic text-[11px]">
                            Repères : "{parent.deliveryInstructions}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-slate-800 block">Articles :</span>
                      {sub.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded">
                          <div className="flex items-center gap-2">
                            <img src={i.productImage} alt="" className="w-8 h-8 rounded object-cover" />
                            <div>
                              <span className="font-medium text-slate-900">{i.productName}</span>
                              {i.selectedVariants && (
                                <span className="text-slate-500 text-[11px] block">
                                  {Object.entries(i.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold tabular-nums">
                            {formatFCFA(i.unitPrice)} × {i.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Status Management Bar */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-700">Changer le statut :</span>
                        <select
                          value={sub.status}
                          onChange={(e) => handleUpdateOrderStatus(sub.orderId, sub.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="NOUVELLE">Nouvelle commande</option>
                          <option value="CONFIRMEE">Confirmée (client appelé)</option>
                          <option value="EN_PREPARATION">En préparation</option>
                          <option value="PRETE_EXPEDITION">Prête à expédier</option>
                          <option value="EN_COURS_LIVRAISON">En cours de livraison (livreur en route)</option>
                          <option value="LIVREE_ENCAISSEE">✓ Livrée & Encaissée (Paiement reçu)</option>
                          <option value="ANNULEE">Annulée</option>
                          <option value="LIVRAISON_ECHOUEE">Livraison échouée (client absent)</option>
                        </select>
                      </div>

                      {sub.status === 'LIVREE_ENCAISSEE' && (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paiement en espèces encaissé : {formatFCFA(sub.cashCollected || sub.total)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: STORE PROFILE & WHATSAPP SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Profil de la boutique & Coordonnées WhatsApp
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ces informations sont affichées sur vos fiches produits, votre boutique publique et directement sur le reçu de commande du client.
              </p>
            </div>

            {profileSaved && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Informations de la boutique et coordonnées WhatsApp mises à jour avec succès !</span>
              </div>
            )}

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Importance de votre numéro WhatsApp direct</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Sur BéninMarket, le client paie <strong>uniquement à la livraison</strong>. Dès la commande validée, le client reçoit un lien direct vers votre WhatsApp avec son numéro de commande. Ce lien lui permet de vous contacter si la livraison tarde ou pour toute question logistique.
              </p>
            </div>

            <form onSubmit={handleSaveStoreProfile} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Nom commercial de la boutique *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileStoreName}
                    onChange={(e) => setProfileStoreName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Ville principale d'implantation *
                  </label>
                  <select
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  >
                    <option value="Cotonou">Cotonou</option>
                    <option value="Abomey-Calavi">Abomey-Calavi</option>
                    <option value="Porto-Novo">Porto-Novo</option>
                    <option value="Parakou">Parakou</option>
                    <option value="Ouidah">Ouidah</option>
                    <option value="Bohicon">Bohicon</option>
                    <option value="Natitingou">Natitingou</option>
                  </select>
                </div>
              </div>

              {/* Direct WhatsApp Configuration */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Numéro WhatsApp direct de contact client *</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      required
                      placeholder="+229 97 00 11 22"
                      value={profileWhatsapp}
                      onChange={(e) => setProfileWhatsapp(e.target.value)}
                      className="flex-1 p-2.5 bg-white border border-emerald-300 rounded-lg font-bold text-slate-900 focus:outline-emerald-600"
                    />
                    {profileWhatsapp && (
                      <a
                        href={`https://wa.me/${profileWhatsapp.replace(/[^0-9]/g, '')}?text=Bonjour%20depuis%20BéninMarket`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Tester le lien</span>
                      </a>
                    )}
                  </div>
                  <span className="text-[11px] text-emerald-800 block mt-1">
                    Format international recommandé avec indicatif pays (ex: <strong>+229</strong> pour le Bénin). Ce numéro recevra les messages WhatsApp des clients.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Numéro de téléphone pour appels vocaux *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+229 97 00 11 22"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Adresse physique, atelier ou repères de retrait
                </label>
                <input
                  type="text"
                  placeholder="Ex: Haie Vive, Rue 340, Carré 120"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Description et engagement de votre boutique
                </label>
                <textarea
                  rows={4}
                  value={profileDesc}
                  onChange={(e) => setProfileDesc(e.target.value)}
                  placeholder="Présentez vos créations, votre politique d'échange, vos délais de livraison..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Modifications appliquées immédiatement à vos futures commandes.
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Enregistrer les coordonnées
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Modifier le produit' : 'Publier un nouveau produit physique'}
              </h2>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100 text-xs font-semibold p-1">
              <button
                type="button"
                onClick={() => setProductModalTab('general')}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  productModalTab === 'general'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>1. Infos & Prix</span>
              </button>

              <button
                type="button"
                onClick={() => setProductModalTab('description')}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  productModalTab === 'description'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Page Description</span>
              </button>

              <button
                type="button"
                onClick={() => setProductModalTab('testimonials')}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  productModalTab === 'testimonials'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-600" />
                <span>3. Témoignages ({prodTestimonials.length})</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="overflow-y-auto p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TAB 1: GENERAL & PRICING */}
              {productModalTab === 'general' && (
                <div className="space-y-4">
                  {/* Name & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nom du produit *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Blazer en Wax Royal..."
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Catégorie *</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Mode & Vêtements">Mode & Vêtements</option>
                        <option value="Chaussures & Maroquinerie">Chaussures & Maroquinerie</option>
                        <option value="Téléphones & Électronique">Téléphones & Électronique</option>
                        <option value="Maison & Décoration">Maison & Décoration</option>
                        <option value="Beauté, Karité & Cosmétiques">Beauté, Karité & Cosmétiques</option>
                        <option value="Alimentation & Produits Locaux">Alimentation & Produits Locaux</option>
                        <option value="Équipements & Accessoires">Équipements & Accessoires</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Prix normal (FCFA) *</label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={prodPrice}
                        onChange={(e) => setProdPrice(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Prix Promo (FCFA)</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodIsPromoActive}
                            onChange={(e) => setProdIsPromoActive(e.target.checked)}
                            className="accent-amber-600"
                          />
                          <span className="text-[10px] text-amber-800 font-bold">Activer</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        disabled={!prodIsPromoActive}
                        placeholder="Ex: 8500"
                        value={prodPromoPrice || ''}
                        onChange={(e) => setProdPromoPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Quantité en stock *</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={prodStock}
                        onChange={(e) => setProdStock(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Live Discount calculation notice */}
                  {prodIsPromoActive && prodPromoPrice && prodPromoPrice < prodPrice && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded text-[11px] font-semibold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        Réduction automatique affichée aux clients : -{calculateDiscountPercent(prodPrice, prodPromoPrice)}%
                      </span>
                    </div>
                  )}

                  {/* Photo & Video Presentation */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block">Médias du produit (Photos & Vidéo)</span>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">Lien de la photo principale (URL)</label>
                      <input
                        type="url"
                        value={prodImages[0] || ''}
                        onChange={(e) => setProdImages([e.target.value])}
                        placeholder="https://..."
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-600 mb-1">
                        Lien d'une vidéo de présentation (MP4 ou lien direct)
                      </label>
                      <input
                        type="url"
                        value={prodVideoUrl}
                        onChange={(e) => setProdVideoUrl(e.target.value)}
                        placeholder="https://.../video.mp4"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Permet aux clients de voir le produit en action avant de commander.
                      </span>
                    </div>
                  </div>

                  {/* Delivery specifications */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Poids estimé (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={prodWeight}
                        onChange={(e) => setProdWeight(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dimensions colis</label>
                      <input
                        type="text"
                        value={prodDimensions}
                        onChange={(e) => setProdDimensions(e.target.value)}
                        placeholder="Ex: 30 x 20 x 10 cm"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RICH PRODUCT DESCRIPTION PAGE */}
              {productModalTab === 'description' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
                    <strong className="block font-bold mb-0.5 text-xs">Page de présentation détaillée du produit</strong>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Créez une véritable fiche descriptive : expliquez l'origine, les matériaux, les avantages pour l'acheteur, et les consignes d'utilisation ou d'entretien.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Brève phrase d'accroche (affichée sous le titre)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Authentique création béninoise tissée à la main, durable et élégante."
                      value={prodShortDesc}
                      onChange={(e) => setProdShortDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Description complète & Caractéristiques détaillées
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Décrivez en détail votre produit : matière, finitions, taille, utilisation, pourquoi le client doit l'acheter..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Page de description avancée & Fiche technique (optionnel)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Section technique ou histoire du produit : conseils d'entretien, guide des tailles, garantie fabricant..."
                      value={prodDetailedDesc}
                      onChange={(e) => setProdDetailedDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: TESTIMONIALS & REVIEWS MANAGEMENT */}
              {productModalTab === 'testimonials' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                    <strong className="block font-bold mb-0.5 text-xs">Gestion des Témoignages & Avis Clients</strong>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Ajoutez des retours d'expérience et témoignages de clients satisfaits. Ces avis augmentent fortement le taux de commande en paiement à la livraison.
                    </p>
                  </div>

                  {/* Form to add a testimonial */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="font-bold text-slate-900 block text-xs">Ajouter un nouveau témoignage client</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nom du client *</label>
                        <input
                          type="text"
                          placeholder="Ex: Roland AKOBI"
                          value={newTestimonialAuthor}
                          onChange={(e) => setNewTestimonialAuthor(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ville au Bénin</label>
                        <select
                          value={newTestimonialCity}
                          onChange={(e) => setNewTestimonialCity(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Cotonou">Cotonou</option>
                          <option value="Abomey-Calavi">Abomey-Calavi</option>
                          <option value="Porto-Novo">Porto-Novo</option>
                          <option value="Parakou">Parakou</option>
                          <option value="Ouidah">Ouidah</option>
                          <option value="Bohicon">Bohicon</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Note attribuée</label>
                        <select
                          value={newTestimonialRating}
                          onChange={(e) => setNewTestimonialRating(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-600"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ 5/5</option>
                          <option value={4}>⭐⭐⭐⭐ 4/5</option>
                          <option value={3}>⭐⭐⭐ 3/5</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Témoignage du client *</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Reçu en 24h à Cotonou, excellente qualité conforme aux photos. J'ai réglé le coursier à la réception sans problème !"
                        value={newTestimonialComment}
                        onChange={(e) => setNewTestimonialComment(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTestimonial}
                      disabled={!newTestimonialAuthor.trim() || !newTestimonialComment.trim()}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter ce témoignage</span>
                    </button>
                  </div>

                  {/* List of current testimonials */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">
                      Témoignages configurés sur ce produit ({prodTestimonials.length}) :
                    </span>
                    {prodTestimonials.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">
                        Aucun témoignage ajouté. Vous pouvez en ajouter ci-dessus.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {prodTestimonials.map((t) => (
                          <div key={t.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{t.author}</span>
                                <span className="text-[10px] text-slate-500 font-medium">({t.city})</span>
                                <div className="flex text-amber-500">
                                  {Array.from({ length: t.rating }).map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-current" />
                                  ))}
                                </div>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                  ✓ Client vérifié
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">
                                « {t.comment} »
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTestimonial(t.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer shrink-0"
                              title="Supprimer ce témoignage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex gap-2">
                  {productModalTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => setProductModalTab(productModalTab === 'testimonials' ? 'description' : 'general')}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer"
                    >
                      Précédent
                    </button>
                  )}
                  {productModalTab !== 'testimonials' && (
                    <button
                      type="button"
                      onClick={() => setProductModalTab(productModalTab === 'general' ? 'description' : 'testimonials')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-semibold cursor-pointer"
                    >
                      Suivant
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    {editingProduct ? 'Enregistrer les modifications' : 'Publier le produit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
