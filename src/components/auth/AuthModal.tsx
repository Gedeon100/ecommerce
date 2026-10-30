import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { User, Store } from '../../types';
import {
  X,
  User as UserIcon,
  Store as StoreIcon,
  ShoppingBag,
  Lock,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Key,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register_buyer' | 'register_seller';
  authPromptReason?: string;
  onAuthSuccess: (user: User, store?: Store) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  authPromptReason,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register_buyer' | 'register_seller'>(initialMode);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Buyer Registration fields
  const [buyerLastName, setBuyerLastName] = useState('');
  const [buyerFirstName, setBuyerFirstName] = useState('');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('+229 ');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');

  // Seller Registration fields
  const [sellerLastName, setSellerLastName] = useState('');
  const [sellerFirstName, setSellerFirstName] = useState('');
  const [sellerWhatsapp, setSellerWhatsapp] = useState('+229 ');
  const [sellerPhone, setSellerPhone] = useState('+229 ');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [sellerStoreName, setSellerStoreName] = useState('');
  const [sellerCity, setSellerCity] = useState('Cotonou');
  const [sellerCategory, setSellerCategory] = useState('Mode & Vêtements');
  const [sellerDesc, setSellerDesc] = useState('');

  // Sync mode with initialMode whenever modal opens or initialMode changes
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginIdentifier.trim()) {
      setErrorMsg('Veuillez entrer votre e-mail ou votre numéro WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    const res = storageService.loginUser(loginIdentifier.trim(), loginPassword.trim());
    setIsSubmitting(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
      onClose();
    } else {
      setErrorMsg(res.error || 'Identifiant ou mot de passe incorrect.');
    }
  };

  const handleRegisterBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!buyerLastName.trim() || !buyerFirstName.trim() || !buyerWhatsapp.trim() || !buyerEmail.trim() || !buyerPassword.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = storageService.registerBuyer({
        firstName: buyerFirstName.trim(),
        lastName: buyerLastName.trim(),
        phone: buyerWhatsapp.trim(),
        whatsapp: buyerWhatsapp.trim(),
        email: buyerEmail.trim(),
        password: buyerPassword.trim(),
      });
      setIsSubmitting(false);
      onAuthSuccess(newUser);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg("Erreur lors de la création du compte acheteur.");
    }
  };

  const handleRegisterSeller = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (
      !sellerLastName.trim() ||
      !sellerFirstName.trim() ||
      !sellerWhatsapp.trim() ||
      !sellerEmail.trim() ||
      !sellerPassword.trim() ||
      !sellerStoreName.trim()
    ) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires pour votre boutique.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { user, store } = storageService.registerSeller({
        firstName: sellerFirstName.trim(),
        lastName: sellerLastName.trim(),
        phone: sellerPhone.trim() || sellerWhatsapp.trim(),
        whatsapp: sellerWhatsapp.trim(),
        email: sellerEmail.trim(),
        password: sellerPassword.trim(),
        storeName: sellerStoreName.trim(),
        storeCity: sellerCity,
        storeCategory: sellerCategory,
        storeDescription: sellerDesc.trim() || `Boutique officielle ${sellerStoreName.trim()} sur BéninMarket.`,
      });
      setIsSubmitting(false);
      onAuthSuccess(user, store);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg("Erreur lors de l'enregistrement de l'espace vendeur.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
                alt="Logo BéninMarket"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {mode === 'login' && 'Connexion à votre espace'}
                {mode === 'register_buyer' && 'Inscription Espace Acheteur'}
                {mode === 'register_seller' && 'Créer ma boutique Vendeur'}
              </h2>
              <p className="text-[11px] text-slate-300">
                Paiement 100% à la livraison au Bénin · Espaces distincts sécurisés
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Alibaba pattern) */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100 text-[11px] sm:text-xs font-semibold p-1 gap-0.5">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer truncate ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Connexion
          </button>

          <button
            onClick={() => {
              setMode('register_buyer');
              setErrorMsg('');
            }}
            className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
              mode === 'register_buyer'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Créer Acheteur</span>
          </button>

          <button
            onClick={() => {
              setMode('register_seller');
              setErrorMsg('');
            }}
            className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
              mode === 'register_seller'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <StoreIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Créer Boutique</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-4 text-xs">
          {authPromptReason && (
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-950 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <strong className="block text-slate-900 font-bold mb-0.5 text-xs">
                  Inscription Acheteur requise pour commander
                </strong>
                <p className="text-amber-900 leading-relaxed text-[11px]">
                  {authPromptReason}
                </p>
                <div className="mt-2 pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Vous avez déjà un compte ?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'register_buyer' : 'login');
                      setErrorMsg('');
                    }}
                    className="font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    {mode === 'login' ? "Créer un nouveau compte Acheteur" : "Se connecter plutôt"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                Connectez-vous pour accéder directement à votre interface dédiée : l'acheteur retrouve ses commandes et adresses, le vendeur gère son catalogue et ses clients.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail ou Numéro WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: aurelle@danxome.bj ou +229 96 45 88 10"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>{isSubmitting ? 'Connexion en cours...' : 'Se connecter à mon compte'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: BUYER REGISTRATION */}
          {mode === 'register_buyer' && (
            <form onSubmit={handleRegisterBuyer} className="space-y-3.5">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-950 text-xs">
                <strong>Espace Acheteur :</strong> Créez votre compte pour commander facilement vos articles préférés sans carte bancaire, suivre vos colis et gérer vos adresses de livraison au Bénin.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Noms (Nom de famille) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MENSAH"
                    value={buyerLastName}
                    onChange={(e) => setBuyerLastName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prénoms *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Brice"
                    value={buyerFirstName}
                    onChange={(e) => setBuyerFirstName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Numéro de téléphone WhatsApp (de préférence) *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+229 97 00 11 22"
                  value={buyerWhatsapp}
                  onChange={(e) => setBuyerWhatsapp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Indispensable pour coordonner la remise du colis avec le livreur en espèces.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adresse e-mail *
                </label>
                <input
                  type="email"
                  required
                  placeholder="votre.email@gmail.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mot de passe de connexion *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 4 caractères"
                  value={buyerPassword}
                  onChange={(e) => setBuyerPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer mt-2"
              >
                <span>{isSubmitting ? 'Création...' : 'Valider mon inscription Acheteur'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: SELLER REGISTRATION */}
          {mode === 'register_seller' && (
            <form onSubmit={handleRegisterSeller} className="space-y-3.5">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Espace Vendeur Indépendant Clé en Main</span>
                </div>
                <p className="text-[11px] text-amber-900">
                  Comme sur Alibaba, votre espace vendeur vous donne accès exclusif à votre propre catalogue, vos stocks et aux clients qui commandent vos articles physiques avec paiement à la livraison.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Noms (du gérant) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DOSSOU"
                    value={sellerLastName}
                    onChange={(e) => setSellerLastName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prénoms *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aurelle"
                    value={sellerFirstName}
                    onChange={(e) => setSellerFirstName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom commercial de la boutique *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Danxomè Confection"
                  value={sellerStoreName}
                  onChange={(e) => setSellerStoreName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>N° WhatsApp direct *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+229 97 00 11 22"
                    value={sellerWhatsapp}
                    onChange={(e) => setSellerWhatsapp(e.target.value)}
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl font-bold text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ville principale au Bénin *
                  </label>
                  <select
                    value={sellerCity}
                    onChange={(e) => setSellerCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="Cotonou">Cotonou</option>
                    <option value="Abomey-Calavi">Abomey-Calavi</option>
                    <option value="Porto-Novo">Porto-Novo</option>
                    <option value="Parakou">Parakou</option>
                    <option value="Ouidah">Ouidah</option>
                    <option value="Bohicon">Bohicon</option>
                    <option value="Natitingou">Natitingou</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Adresse e-mail professionnelle *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@maboutique.bj"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={sellerPassword}
                    onChange={(e) => setSellerPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catégorie principale de vos articles *
                </label>
                <select
                  value={sellerCategory}
                  onChange={(e) => setSellerCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer mt-2"
              >
                <span>{isSubmitting ? 'Création de la boutique...' : 'Créer ma boutique Vendeur'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
