import React, { useRef } from 'react';
import { Order } from '../types';
import { formatFCFA, formatDateFR } from '../utils/formatters';
import {
  CheckCircle2,
  Printer,
  Download,
  Share2,
  Mail,
  ShieldCheck,
  Truck,
  MapPin,
  Phone,
  Store as StoreIcon,
  X,
  Package,
} from 'lucide-react';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
  onOpenBonDeCommande?: (order: Order) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onTrackOrder,
  onOpenBonDeCommande,
}) => {
  if (!order) return null;

  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col print:border-none print:shadow-none print:max-h-none">
        {/* Modal Top Bar (hidden when printing) */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-slate-900">
              Commande enregistrée avec succès
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenBonDeCommande && (
              <button
                onClick={() => onOpenBonDeCommande(order)}
                className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-amber-700" />
                <span>Voir mon Bon de Commande</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div ref={printableRef} className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800">
          {/* Big COD & Success Validation Banner */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-black uppercase tracking-wider block text-emerald-900">
                  COMMANDE ENREGISTRÉE : PAIEMENT À LA LIVRAISON
                </span>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Votre commande a bien été transmise aux vendeurs. <strong>Vous ne paierez qu'à la réception du colis</strong>.
                </p>
              </div>
            </div>
            <div className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xs">
              0 FCFA PAYÉ EN LIGNE
            </div>
          </div>

          {/* Email dispatched notice box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Bon de commande envoyé :</strong> Une copie officielle avec vos récapitulatifs a été expédiée à <strong>{order.customerEmail}</strong>.
              </span>
            </div>
            {onOpenBonDeCommande && (
              <button
                type="button"
                onClick={() => onOpenBonDeCommande(order)}
                className="font-bold underline text-blue-700 hover:text-blue-800 ml-2 shrink-0 cursor-pointer text-[11px]"
              >
                Ouvrir le bon
              </button>
            )}
          </div>

          {/* Receipt Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                <span className="text-amber-600">Bénin</span>
                <span>Market</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Marketplace Multivendeurs · République du Bénin
              </p>
              <p className="text-[11px] text-slate-400">
                Service client : +229 97 00 11 22 · contact@beninmarket.bj
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-800 block">
                Bon de commande — Paiement à la livraison
              </span>
              <span className="text-base font-extrabold text-slate-900 tabular-nums">
                N° {order.trackingCode}
              </span>
              <span className="block text-xs text-slate-500">
                Date : {formatDateFR(order.createdAt)}
              </span>
            </div>
          </div>

          {/* Customer & Delivery Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[11px]">
                Informations du Client
              </span>
              <div className="space-y-1 text-slate-700">
                <div>
                  <span className="text-slate-500">Nom :</span>{' '}
                  <strong className="text-slate-900">{order.customerLastName || order.customerName.split(' ')[1] || order.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Prénom :</span>{' '}
                  <strong className="text-slate-900">{order.customerFirstName || order.customerName.split(' ')[0]}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Téléphone :</span>{' '}
                  <strong className="text-slate-900">{order.customerPhone}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Email :</span> {order.customerEmail}
                </div>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[11px]">
                Adresse de livraison au Bénin
              </span>
              <div className="space-y-1 text-slate-700">
                <div>
                  <span className="text-slate-500">Ville :</span>{' '}
                  <strong className="text-slate-900">{order.city}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Quartier :</span>{' '}
                  <strong className="text-slate-900">{order.neighborhood}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Adresse / Repères :</span> {order.deliveryAddress}
                </div>
                {order.deliveryInstructions && (
                  <div className="italic text-slate-500">
                    Instructions : "{order.deliveryInstructions}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suborders and Vendor Contacts with DIRECT WHATSAPP BUTTON */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Articles commandés & Contact direct des vendeurs
            </h3>

            {order.subOrders.map((sub) => {
              const cleanWhatsapp = (sub.storeWhatsapp || sub.storePhone || '').replace(/[^\d+]/g, '').replace('+', '');
              const whatsappMessage = encodeURIComponent(
                `Bonjour ${sub.storeName}, j'ai passé la commande N° ${order.trackingCode} sur BéninMarket (Paiement à la livraison, montant: ${formatFCFA(sub.total)}). Je vous contacte pour confirmer la préparation et l'expédition de mon colis.`
              );
              const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${whatsappMessage}`;

              return (
                <div key={sub.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  {/* Vendor Contact Header */}
                  <div className="bg-slate-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                        <StoreIcon className="w-4 h-4 text-amber-700" />
                        <span>Boutique : {sub.storeName}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Téléphone direct : {sub.storePhone}
                      </span>
                    </div>

                    {/* DIRECT WHATSAPP BUTTON */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0 print:hidden"
                      title="Contacter le vendeur directement sur WhatsApp au cas où la commande tarde"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Écrire au vendeur sur WhatsApp</span>
                    </a>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {sub.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage}
                            alt=""
                            className="w-10 h-10 object-cover rounded bg-slate-100"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            {item.selectedVariants && (
                              <div className="text-[11px] text-slate-500">
                                {Object.entries(item.selectedVariants)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' · ')}
                              </div>
                            )}
                            <div className="text-slate-500 tabular-nums">
                              {formatFCFA(item.unitPrice)} × {item.quantity}
                            </div>
                          </div>
                        </div>

                        <div className="font-bold text-slate-900 tabular-nums text-right">
                          {formatFCFA(item.totalPrice)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex justify-between text-xs text-slate-600">
                    <span>Frais de livraison ({order.city}) :</span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {sub.deliveryFee === 0 ? 'Offerte (Gratuit)' : formatFCFA(sub.deliveryFee)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial Totals */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total produits :</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatFCFA(order.productsTotal)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total frais de livraison :</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatFCFA(order.deliveryTotal)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-bold text-slate-900">
                  Montant total à régler au livreur :
                </span>
                <span className="block text-[11px] text-emerald-700 font-semibold">
                  Mode : Espèces à la livraison (Cash on Delivery)
                </span>
              </div>
              <span className="text-xl font-black text-amber-700 tabular-nums">
                {formatFCFA(order.grandTotal)}
              </span>
            </div>
          </div>

          {/* Delivery Reassurance Notes */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Instructions pour votre livraison :</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Gardez votre téléphone allumé. Le livreur vous contactera avant d'arriver.</li>
              <li>Préparez l'appoint en espèces pour faciliter la monnaie.</li>
              <li>Vous êtes invité à inspecter l'état extérieur de votre colis devant le livreur.</li>
            </ul>
          </div>
        </div>

        {/* Action Bottom Bar (hidden in print) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => {
              onClose();
              onTrackOrder(order.trackingCode);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>Suivre l'acheminement de ce colis</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors text-center cursor-pointer"
          >
            Retourner à la boutique
          </button>
        </div>
      </div>
    </div>
  );
};
