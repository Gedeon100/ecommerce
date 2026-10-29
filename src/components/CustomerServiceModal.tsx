import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { Mail, MessageCircle, Phone, X, Send, CheckCircle2, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

interface CustomerServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  initialOrderId?: string;
}

export const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialOrderId = '',
}) => {
  const [lastName, setLastName] = useState(currentUser?.lastName || (currentUser?.name ? currentUser.name.split(' ').slice(1).join(' ') : ''));
  const [firstName, setFirstName] = useState(currentUser?.firstName || (currentUser?.name ? currentUser.name.split(' ')[0] : ''));
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || currentUser?.phone || '+229 ');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | 'visitor'>(
    currentUser?.role === 'seller' ? 'seller' : 'buyer'
  );
  const [subjectCategory, setSubjectCategory] = useState('Réclamation sur une commande');
  const [orderReference, setOrderReference] = useState(initialOrderId);
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  if (!isOpen) return null;

  const targetEmail = 'kgmservices229@gmail.com';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim() || !whatsapp.trim() || !email.trim() || !message.trim()) {
      return;
    }

    const fullSubject = orderReference.trim()
      ? `[BéninMarket Support] ${subjectCategory} - Commande ${orderReference.trim()}`
      : `[BéninMarket Support] ${subjectCategory}`;

    const detailedMessage = `
Expéditeur : ${firstName.trim()} ${lastName.trim().toUpperCase()}
Rôle : ${userRole === 'buyer' ? 'Acheteur / Client' : userRole === 'seller' ? 'Vendeur / Marchand' : 'Visiteur'}
Numéro WhatsApp : ${whatsapp.trim()}
Email : ${email.trim()}
${orderReference.trim() ? `Référence commande : ${orderReference.trim()}` : ''}
Motif : ${subjectCategory}

Message :
${message.trim()}
    `.trim();

    // Save ticket in local storage database
    const newTicket = storageService.createSupportTicket({
      senderName: `${firstName.trim()} ${lastName.trim().toUpperCase()}`,
      senderPhone: whatsapp.trim(),
      senderEmail: email.trim(),
      userType: userRole,
      subject: fullSubject,
      message: detailedMessage,
    });

    setTicketId(newTicket.id);
    setIsSubmitted(true);
  };

  const getMailtoUrl = () => {
    const subject = encodeURIComponent(
      orderReference.trim()
        ? `[BéninMarket Support] ${subjectCategory} - ${orderReference.trim()}`
        : `[BéninMarket Support] ${subjectCategory}`
    );
    const body = encodeURIComponent(`Bonjour Responsable BéninMarket (kgmservices229@gmail.com),

Nom : ${lastName.toUpperCase()}
Prénom : ${firstName}
Téléphone WhatsApp : ${whatsapp}
Email : ${email}
${orderReference ? `Numéro de commande : ${orderReference}\n` : ''}
Message :
${message}
    `);
    return `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  };

  const cleanWhatsappNumber = (phone: string) => {
    return phone.replace(/[^0-9]/g, '');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Service Clientèle & Contact Responsable
              </h2>
              <p className="text-[11px] text-slate-300">
                Direction du site : <strong className="text-amber-400 font-semibold">{targetEmail}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-5 text-xs">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Message envoyé avec succès au responsable !
              </h3>
              <p className="text-slate-600 max-w-md mx-auto leading-relaxed text-xs">
                Votre requête a été transmise à l'adresse officielle de la direction{' '}
                <strong className="text-slate-900 font-bold">{targetEmail}</strong> sous le numéro de ticket{' '}
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {ticketId}
                </span>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left max-w-md mx-auto space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Prise en charge prioritaire</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Notre équipe examine chaque message et vous répondra directement par e-mail ou par message WhatsApp au{' '}
                <strong>{whatsapp}</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={getMailtoUrl()}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Ouvrir dans mon application mail</span>
              </a>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Retourner sur le site
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
            {/* Notice */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Espace réclamations et assistance :</strong> Pour toute question sur un vendeur, un problème de livraison Cash on Delivery, ou pour contacter le responsable de BéninMarket, remplissez ce formulaire. Votre message sera envoyé directement à <strong>{targetEmail}</strong>.
              </div>
            </div>

            {/* User Type */}
            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 px-2">Vous êtes :</span>
              <button
                type="button"
                onClick={() => setUserRole('buyer')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  userRole === 'buyer'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Acheteur / Client
              </button>
              <button
                type="button"
                onClick={() => setUserRole('seller')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  userRole === 'seller'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vendeur / Marchand
              </button>
              <button
                type="button"
                onClick={() => setUserRole('visitor')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  userRole === 'visitor'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Autre
              </button>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom de famille *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MENSAH"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 uppercase font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Brice"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Numéro WhatsApp de contact *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+229 97 00 11 22"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Adresse e-mail pour la réponse *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Subject and optional order reference */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Objet du message *
                </label>
                <select
                  value={subjectCategory}
                  onChange={(e) => setSubjectCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Réclamation sur une commande">Réclamation sur une commande</option>
                  <option value="Problème de livraison / Retard livreur">Problème de livraison / Retard coursier</option>
                  <option value="Signalement vendeur ou produit non conforme">Signalement vendeur ou produit non conforme</option>
                  <option value="Question vendeur / Gestion boutique">Question vendeur / Gestion de boutique</option>
                  <option value="Demande générale de renseignements">Demande générale de renseignements</option>
                  <option value="Autre demande au responsable">Autre demande au responsable</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  N° Commande (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: BM-2026-8942"
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Detailed Message */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Détail de votre message au responsable *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Expliquez clairement votre situation avec le maximum de détails pour que le responsable puisse vous répondre rapidement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 leading-relaxed font-normal"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400">
                Destinataire : <strong>{targetEmail}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer au responsable</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
