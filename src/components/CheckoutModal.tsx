import React, { useState, useEffect } from 'react';
import { CartItem, Store, Order, User } from '../types';
import { storageService } from '../services/storageService';
import { DEFAULT_DELIVERY_ZONES } from '../data/initialData';
import { formatFCFA } from '../utils/formatters';
import {
  X,
  ShieldCheck,
  Truck,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  AlertCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  stores: Store[];
  currentUser?: User | null;
  onOrderSuccess: (order: Order) => void;
  onRequireAuth?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  stores,
  currentUser,
  onOrderSuccess,
  onRequireAuth,
}) => {
  if (!isOpen || items.length === 0) return null;

  const [customerLastName, setCustomerLastName] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+229 ');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedCity, setSelectedCity] = useState('Cotonou');
  const [neighborhood, setNeighborhood] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill from authenticated buyer account
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.lastName) {
        setCustomerLastName(currentUser.lastName);
      } else if (currentUser.name) {
        const parts = currentUser.name.split(' ');
        setCustomerFirstName(parts[0] || '');
        setCustomerLastName(parts.slice(1).join(' ') || parts[0] || '');
      }
      if (currentUser.firstName) {
        setCustomerFirstName(currentUser.firstName);
      }
      if (currentUser.whatsapp) {
        setCustomerPhone(currentUser.whatsapp);
      } else if (currentUser.phone) {
        setCustomerPhone(currentUser.phone);
      }
      if (currentUser.email) {
        setCustomerEmail(currentUser.email);
      }
    }
  }, [currentUser, isOpen]);

  // Group items by store to compute exact delivery fees per vendor
  const itemsByStore: Record<string, CartItem[]> = {};
  items.forEach((item) => {
    if (!itemsByStore[item.storeId]) itemsByStore[item.storeId] = [];
    itemsByStore[item.storeId].push(item);
  });

  const productsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Calculate delivery fee for the selected city across all vendor suborders
  let totalDelivery = 0;
  const storeDeliveryBreakdown: { storeName: string; storeWhatsapp: string; subtotal: number; fee: number; isFree: boolean }[] = [];

  Object.entries(itemsByStore).forEach(([storeId, storeItems]) => {
    const store = stores.find((s) => s.id === storeId);
    const storeSubtotal = storeItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

    const zone = store?.deliveryZones.find(
      (z) => z.city.toLowerCase() === selectedCity.toLowerCase()
    ) || DEFAULT_DELIVERY_ZONES.find(
      (z) => z.city.toLowerCase() === selectedCity.toLowerCase()
    );

    let fee = zone ? zone.fee : 1500;
    let isFree = false;
    if (zone?.freeAbove && storeSubtotal >= zone.freeAbove) {
      fee = 0;
      isFree = true;
    }

    totalDelivery += fee;
    storeDeliveryBreakdown.push({
      storeName: store ? store.name : 'Boutique',
      storeWhatsapp: store ? store.whatsapp : '',
      subtotal: storeSubtotal,
      fee,
      isFree,
    });
  });

  const grandTotal = productsTotal + totalDelivery;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerLastName.trim()) {
      setErrorMsg('Veuillez renseigner votre NOM.');
      return;
    }
    if (!customerFirstName.trim()) {
      setErrorMsg('Veuillez renseigner votre PRÉNOM.');
      return;
    }
    if (customerPhone.trim().length < 8) {
      setErrorMsg('Veuillez indiquer votre numéro de téléphone (Bénin / WhatsApp).');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMsg('Veuillez saisir votre adresse email pour recevoir la confirmation.');
      return;
    }
    if (!neighborhood.trim()) {
      setErrorMsg('Veuillez renseigner votre quartier de résidence.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg('Veuillez préciser votre adresse exacte ou des repères pour le livreur.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullCustomerName = `${customerFirstName.trim()} ${customerLastName.trim()}`;
      const createdOrder = storageService.createOrder({
        customerFirstName: customerFirstName.trim(),
        customerLastName: customerLastName.trim(),
        customerName: fullCustomerName,
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        city: selectedCity,
        neighborhood: neighborhood.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryInstructions: deliveryInstructions.trim(),
        items,
      });

      setIsSubmitting(false);
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg('Erreur lors de la confirmation de votre commande. Veuillez réessayer.');
    }
  };

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Inscription Acheteur Requise
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Pour avoir accès à l'option de commander un produit, vous devez d'abord vous inscrire en tant qu'acheteur et avoir votre compte. Vous paierez en espèces à la réception de votre colis.
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onRequireAuth) onRequireAuth();
              }}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              S'inscrire comme Acheteur pour commander
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Continuer d'explorer les boutiques
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Commander en ligne</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block bg-emerald-600 text-white font-bold text-[11px] px-2 py-0.5 rounded">
                PAIEMENT À LA LIVRAISON
              </span>
              <span className="text-xs text-slate-500">· 0 FCFA débité maintenant</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {currentUser && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Compte Acheteur actif : <strong>{currentUser.name}</strong> ({currentUser.whatsapp || currentUser.phone || currentUser.email})
                </span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Vérifié
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* COD Notice Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-1">
              <span className="font-extrabold block text-sm tracking-wide text-emerald-950">
                CONDITIONS : PAIEMENT À LA LIVRAISON
              </span>
              <p className="leading-relaxed">
                Remplissez simplement vos informations ci-dessous. Le vendeur prépare votre colis et un livreur vous l'apporte directement à votre adresse. <strong>Vous ne paierez qu'après réception et vérification du produit</strong>.
              </p>
            </div>
          </div>

          {/* Customer Personal Details: NOM, PRÉNOM, EMAIL, TÉLÉPHONE */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>1. Vos informations personnelles</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  NOM DE FAMILLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mensah"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  PRÉNOM *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Brice"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  NUMÉRO DE TÉLÉPHONE (Appel & WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+229 97 00 00 00"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Le livreur vous contactera sur ce numéro avant son arrivée.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ADRESSE E-MAIL (Pour le reçu) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="votre.email@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Votre bon de commande vous sera transmis à cette adresse.
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address in Benin */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>2. Lieu de livraison au Bénin</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ville de livraison *
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Cotonou">Cotonou (1 000 FCFA)</option>
                  <option value="Abomey-Calavi">Abomey-Calavi (1 500 FCFA)</option>
                  <option value="Porto-Novo">Porto-Novo (2 000 FCFA)</option>
                  <option value="Ouidah">Ouidah (2 000 FCFA)</option>
                  <option value="Parakou">Parakou (3 500 FCFA)</option>
                  <option value="Bohicon">Bohicon / Abomey (2 500 FCFA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quartier de livraison *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Haie Vive, Cadjehoun, Agla, Zogbadjè..."
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse exacte / Repères utiles pour le livreur *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Ex: Rue 244, Face pharmacie de la Haie Vive, 2ème maison après l'agence MTN, portail noir."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instructions spéciales (facultatif)
              </label>
              <input
                type="text"
                placeholder="Ex: M'appeler 15 minutes avant votre passage svp."
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Payment Method Selector (100% COD - Locked & Reassuring) */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>3. Mode de paiement</span>
            </h3>

            <div className="p-3.5 rounded-xl border-2 border-amber-600 bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="cod"
                  name="payment"
                  checked
                  readOnly
                  className="w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
                />
                <label htmlFor="cod" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-900 block">
                    Paiement en espèces à la livraison (Cash on Delivery)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Réglez directement au livreur une fois votre colis en main propre.
                  </span>
                </label>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Recommandé & Sécurisé
              </span>
            </div>
          </div>

          {/* Order Financial Summary */}
          <div className="pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 p-6 space-y-3">
            <div className="text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Articles commandés ({items.reduce((s, i) => s + i.quantity, 0)}) :</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatFCFA(productsTotal)}
                </span>
              </div>

              {storeDeliveryBreakdown.map((b, idx) => (
                <div key={idx} className="flex justify-between text-[11px] text-slate-500">
                  <span>Livraison ({b.storeName}) :</span>
                  <span className={`tabular-nums ${b.isFree ? 'text-emerald-700 font-bold' : ''}`}>
                    {b.isFree ? 'Gratuit (Offerte)' : formatFCFA(b.fee)}
                  </span>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <div>
                  <span className="font-bold text-slate-900">Total à payer à la réception</span>
                  <span className="block text-[11px] text-emerald-700 font-medium">
                    (0 FCFA débité aujourd'hui)
                  </span>
                </div>
                <span className="text-xl font-extrabold text-amber-700 tabular-nums">
                  {formatFCFA(grandTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {isSubmitting ? 'Traitement de la commande...' : 'Confirmer ma commande sans payer maintenant'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
