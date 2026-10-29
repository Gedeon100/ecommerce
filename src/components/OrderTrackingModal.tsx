import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { storageService } from '../services/storageService';
import { formatFCFA, formatDateFR, ORDER_STATUS_CONFIG } from '../utils/formatters';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Phone,
  ShieldCheck,
  Ban,
  RotateCcw,
  FileText,
  Receipt,
  Mail,
} from 'lucide-react';
import { BonDeCommandeModal } from './common/BonDeCommandeModal';
import { PaymentReceiptModal } from './common/PaymentReceiptModal';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingCode?: string;
  onOpenCustomerService?: (orderId?: string) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialTrackingCode = '',
  onOpenCustomerService,
}) => {
  const [trackingInput, setTrackingInput] = useState(initialTrackingCode);
  const [phoneInput, setPhoneInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(() => {
    if (initialTrackingCode) {
      return storageService.getOrderByIdOrCode(initialTrackingCode) || null;
    }
    return null;
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [cancellationSuccess, setCancellationSuccess] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('Changement d’avis');
  const [cancelError, setCancelError] = useState('');
  const [showBonModal, setShowBonModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCancellationSuccess(false);

    const found = storageService.getOrderByIdOrCode(trackingInput);
    if (!found) {
      setErrorMsg('Numéro de commande introuvable. Exemple: BM-2026-1042');
      setSearchedOrder(null);
      return;
    }

    // Optional phone security verification if provided
    if (phoneInput.trim()) {
      const cleanPhone = phoneInput.replace(/[\s+-]/g, '');
      const orderPhone = found.customerPhone.replace(/[\s+-]/g, '');
      if (!orderPhone.includes(cleanPhone) && !cleanPhone.includes(orderPhone)) {
        setErrorMsg('Le numéro de téléphone ne correspond pas à cette commande.');
        return;
      }
    }

    setSearchedOrder(found);
  };

  const confirmCancel = () => {
    if (!searchedOrder) return;
    setCancelError('');

    const res = storageService.cancelOrderByCustomer(searchedOrder.id, cancelReasonInput);
    if (res.success) {
      setSearchedOrder({ ...searchedOrder, status: 'ANNULEE' });
      setCancellationSuccess(true);
      setShowCancelDialog(false);
    } else {
      setCancelError(res.message);
    }
  };

  const timelineSteps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'NOUVELLE', label: '1. Commande reçue', desc: 'Enregistrée sur le système' },
    { key: 'CONFIRMEE', label: '2. Confirmée', desc: 'Validée par le vendeur' },
    { key: 'EN_PREPARATION', label: '3. En préparation', desc: 'Vérification et emballage' },
    { key: 'PRETE_EXPEDITION', label: '4. Prête à expédier', desc: 'Remise au coursier partenaire' },
    { key: 'EN_COURS_LIVRAISON', label: '5. En livraison', desc: 'Livreur en route vers votre domicile' },
    { key: 'LIVREE_ENCAISSEE', label: '6. Livrée & Payée', desc: 'Paiement espèces encaissé' },
  ];

  const currentStepIndex = searchedOrder ? ORDER_STATUS_CONFIG[searchedOrder.status]?.stepIndex || 0 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-slate-900">
              Suivi de colis & Commande en direct
            </h2>
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
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Tracking Search Form */}
          <form onSubmit={handleSearch} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro de commande (Ex: BM-2026-1042)
                </label>
                <input
                  type="text"
                  required
                  placeholder="BM-2026-XXXX"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone du destinataire (facultatif)
                </label>
                <input
                  type="text"
                  placeholder="+229 97 00 00 00"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Vérifier le statut du colis</span>
            </button>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {cancellationSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Votre commande a bien été annulée. Aucun frais ne vous sera réclamé.</span>
            </div>
          )}

          {/* Searched Order Details */}
          {searchedOrder && (
            <div className="space-y-6">
              {/* Status Header Badge */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">Statut actuel du colis :</div>
                  <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                        ORDER_STATUS_CONFIG[searchedOrder.status]?.bg || 'bg-slate-100'
                      } ${ORDER_STATUS_CONFIG[searchedOrder.status]?.color || 'text-slate-800'}`}
                    >
                      {ORDER_STATUS_CONFIG[searchedOrder.status]?.label || searchedOrder.status}
                    </span>
                    <span className="text-xs font-normal text-slate-600">
                      ({ORDER_STATUS_CONFIG[searchedOrder.status]?.description})
                    </span>
                  </div>
                </div>

                <div className="text-xs sm:text-right">
                  <div className="text-slate-500">Montant dû à la livraison :</div>
                  <div className="text-lg font-black text-amber-700 tabular-nums">
                    {formatFCFA(searchedOrder.grandTotal)}
                  </div>
                </div>
              </div>

              {/* Visual Timeline (if order is active and not cancelled/returned) */}
              {searchedOrder.status !== 'ANNULEE' &&
                searchedOrder.status !== 'LIVRAISON_ECHOUEE' &&
                searchedOrder.status !== 'RETOURNEE' && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Acheminement en temps réel
                    </h3>
                    <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {timelineSteps.map((step, idx) => {
                        const stepNum = idx + 1;
                        const isCompleted = stepNum <= currentStepIndex;
                        const isCurrent = stepNum === currentStepIndex;

                        return (
                          <div key={step.key} className="relative flex items-start gap-3">
                            <span
                              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                            >
                              {isCompleted ? '✓' : stepNum}
                            </span>
                            <div>
                              <div
                                className={`text-xs font-bold ${
                                  isCompleted ? 'text-slate-900' : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </div>
                              <div className="text-[11px] text-slate-500">{step.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Delivery Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Destinataire & Adresse</span>
                  <div className="text-slate-900 font-medium">{searchedOrder.customerName}</div>
                  <div className="text-slate-600">{searchedOrder.neighborhood}, {searchedOrder.city}</div>
                  <div className="text-slate-500">{searchedOrder.deliveryAddress}</div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Livreur assigné</span>
                  {searchedOrder.driverName ? (
                    <div className="space-y-1">
                      <div className="font-medium text-slate-900">{searchedOrder.driverName}</div>
                      <div className="text-slate-600 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>{searchedOrder.driverPhone}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">
                      Attribution du livreur en cours par la boutique partenaire.
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor WhatsApp Direct Contact Box (if order is not processed or question) */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>Votre commande tarde ou n'est pas encore traitée ?</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Vous pouvez contacter directement chaque vendeur sur WhatsApp pour accélérer la préparation de votre colis :
                </p>

                <div className="space-y-2 pt-1">
                  {searchedOrder.subOrders?.map((sub) => {
                    const cleanWhatsapp = (sub.storeWhatsapp || sub.storePhone || '').replace(/[^\d+]/g, '').replace('+', '');
                    const message = encodeURIComponent(
                      `Bonjour ${sub.storeName}, je viens aux nouvelles pour ma commande N° ${searchedOrder.trackingCode} sur BéninMarket (Statut: ${ORDER_STATUS_CONFIG[sub.status]?.label || sub.status}). Pouvez-vous me confirmer le délai de livraison ? Merci !`
                    );
                    const waUrl = `https://wa.me/${cleanWhatsapp}?text=${message}`;

                    return (
                      <div
                        key={sub.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-emerald-200/80 text-xs"
                      >
                        <div>
                          <strong className="text-slate-900">{sub.storeName}</strong>
                          <span className="text-slate-500 block text-[11px]">
                            Tél : {sub.storePhone}
                          </span>
                        </div>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Écrire sur WhatsApp</span>
                        </a>
                      </div>
                    );
                  })}
                </div>

                {onOpenCustomerService && (
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-emerald-900">
                      Un litige persistant ? Contactez le responsable du site :
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenCustomerService(searchedOrder.id)}
                      className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <span>Signaler au responsable (kgmservices229@gmail.com)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Official Documents (Bon de Commande & Reçu de Paiement) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Documents officiels de la commande
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBonModal(true)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>Bon de commande officiel</span>
                  </button>

                  {searchedOrder.status === 'LIVREE_ENCAISSEE' && (
                    <button
                      type="button"
                      onClick={() => setShowReceiptModal(true)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Reçu de paiement acquitté</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cancellation button if not shipped yet */}
              {['NOUVELLE', 'CONFIRMEE', 'EN_PREPARATION'].includes(searchedOrder.status) && (
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Un imprévu ? Vous pouvez annuler votre commande sans frais avant son expédition.
                  </span>
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Annuler la commande
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline Cancel Dialog */}
      {showCancelDialog && searchedOrder && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Ban className="w-5 h-5" />
              <h4 className="font-bold text-sm">Confirmer l'annulation</h4>
            </div>
            <p className="text-xs text-slate-600">
              Souhaitez-vous vraiment annuler votre commande <strong>{searchedOrder.trackingCode}</strong> ? Aucun livreur ne sera envoyé.
            </p>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Motif d'annulation :
              </label>
              <select
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Changement d’avis">Changement d’avis</option>
                <option value="Délai de livraison trop long">Délai de livraison trop long</option>
                <option value="Erreur lors de la sélection des articles">Erreur lors de la sélection des articles</option>
                <option value="Indisponibilité géographique">Indisponibilité géographique</option>
                <option value="Autre raison personnelle">Autre raison personnelle</option>
              </select>
            </div>
            {cancelError && (
              <p className="text-xs text-rose-600 font-semibold">{cancelError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
              >
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Bon De Commande Modal */}
      {searchedOrder && (
        <BonDeCommandeModal
          order={searchedOrder}
          isOpen={showBonModal}
          onClose={() => setShowBonModal(false)}
        />
      )}

      {/* Official Payment Receipt Modal */}
      {searchedOrder && (
        <PaymentReceiptModal
          order={searchedOrder}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};
