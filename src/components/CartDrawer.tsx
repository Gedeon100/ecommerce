import React from 'react';
import { CartItem, Store } from '../types';
import { formatFCFA } from '../utils/formatters';
import { X, Trash2, ShoppingBag, ShieldCheck, ArrowRight, Store as StoreIcon } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  stores: Store[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  stores,
  onUpdateQuantity,
  onCheckout,
}) => {
  if (!isOpen) return null;

  // Group items by store
  const itemsByStore: Record<string, CartItem[]> = {};
  cart.forEach((item) => {
    if (!itemsByStore[item.storeId]) {
      itemsByStore[item.storeId] = [];
    }
    itemsByStore[item.storeId].push(item);
  });

  const grandTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
            <h2 className="font-bold text-slate-900 text-base">Votre Panier COD</h2>
            <span className="text-xs text-slate-500 font-medium tabular-nums">
              ({cart.reduce((sum, i) => sum + i.quantity, 0)} articles)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Votre panier est vide</h3>
            <p className="text-slate-500 text-xs mb-6 max-w-xs">
              Découvrez nos produits locaux d'exception et commandez sans payer en ligne.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Parcourir les produits
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Multi-vendor notice if more than 1 store */}
            {Object.keys(itemsByStore).length > 1 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <strong>Commande multi-boutiques :</strong> Vos articles proviennent de {Object.keys(itemsByStore).length} vendeurs différents. Vous recevrez des sous-colis coordonnés.
              </div>
            )}

            {Object.entries(itemsByStore).map(([storeId, storeItems]) => {
              const store = stores.find((s) => s.id === storeId);
              const storeSubtotal = storeItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

              return (
                <div key={storeId} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-1.5 text-amber-800">
                      <StoreIcon className="w-3.5 h-3.5" />
                      <span>{store ? store.name : 'Boutique Partenaire'}</span>
                    </div>
                    <span className="text-slate-500 tabular-nums">
                      Sous-total : {formatFCFA(storeSubtotal)}
                    </span>
                  </div>

                  {/* Store Items */}
                  <div className="space-y-3">
                    {storeItems.map((item) => (
                      <div key={item.id} className="flex gap-3 bg-white p-2.5 rounded-lg border border-slate-200/80">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-md shrink-0 bg-slate-100"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900 truncate">
                              {item.productName}
                            </h4>
                            {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                              <div className="text-[11px] text-slate-500">
                                {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                              </div>
                            )}
                            <div className="text-xs font-bold text-slate-900 tabular-nums mt-0.5">
                              {formatFCFA(item.price)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center border border-slate-200 rounded bg-white">
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-semibold tabular-nums text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => onUpdateQuantity(item.id, 0)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer with Checkout CTA */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total articles</span>
              <span className="font-bold text-slate-900 text-base tabular-nums">
                {formatFCFA(grandTotal)}
              </span>
            </div>

            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2 text-[11px] text-amber-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>0 FCFA en ligne. Vous paierez l'intégralité à la livraison.</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <span>Passer la commande (COD)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-slate-500">
              Un compte acheteur gratuit est requis pour valider votre commande et votre adresse de livraison.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
