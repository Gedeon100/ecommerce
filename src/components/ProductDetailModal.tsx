import React, { useState } from 'react';
import { Product, Store, ProductReview } from '../types';
import { formatFCFA, calculateDiscountPercent } from '../utils/formatters';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Video,
  Play,
  Share2,
  Store as StoreIcon,
  MessageCircle,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { storageService } from '../services/storageService';

interface ProductDetailModalProps {
  product: Product | null;
  store?: Store;
  isLoggedIn?: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variants: Record<string, string>) => void;
  onDirectOrder: (product: Product, quantity: number, variants: Record<string, string>) => void;
  onOpenStore: (storeSlug: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  store,
  isLoggedIn = false,
  onClose,
  onAddToCart,
  onDirectOrder,
  onOpenStore,
}) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach((v) => {
        if (v.options.length > 0) {
          initial[v.name] = v.options[0];
        }
      });
    }
    return initial;
  });

  const [reviewTab, setReviewTab] = useState<'details' | 'reviews'>('details');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const discountPercent = calculateDiscountPercent(product.price, product.promoPrice);
  const activePrice = product.isPromoActive && product.promoPrice ? product.promoPrice : product.price;

  const handleVariantSelect = (variantName: string, optionValue: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: optionValue,
    }));
  };

  const reviews = storageService.getReviewsByProduct(product.id);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewText.trim()) return;

    storageService.addReview({
      productId: product.id,
      storeId: product.storeId,
      customerName: newReviewAuthor.trim(),
      rating: newReviewRating,
      comment: newReviewText.trim(),
      isVerifiedPurchase: true,
    });

    setReviewSubmitted(true);
    setNewReviewAuthor('');
    setNewReviewText('');
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header with Close */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            {store && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStore(store.slug);
                }}
                className="font-medium text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <StoreIcon className="w-3.5 h-3.5" />
                <span>{store.name}</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Media Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              {showVideo && product.videoUrl ? (
                <div className="w-full h-full bg-black relative flex items-center justify-center">
                  <video
                    src={product.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setShowVideo(false)}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                  >
                    Retour aux photos
                  </button>
                </div>
              ) : (
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}

              {discountPercent > 0 && !showVideo && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm">
                  Économisez {discountPercent}%
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setShowVideo(false);
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx && !showVideo
                      ? 'border-amber-600 ring-2 ring-amber-600/20'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}

              {/* Video button if product has demo video */}
              {product.videoUrl && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={`w-16 h-16 rounded-lg border-2 shrink-0 flex flex-col items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                    showVideo
                      ? 'border-amber-600 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Play className="w-5 h-5 text-amber-600 mb-0.5 fill-amber-600" />
                  <span>Vidéo</span>
                </button>
              )}
            </div>

            {/* Cash on Delivery Trust Box */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Paiement à la livraison garanti (COD)</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Vous ne payez rien maintenant. Le livreur vous apporte le produit à domicile, vous inspectez le colis puis vous réglez en espèces.
              </p>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-2">
                {product.name}
              </h1>

              {/* Rating and store details */}
              <div className="flex items-center gap-3 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  <span>{product.rating}</span>
                </div>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="tabular-nums font-medium text-slate-700">
                  {product.salesCount} vendus
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className={product.stock > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                  {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
                </span>
              </div>

              {/* Price display */}
              <div className="mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {formatFCFA(activePrice)}
                  </span>
                  {discountPercent > 0 && (
                    <span className="text-sm text-slate-400 line-through tabular-nums">
                      {formatFCFA(product.price)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      Remise de {formatFCFA(product.price - (product.promoPrice || 0))}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Livraison disponible partout au Bénin sous 24h à 48h</span>
                </div>
              </div>

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-3 mb-5">
                  {product.variants.map((v) => (
                    <div key={v.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {v.name} :{' '}
                        <span className="font-normal text-amber-800">
                          {selectedVariants[v.name] || v.options[0]}
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {v.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleVariantSelect(v.name, opt)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                              selectedVariants[v.name] === opt
                                ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-600'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quantité à commander
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-l-lg transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-semibold text-slate-800 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 rounded-r-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    Total :{' '}
                    <strong className="text-slate-900 tabular-nums">
                      {formatFCFA(activePrice * quantity)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons: Direct COD Order + Add to Cart + WhatsApp inquiry */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => onDirectOrder(product, quantity, selectedVariants)}
                  disabled={product.stock <= 0}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <ShieldCheck className="w-5 h-5 text-amber-200" />
                  <span>Commander maintenant (Payer à la livraison)</span>
                </button>

                {!isLoggedIn ? (
                  <p className="text-[11px] text-center text-slate-500 bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-100">
                    <span className="font-semibold text-amber-700">Inscription acheteur requise :</span> vous créerez votre compte en 30 secondes pour commander sans carte bancaire.
                  </p>
                ) : (
                  <p className="text-[11px] text-center text-emerald-700 font-medium">
                    ✓ Compte acheteur actif — vos coordonnées seront pré-remplies.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product, quantity, selectedVariants)}
                    disabled={product.stock <= 0}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <span>Ajouter au panier</span>
                  </button>

                  {store && (
                    <a
                      href={`https://wa.me/${store.whatsapp.replace(/[^\d+]/g, '').replace('+', '')}?text=${encodeURIComponent(`Bonjour ${store.name}, je suis intéressé par votre produit "${product.name}" sur BéninMarket (Prix: ${formatFCFA(activePrice)}). Pouvez-vous me donner plus de détails sur la livraison ?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs shadow-xs"
                      title="Contacter le vendeur directement sur WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Écrire sur WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Profile Teaser */}
            {store && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                      <span>{store.name}</span>
                      {store.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{store.city}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenStore(store.slug);
                  }}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Visiter la boutique</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab section: Description vs Customer Reviews */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-2 mb-4 text-xs font-semibold">
            <button
              onClick={() => setReviewTab('details')}
              className={`pb-1 transition-colors ${
                reviewTab === 'details'
                  ? 'border-b-2 border-amber-600 text-amber-800'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Description & Caractéristiques
            </button>
            <button
              onClick={() => setReviewTab('reviews')}
              className={`pb-1 transition-colors flex items-center gap-1.5 ${
                reviewTab === 'reviews'
                  ? 'border-b-2 border-amber-600 text-amber-800'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Avis clients vérifiés ({reviews.length})</span>
            </button>
          </div>

          {reviewTab === 'details' ? (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
              <p>{product.description}</p>
              {product.deliveryInfo && (
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-900">Conditionnement & Livraison : </span>
                  {product.deliveryInfo}
                </div>
              )}
              {product.dimensions && (
                <p>
                  <strong>Dimensions :</strong> {product.dimensions} | <strong>Poids :</strong>{' '}
                  {product.weightKg ? `${product.weightKg} kg` : 'N/A'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-56 overflow-y-auto text-xs">
              {reviews.length === 0 ? (
                <p className="text-slate-500 italic">
                  Aucun avis pour l'instant. Soyez le premier client à partager votre expérience après livraison !
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800">{r.customerName}</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add review form */}
              <form onSubmit={handleAddReview} className="pt-3 border-t border-slate-200 space-y-2">
                <span className="font-semibold text-slate-800 block">Laisser un avis (Achat vérifié)</span>
                {reviewSubmitted && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                    Merci ! Votre avis a été enregistré avec succès.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    placeholder="Votre nom"
                    className="p-2 border border-slate-200 rounded text-xs bg-white"
                  />
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="p-2 border border-slate-200 rounded text-xs bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 étoiles (Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ 4 étoiles (Très bon)</option>
                    <option value={3}>⭐⭐⭐ 3 étoiles (Correct)</option>
                    <option value={2}>⭐⭐ 2 étoiles</option>
                    <option value={1}>⭐ 1 étoile</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={2}
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Votre avis sur la qualité du produit et la rapidité de la livraison..."
                  className="w-full p-2 border border-slate-200 rounded text-xs bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Publier l'avis
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
