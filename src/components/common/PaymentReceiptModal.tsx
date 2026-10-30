import React from 'react';
import { Order } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import {
  X,
  Printer,
  CheckCircle2,
  Share2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface PaymentReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const receiptNumber = order.receiptNumber || `REC-${order.id}`;
  const deliveredDate = order.deliveredAt
    ? new Date(order.deliveredAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  const handlePrint = () => {
    window.print();
  };

  const shareText = `*REÇU DE PAIEMENT ACQUITTÉ BÉNINMARKET*\n` +
    `🧾 N° de Reçu : ${receiptNumber}\n` +
    `📦 Commande : ${order.id}\n` +
    `👤 Client : ${order.customerName}\n` +
    `💰 Montant Réglé : ${formatFCFA(order.cashCollectedAmount || order.grandTotal)}\n` +
    `📅 Date d'encaissement : ${deliveredDate}\n` +
    `✅ Statut : LIVRAISON EFFECTUÉE & PAIEMENT CASH ENCAISSÉ\n` +
    `Consultez vos reçus sur BéninMarket !`;

  const whatsappUrl = `https://wa.me/${order.customerPhone.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:shadow-none print:border-none print:m-0">
        {/* Success Header Status */}
        <div className="bg-emerald-600 text-white px-5 py-3 text-xs font-semibold flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>
              Livraison validée ! Reçu transmis par Email (<strong>{order.customerEmail}</strong>) et WhatsApp (<strong>{order.customerPhone}</strong>)
            </span>
          </div>
          <span className="text-[10px] bg-emerald-700 font-bold px-2.5 py-0.5 rounded-full shrink-0">
            PAYÉ & ENCAISSÉ
          </span>
        </div>

        {/* Modal Top Actions */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
              Facture Acquittée
            </span>
            <span className="text-xs text-slate-500 font-medium">BéninMarket Cash on Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
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
              <span>WhatsApp Client</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 relative" id="payment-receipt-content">
          {/* Visual Watermark Stamp */}
          <div className="absolute right-8 top-28 sm:top-24 pointer-events-none opacity-90 rotate-[-12deg] z-10">
            <div className="border-4 border-emerald-600 text-emerald-600 font-black px-4 py-2 rounded-xl text-center uppercase tracking-widest text-xs sm:text-sm shadow-sm bg-emerald-50/70">
              <div className="text-[10px] tracking-normal">BÉNINMARKET COD</div>
              <div className="text-sm sm:text-base font-extrabold">PAYÉ EN CASH</div>
              <div className="text-[9px] tracking-normal font-medium">LIVRAISON EFFECTUÉE</div>
            </div>
          </div>

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
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Reçu Certifié
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Plateforme E-commerce Multivendeurs — Cotonou, Bénin
                </p>
                <p className="text-xs text-slate-400">
                  Service client : (+229) 97 00 11 22 | support@beninmarket.bj
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                REÇU DE PAIEMENT ACQUITTÉ
              </div>
              <div className="text-xl font-black text-slate-900 font-mono tracking-wide">
                N° {receiptNumber}
              </div>
              <div className="text-xs text-slate-500 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Encaissé le {deliveredDate}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Réf. Commande : {order.id}
              </div>
            </div>
          </div>

          {/* Customer & Encaissement Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Acheteur & Payeur
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
              <div className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{order.neighborhood}, {order.city}</span>
              </div>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Validation de livraison & Règlement
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Paiement 100% perçu en Cash à la livraison</span>
              </div>
              <div className="text-slate-600">
                <strong>Encaissé par :</strong> {order.cashEncaissedBy || 'Vendeur Certifié BéninMarket'}
              </div>
              <div className="text-slate-600">
                <strong>Mode d'encaissement :</strong> Espèces / Mobile Money (MoMo / Moov)
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Colis remis en mains propres après contrôle et vérification de conformité.
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-100/70">
                  <th className="py-2.5 px-3">Désignation</th>
                  <th className="py-2.5 px-2 text-center">Qté</th>
                  <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                  <th className="py-2.5 px-3 text-right">Montant Réglé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                        <div className="text-[11px] text-slate-500">
                          {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                        </div>
                      )}
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

          {/* Totals & Signature */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Facture Acquittée & Reçu de paiement libératoire</span>
              </div>
              <p className="text-[11px] leading-relaxed max-w-sm">
                Ce document certifie le règlement intégral de la commande n° <strong>{order.id}</strong>. Aucune somme supplémentaire n'est due.
              </p>
            </div>

            <div className="w-full sm:w-64 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total articles :</span>
                <span className="font-semibold text-slate-800">{formatFCFA(order.productsTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais de livraison :</span>
                <span className="font-semibold text-slate-800">{formatFCFA(order.deliveryTotal)}</span>
              </div>
              <div className="border-t border-emerald-200 pt-1.5 flex justify-between font-black text-sm text-emerald-800">
                <span>TOTAL ENCAISSÉ :</span>
                <span>{formatFCFA(order.cashCollectedAmount || order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <div>BéninMarket — Merci pour votre confiance et à bientôt !</div>
            <div>Document émis sous le protocole Cash on Delivery Bénin</div>
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
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer / Télécharger Reçu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
