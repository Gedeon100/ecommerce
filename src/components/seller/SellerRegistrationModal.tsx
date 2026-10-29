import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { Store, User } from '../../types';
import { X, Store as StoreIcon, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface SellerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistrationSuccess: (user: User, store: Store) => void;
}

export const SellerRegistrationModal: React.FC<SellerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistrationSuccess,
}) => {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('+229 ');
  const [phone, setPhone] = useState('+229 ');
  const [sameAsWhatsapp, setSameAsWhatsapp] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [storeCity, setStoreCity] = useState('Cotonou');
  const [storeCategory, setStoreCategory] = useState('Mode & Vêtements');
  const [storeDescription, setStoreDescription] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!lastName.trim() || !firstName.trim() || !email.trim() || !whatsapp.trim() || !storeName.trim() || !storeDescription.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const effectivePhone = sameAsWhatsapp ? whatsapp.trim() : phone.trim();

    setIsSubmitting(true);
    try {
      const { user, store } = storageService.registerSeller({
        name: `${firstName.trim()} ${lastName.trim().toUpperCase()}`,
        email: email.trim(),
        phone: effectivePhone,
        whatsapp: whatsapp.trim(),
        storeName: storeName.trim(),
        storeCity,
        storeCategory,
        storeDescription: storeDescription.trim(),
      });

      setIsSubmitting(false);
      onRegistrationSuccess(user, store);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg("Erreur lors de la création de l'espace vendeur.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-amber-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ouvrir ma boutique sur BéninMarket
              </h2>
              <span className="text-[11px] text-slate-500">
                Inscription vendeur · Vente avec paiement à la livraison
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Votre boutique indépendante clé en main</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Vous obtenez immédiatement votre lien unique <code>/boutique/votre-nom</code>, votre tableau de bord des commandes et la possibilité de publier vos produits physiques avec photos et vidéos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom de famille (du vendeur) *</label>
              <input
                type="text"
                required
                placeholder="Ex: DOSSOU"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prénom *</label>
              <input
                type="text"
                required
                placeholder="Ex: Aurelle"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Direct WhatsApp Contact */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Numéro WhatsApp direct de la boutique *
              </label>
              <input
                type="tel"
                required
                placeholder="+229 97 00 00 00"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-slate-900"
              />
              <span className="text-[11px] text-emerald-800 block mt-1">
                Ce numéro WhatsApp sera transmis à vos acheteurs sur leur reçu de commande afin qu'ils puissent vous contacter directement si leur colis tarde.
              </span>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsWhatsapp}
                  onChange={(e) => setSameAsWhatsapp(e.target.checked)}
                  className="accent-amber-600 rounded"
                />
                <span className="font-medium text-slate-700 text-xs">
                  Le numéro d'appel est identique au numéro WhatsApp
                </span>
              </label>

              {!sameAsWhatsapp && (
                <div className="mt-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Numéro de téléphone pour appels vocaux *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+229 95 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adresse e-mail pro *</label>
              <input
                type="email"
                required
                placeholder="contact@maboutique.bj"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mot de passe de gestion *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-900 block mb-2">Informations sur la Boutique</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom commercial de la boutique *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Danxomè Confection"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ville principale d'expédition *</label>
                <select
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Cotonou">Cotonou</option>
                  <option value="Abomey-Calavi">Abomey-Calavi</option>
                  <option value="Porto-Novo">Porto-Novo</option>
                  <option value="Parakou">Parakou</option>
                  <option value="Ouidah">Ouidah</option>
                  <option value="Bohicon">Bohicon</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="block font-semibold text-slate-700 mb-1">Catégorie principale de vos articles *</label>
              <select
                value={storeCategory}
                onChange={(e) => setStoreCategory(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Mode & Vêtements">Mode & Vêtements</option>
                <option value="Chaussures & Maroquinerie">Chaussures & Maroquinerie</option>
                <option value="Téléphones & Électronique">Téléphones & Électronique</option>
                <option value="Maison & Décoration">Maison & Décoration</option>
                <option value="Beauté, Karité & Cosmétiques">Beauté, Karité & Cosmétiques</option>
                <option value="Alimentation & Produits Locaux">Alimentation & Produits Locaux</option>
                <option value="Équipements & Accessoires">Équipements & Accessoires</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Présentation de votre boutique & engagements qualité *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Décrivez vos produits physiques, l'origine de vos matières, votre rapidité de livraison..."
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>{isSubmitting ? 'Création en cours...' : 'Créer ma boutique'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
