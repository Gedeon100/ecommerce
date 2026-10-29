import React, { useState } from 'react';
import { Product, Store } from '../types';
import { formatFCFA, calculateDiscountPercent } from '../utils/formatters';
import { ShoppingCart, Star, Video, Eye, ShieldCheck, Tag } from 'lucide-react';
import { mediaStorage } from '../services/mediaStorage';

interface ProductCardProps {
  product: Product;
  store?: Store;
  onSelect: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  store,
  onSelect,
  onQuickBuy,
  onAddToCart,
}) => {
  const [imageError, setImageError] = useState(false);
  const discountPercent = calculateDiscountPercent(product.price, product.promoPrice);
  const activePrice = product.isPromoActive && product.promoPrice ? product.promoPrice : product.price;

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Product Image Area */}
      <div
        onClick={() => onSelect(product)}
        className="relative w-full aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer"
      >
        {!imageError && product.images?.[0] ? (
          <img
            src={mediaStorage.resolveUrl(product.images[0])}
            alt={product.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-amber-50 text-slate-400">
            <Tag className="w-8 h-8 text-amber-500 mb-1" />
            <span className="text-xs text-slate-500 text-center font-medium line-clamp-2">
              {product.name}
            </span>
          </div>
        )}

        {/* Promo discount badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
            -{discountPercent}%
          </div>
        )}

        {/* Video demonstration badge if video available */}
        {product.videoUrl && (
          <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
            <Video className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Vidéo</span>
          </div>
        )}

        {/* Cash on delivery tag in bottom image */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-200/60 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Payez à réception</span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Store metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="uppercase tracking-wider font-semibold text-amber-800 truncate max-w-[60%]">
              {product.category}
            </span>
            {store && (
              <span className="text-slate-500 truncate max-w-[40%] text-right hover:text-slate-800">
                {store.name}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelect(product)}
            className="font-medium text-slate-900 text-sm leading-snug line-clamp-2 hover:text-amber-700 cursor-pointer mb-2"
          >
            {product.name}
          </h3>

          {/* Rating & Stock */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
            <div className="flex items-center text-amber-500 font-semibold text-xs">
              <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
              <span>{product.rating}</span>
            </div>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="tabular-nums text-slate-500">
              {product.salesCount || 0} ventes
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className={`text-[11px] ${product.stock > 0 ? 'text-emerald-700 font-medium' : 'text-rose-600 font-semibold'}`}>
              {product.stock > 0 ? `Stock: ${product.stock}` : 'Rupture'}
            </span>
          </div>
        </div>

        {/* Price & Action Area */}
        <div className="pt-2 border-t border-slate-100 mt-2">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {formatFCFA(activePrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatFCFA(product.price)}
              </span>
            )}
          </div>

          {/* Buttons: Quick Buy COD & Add to cart */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
              className="w-full py-2 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Ajouter au panier"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panier</span>
            </button>
            <button
              onClick={() => onQuickBuy(product)}
              disabled={product.stock <= 0}
              className="w-full py-2 px-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              title="Commander maintenant sans carte bancaire"
            >
              <span>Commander</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
