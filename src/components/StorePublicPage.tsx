import React, { useState } from 'react';
import { Store, Product } from '../types';
import { ProductCard } from './ProductCard';
import { formatFCFA } from '../utils/formatters';
import { mediaStorage } from '../services/mediaStorage';
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  CheckCircle2,
  Star,
  Truck,
  Search,
  Filter,
  ArrowUpDown,
  ShieldCheck,
  ChevronLeft,
  Ban,
} from 'lucide-react';

interface StorePublicPageProps {
  store: Store;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBackToMarketplace: () => void;
}

export const StorePublicPage: React.FC<StorePublicPageProps> = ({
  store,
  products,
  onSelectProduct,
  onQuickBuy,
  onAddToCart,
  onBackToMarketplace,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular'>('featured');
  const [visibleLimit, setVisibleLimit] = useState(12);

  // Categories present in this store
  const storeCategories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter & sort products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.isPromoActive && a.promoPrice ? a.promoPrice : a.price;
    const priceB = b.isPromoActive && b.promoPrice ? b.promoPrice : b.price;

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'popular') return (b.salesCount || 0) - (a.salesCount || 0);
    return 0;
  });

  const displayedProducts = sortedProducts.slice(0, visibleLimit);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Return button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <button
          onClick={onBackToMarketplace}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour à l'accueil BéninMarket</span>
        </button>
      </div>

      {store.isBlocked && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
          <div className="bg-rose-950 text-white border border-rose-700 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Boutique bloquée par l’administrateur BéninMarket
                </h2>
                <p className="text-xs text-rose-200 mt-1">
                  Cette boutique et ses produits sont temporairement suspendus du catalogue public.
                  {store.blockReason ? ` Motif : ${store.blockReason}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onBackToMarketplace}
              className="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer shrink-0"
            >
              Retour aux boutiques actives
            </button>
          </div>
        </div>
      )}

      {/* Store Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-slate-800 shadow-sm border border-slate-200">
          <img
            src={mediaStorage.resolveUrl(store.banner)}
            alt={store.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
        </div>

        {/* Store Info Card (Header overlay) */}
        <div className="relative -mt-16 sm:-mt-20 mx-4 sm:mx-8 bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <img
              src={mediaStorage.resolveUrl(store.logo)}
              alt={store.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{store.name}</h1>
                {store.isVerified && (
                  <span className="flex items-center text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Vendeur Vérifié
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 max-w-xl mb-3 line-clamp-2">
                {store.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  {store.city} ({store.address})
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {store.rating} ({store.reviewCount} avis)
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600 font-medium">
                  {products.length} produits disponibles
                </span>
              </div>
            </div>
          </div>

          {/* Direct Vendor Contacts (African WhatsApp & Call) */}
          <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
            <a
              href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Boutique</span>
            </a>
            <a
              href={`tel:${store.phone}`}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-slate-500" />
              <span>Appeler le vendeur</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Delivery policies & Store Info */}
        <div className="space-y-6">
          {/* COD Guarantee */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Garantie Vendeur COD</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Toutes les commandes passées dans cette boutique sont payables en espèces lors de la livraison à domicile au Bénin.
            </p>
          </div>

          {/* Delivery Zones & Fees for this store */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
              <Truck className="w-4 h-4 text-amber-700" />
              <span>Tarifs de livraison</span>
            </div>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              {store.deliveryZones?.map((z) => (
                <div key={z.id} className="pt-2 first:pt-0 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{z.city}</span>
                    <span className="block text-[11px] text-slate-400">Délai : {z.estimatedHours}</span>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatFCFA(z.fee)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Store Products Catalog */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Rechercher dans cette boutique..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {storeCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Tout' : cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 w-full sm:w-auto justify-end">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="featured">En vedette</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="popular">Plus populaires</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {sortedProducts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-sm">
                Aucun produit ne correspond à vos critères de recherche dans cette boutique.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>
                  Affichage de <strong>{displayedProducts.length}</strong> sur <strong>{sortedProducts.length}</strong> articles disponibles
                </span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ♾️ Catalogue Illimité
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    store={store}
                    onSelect={onSelectProduct}
                    onQuickBuy={onQuickBuy}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>

              {visibleLimit < sortedProducts.length && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setVisibleLimit((prev) => prev + 12)}
                    className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Charger 12 articles supplémentaires</span>
                    <span className="text-slate-400 font-normal">
                      ({sortedProducts.length - visibleLimit} restants)
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
