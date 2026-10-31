import React from 'react';
import {
  ShieldCheck,
  Truck,
  Phone,
  Mail,
  MapPin,
  Store as StoreIcon,
  Lock,
  Globe,
  Download,
  Home,
  CheckCircle2,
  Star,
  Users,
} from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../i18n/LanguageContext';
import { User } from '../types';

interface FooterProps {
  currentUser?: User | null;
  onOpenSellerModal: () => void;
  onOpenTrack: () => void;
  onNavigateHome: () => void;
  onOpenFounderModal?: () => void;
  onNavigateAdmin?: () => void;
  onOpenCustomerService?: () => void;
  onOpenPWAInstall?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentUser,
  onOpenSellerModal,
  onOpenTrack,
  onNavigateHome,
  onOpenFounderModal,
  onNavigateAdmin,
  onOpenCustomerService,
  onOpenPWAInstall,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const isOwnerConnected =
    currentUser?.role === 'admin' &&
    currentUser?.email?.toLowerCase() === 'kazottimahutondj@gmail.com';

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      {/* 3 Pillars of Confidence */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">{t('footer.codTitle')}</h4>
              <p className="text-slate-400 leading-relaxed">{t('footer.codDesc')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">{t('footer.deliveryTitle')}</h4>
              <p className="text-slate-400 leading-relaxed">{t('footer.deliveryDesc')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">{t('footer.localTitle')}</h4>
              <p className="text-slate-400 leading-relaxed">{t('footer.localDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <button
            onClick={onNavigateHome}
            className="mb-3 inline-flex items-center gap-3 text-left cursor-pointer group"
          >
            <img
              src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
              alt="BéninMarket — Achetez, Vendez, Gagnez en toute confiance"
              className="w-16 h-16 rounded-2xl object-contain bg-white p-1 shadow-md border border-slate-700 group-hover:scale-105 transition-transform shrink-0"
            />
            <div>
              <div className="text-lg font-extrabold tracking-tight text-white leading-tight">
                <span className="text-emerald-400">Bénin</span>
                <span className="text-amber-400">Market</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Achetez, Vendez, Gagnez en toute confiance
              </span>
            </div>
          </button>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            La marketplace e-commerce multivendeurs nouvelle génération avec paiement 100% à la livraison.
          </p>
          <div className="space-y-1.5 text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <a
                href="mailto:kgmservices229@gmail.com"
                className="hover:text-amber-400 transition-colors"
                title="Écrire directement à kgmservices229@gmail.com"
              >
                kgmservices229@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Cotonou, République du Bénin</span>
            </div>
          </div>
          {onOpenCustomerService && (
            <button
              onClick={onOpenCustomerService}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-medium transition cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Écrire au service client</span>
            </button>
          )}
        </div>

        <div>
          <h5 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">
            Navigation & Application
          </h5>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                onClick={onNavigateHome}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer text-left"
              >
                <span>🛍️ Espace Acheteur (Commandes COD)</span>
              </button>
            </li>
            <li>
              <button
                onClick={onOpenSellerModal}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer text-left"
              >
                <span>🏪 Espace Vendeur (Ouvrir ma Boutique)</span>
              </button>
            </li>
            {onOpenPWAInstall && (
              <li>
                <button
                  onClick={onOpenPWAInstall}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Installer l’App (Téléphone & Ordinateur)</span>
                </button>
              </li>
            )}
            <li>
              <button onClick={onOpenTrack} className="hover:text-amber-400 transition-colors cursor-pointer">
                {t('nav.track')}
              </button>
            </li>
            {onOpenCustomerService && (
              <li>
                <button
                  onClick={onOpenCustomerService}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-amber-400"
                >
                  Service Clientèle
                </button>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">
            {t('nav.sellerSpace')}
          </h5>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                onClick={onOpenSellerModal}
                className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                Ouvrir ma boutique gratuite
              </button>
            </li>
            <li>
              <span className="text-slate-500">IA Rédaction & Images Page de Vente</span>
            </li>
            <li>
              <span className="text-slate-500">Gestion des commandes Cash on Delivery</span>
            </li>
            <li>
              <span className="text-slate-500">Relance IA des paniers abandonnés</span>
            </li>
          </ul>
        </div>

        {/* 10 Languages Quick Switcher in Footer */}
        <div>
          <h5 className="font-bold text-white mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>10 Langues Disponibles</span>
          </h5>
          <div className="grid grid-cols-2 gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code as LanguageCode)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border text-left ${
                  language === lang.code
                    ? 'bg-amber-600 border-amber-500 text-white font-bold'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{lang.flag}</span>
                <span className="truncate">{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DEDICATED OWNER ADMINISTRATOR RUBRIC IN FOOTER */}
      <div className="border-t border-slate-800 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="font-bold text-white text-xs sm:text-sm">
                  {t('footer.ownerSectionTitle')}
                </h5>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 border border-slate-700">
                  Accès par connexion uniquement
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed max-w-2xl">
                {t('footer.ownerSectionDesc')}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-400" /> Tous les vendeurs
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Commandes validées
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" /> Avis de tous les clients
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {isOwnerConnected ? (
              <button
                type="button"
                onClick={() => (onNavigateAdmin ? onNavigateAdmin() : onOpenFounderModal?.())}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('footer.ownerDashboardBtn')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenFounderModal}
                className="px-4 py-2.5 bg-slate-800 hover:bg-amber-600 text-white border border-slate-700 hover:border-amber-500 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('footer.ownerLoginBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-slate-800/80 py-4 px-4 sm:px-6 text-center sm:text-left text-slate-500 text-[11px] max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          © 2026 BéninMarket — Marketplace Multivendeurs COD. Paiement 100% à la livraison.
        </p>
        <button
          onClick={onNavigateHome}
          className="text-slate-400 hover:text-amber-400 font-semibold inline-flex items-center gap-1 cursor-pointer"
        >
          <Home className="w-3 h-3" />
          <span>{t('nav.home')}</span>
        </button>
      </div>
    </footer>
  );
};
