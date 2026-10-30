import React from 'react';
import { Order } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import {
  X,
  Printer,
  Mail,
  CheckCircle,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  Calendar,
  Package,
  Share2,
} from 'lucide-react';

interface BonDeCommandeModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BonDeCommandeModal: React.FC<BonDeCommandeModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const shareText = `*BON DE COMMANDE BÉNINMARKET N° ${order.id}*\n` +
    `👤 Client : ${order.customerName}\n` +
    `📍 Destination : ${order.neighborhood}, ${order.city}\n` +
    `📦 Articles : ${order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}\n` +
    `💰 Montant Total COD : ${formatFCFA(order.grandTotal)}\n` +
    `💵 Mode : Paiement à la livraison après vérification`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:shadow-none print:border-none print:m-0">
        {/* Email Sent Status Banner */}
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>
              Bon de commande officiel transmis avec succès à <strong>{order.customerEmail}</strong>
            </span>
          </div>
          <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full shrink-0">
            Email envoyé
          </span>
        </div>

        {/* Modal Top Actions */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
              Document officiel
            </span>
            <span className="text-xs text-slate-500 font-medium">BéninMarket Multivendeurs</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimer / PDF</span>
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800" id="bon-de-commande-content">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 shadow-xs shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
                  alt="Logo BéninMarket"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
                  <span className="text-emerald-700">Bénin</span>
                  <span className="text-amber-500">Market</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    COD Bénin
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Plateforme E-commerce Multivendeurs — Paiement 100% à la livraison
                </p>
                <p className="text-xs text-slate-400">
                  Contact : support@beninmarket.bj | (+229) 97 00 11 22
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                BON DE COMMANDE
              </div>
              <div className="text-xl font-black text-amber-600 font-mono tracking-wide">
                N° {order.id}
              </div>
              <div className="text-xs text-slate-500 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Émis le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div className="space-y-1.5">
              <div className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Destinataire (Acheteur)
              </div>
              <div className="font-bold text-slate-900 text-sm">{order.customerName}</div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{order.customerEmail}</span>
              </div>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Lieu de livraison & Expédition
              </div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>{order.city} — {order.neighborhood}</span>
              </div>
              <div className="text-slate-600">
                <strong>Repères :</strong> {order.deliveryAddress}
              </div>
              {order.deliveryInstructions && (
                <div className="text-amber-800 bg-amber-50 p-1.5 rounded text-[11px] border border-amber-200/60">
                  <strong>Notes de livraison :</strong> {order.deliveryInstructions}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-100/60">
                  <th className="py-2.5 px-3">Article & Boutique</th>
                  <th className="py-2.5 px-2 text-center">Qté</th>
                  <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">{item.productName}</div>
                          {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                            <div className="text-[11px] text-slate-500">
                              {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatFCFA(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatFCFA(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
            <div className="text-xs text-slate-500 max-w-sm space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Modalité : 100% Cash on Delivery (Paiement à la livraison)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Le client règlera la somme de <strong>{formatFCFA(order.grandTotal)}</strong> directement au livreur, après avoir ouvert et inspecté le colis.
              </p>
            </div>

            <div className="w-full sm:w-64 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total articles :</span>
                <span className="font-semibold text-slate-800">{formatFCFA(order.productsTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais de livraison ({order.city}) :</span>
                <span className="font-semibold text-slate-800">{formatFCFA(order.deliveryTotal)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-amber-600">
                <span>NET À PAYER :</span>
                <span>{formatFCFA(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Official Footnote */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <div>Code de suivi unique : <span className="font-mono font-bold text-slate-600">{order.trackingCode}</span></div>
            <div>Plateforme sécurisée BéninMarket — Merci pour votre confiance !</div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer / Télécharger</span>
          </button>
        </div>
      </div>
    </div>
  );
};
