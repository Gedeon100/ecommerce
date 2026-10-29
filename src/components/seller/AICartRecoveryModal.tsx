import React, { useState, useEffect } from 'react';
import { AbandonedCart, AICartRecoveryResponse } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import {
  Sparkles,
  X,
  Share2,
  Mail,
  Check,
  Copy,
  Loader2,
  Gift,
  Truck,
  Percent,
  Clock,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface AICartRecoveryModalProps {
  cart: AbandonedCart | null;
  storeName: string;
  isOpen: boolean;
  onClose: () => void;
  onRecoverySent?: (cartId: string, channel: 'whatsapp' | 'email', message: string) => void;
}

export const AICartRecoveryModal: React.FC<AICartRecoveryModalProps> = ({
  cart,
  storeName,
  isOpen,
  onClose,
  onRecoverySent,
}) => {
  const [incentive, setIncentive] = useState<'limited_stock' | 'free_delivery' | 'small_discount' | 'gift'>('limited_stock');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<AICartRecoveryResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cart) {
      handleGenerate();
    }
  }, [isOpen, cart, incentive]);

  if (!isOpen || !cart) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setDispatchedSuccess(null);

    try {
      const response = await fetch('/api/ai/abandoned-cart-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: cart.customerName,
          storeName,
          items: cart.items,
          totalAmount: cart.totalAmount,
          city: cart.customerCity,
          incentive,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setGeneratedData(resData.data);
      }
    } catch (err) {
      console.warn('Failed to fetch AI cart recovery, fallback generated:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanPhone = (cart.customerPhone || '').replace(/[^\d+]/g, '');
  const encodedText = encodeURIComponent(generatedData?.whatsappMessage || '');
  const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedText}`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendWhatsApp = () => {
    if (onRecoverySent && generatedData) {
      onRecoverySent(cart.id, 'whatsapp', generatedData.whatsappMessage);
    }
    setDispatchedSuccess('whatsapp');
    window.open(whatsappUrl, '_blank');
  };

  const handleSendEmail = () => {
    if (onRecoverySent && generatedData) {
      onRecoverySent(cart.id, 'email', generatedData.emailBody);
    }
    setDispatchedSuccess('email');
    setTimeout(() => {
      setDispatchedSuccess(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Relance IA de Panier Abandonné</h2>
              <p className="text-xs text-amber-100">
                Message personnalisé prêt à envoyer sur WhatsApp ou par Email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Customer Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">{cart.customerName}</span>
              <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                {formatFCFA(cart.totalAmount)}
              </span>
            </div>
            <div className="text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              {cart.customerPhone && <span>📱 Tél : <strong>{cart.customerPhone}</strong></span>}
              {cart.customerEmail && <span>✉️ Email : <strong>{cart.customerEmail}</strong></span>}
              {cart.customerCity && <span>📍 {cart.customerCity}</span>}
            </div>
            <div className="text-slate-600 pt-1 border-t border-slate-200/70">
              <strong>Articles abandonnés :</strong>{' '}
              {cart.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
            </div>
          </div>

          {/* Incentive Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Stratégie & Incitation de l'IA :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setIncentive('limited_stock')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex flex-col gap-1 cursor-pointer transition-all ${
                  incentive === 'limited_stock'
                    ? 'bg-amber-500/10 border-amber-600 text-amber-950 ring-1 ring-amber-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-bold text-[11px]">Stock Limité</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Urgence douce</span>
              </button>

              <button
                type="button"
                onClick={() => setIncentive('free_delivery')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex flex-col gap-1 cursor-pointer transition-all ${
                  incentive === 'free_delivery'
                    ? 'bg-emerald-500/10 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <Truck className="w-3.5 h-3.5" />
                  <span className="font-bold text-[11px]">Livraison Gratuite</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Frais offerts</span>
              </button>

              <button
                type="button"
                onClick={() => setIncentive('small_discount')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex flex-col gap-1 cursor-pointer transition-all ${
                  incentive === 'small_discount'
                    ? 'bg-purple-500/10 border-purple-600 text-purple-950 ring-1 ring-purple-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-purple-600">
                  <Percent className="w-3.5 h-3.5" />
                  <span className="font-bold text-[11px]">Promo 10%</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Code BENIN10</span>
              </button>

              <button
                type="button"
                onClick={() => setIncentive('gift')}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex flex-col gap-1 cursor-pointer transition-all ${
                  incentive === 'gift'
                    ? 'bg-blue-500/10 border-blue-600 text-blue-950 ring-1 ring-blue-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-blue-600">
                  <Gift className="w-3.5 h-3.5" />
                  <span className="font-bold text-[11px]">Cadeau Offert</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Surprise colis</span>
              </button>
            </div>
          </div>

          {/* Dispatched Notification Status */}
          {dispatchedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {dispatchedSuccess === 'whatsapp'
                  ? 'Redirection vers WhatsApp effectuée et relance enregistrée !'
                  : `Email de relance officiel expédié à ${cart.customerEmail} !`}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">L'IA rédige votre message de relance personnalisé...</p>
            </div>
          ) : generatedData ? (
            <div className="space-y-4">
              {/* WhatsApp Version */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Message WhatsApp (Canal n°1 au Bénin)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(generatedData.whatsappMessage, 'wa')}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'wa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'wa' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {generatedData.whatsappMessage}
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSendWhatsApp}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Envoyer sur WhatsApp ({cart.customerPhone || 'Client'})</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Email Version */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>Version Email</span>
                  </span>
                  <button
                    onClick={() => handleCopy(generatedData.emailBody, 'email')}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'email' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-slate-900">
                    <span className="text-slate-500 font-normal">Objet : </span>
                    {generatedData.emailSubject}
                  </div>
                  <div className="text-slate-700 whitespace-pre-line pt-2 border-t border-slate-200">
                    {generatedData.emailBody}
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSendEmail}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Transmettre par Email</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Relances effectuées pour ce panier : <strong>{cart.recoveryAttemptsCount || 0}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
