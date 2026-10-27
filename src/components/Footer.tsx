import React from 'react';
import { ShieldCheck, Truck, Phone, Mail, MapPin, Store as StoreIcon, Heart, Lock } from 'lucide-react';

interface FooterProps {
  onOpenSellerModal: () => void;
  onOpenTrack: () => void;
  onNavigateHome: () => void;
  onOpenFounderModal?: () => void;
  onOpenCustomerService?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenSellerModal,
  onOpenTrack,
  onNavigateHome,
  onOpenFounderModal,
  onOpenCustomerService,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      {/* 3 Pillars of Confidence (COD African market focus) */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                Paiement 100% à la Livraison (COD)
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Aucun paiement préalable par carte bancaire. Vous inspectez votre colis et réglez le coursier en espèces chez vous.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                Livraison à Domicile au Bénin
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Cotonou, Calavi, Porto-Novo, Parakou, Ouidah, Bohicon... Nos livreurs partenaires acheminent vos colis sous 24h à 72h.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                Créateurs & Commerçants Locaux
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Des entrepreneurs vérifiés proposant des produits physiques authentiques : mode africaine, artisanat, cosmétiques et électronique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <button
            onClick={onNavigateHome}
            className="text-lg font-bold tracking-tight text-white mb-3 inline-block cursor-pointer"
          >
            <span className="text-amber-500">Bénin</span>
            <span>Market</span>
          </button>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            La marketplace e-commerce moderne conçue pour les entrepreneurs et acheteurs au Bénin.
          </p>
          <div className="space-y-1 text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              <span>Assistance client : +229 97 00 11 22</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span>kgmservices229@gmail.com</span>
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
              <span>Écrire au responsable du site</span>
            </button>
          )}
        </div>

        <div>
          <h5 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">
            Acheter en confiance
          </h5>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button onClick={onOpenTrack} className="hover:text-amber-400 transition-colors cursor-pointer">
                Suivre ou annuler ma commande
              </button>
            </li>
            {onOpenCustomerService && (
              <li>
                <button onClick={onOpenCustomerService} className="hover:text-amber-400 transition-colors cursor-pointer text-amber-400">
                  Service Clientèle (kgmservices229@gmail.com)
                </button>
              </li>
            )}
            <li>
              <button onClick={onNavigateHome} className="hover:text-amber-400 transition-colors cursor-pointer">
                Catalogue complet & Promotions
              </button>
            </li>
            <li>
              <span className="text-slate-500">Conditions de paiement à la livraison</span>
            </li>
            <li>
              <span className="text-slate-500">Politique de retour et réclamations</span>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">
            Espace Vendeurs
          </h5>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                onClick={onOpenSellerModal}
                className="text-amber-400 hover:text-amber-300 font-semibold"
              >
                Ouvrir ma boutique gratuite
              </button>
            </li>
            <li>
              <span className="text-slate-500">Guide de gestion du stock</span>
            </li>
            <li>
              <span className="text-slate-500">Règlement des encaissements COD</span>
            </li>
            <li>
              <span className="text-slate-500">Chartes des produits autorisés</span>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">
            Rejoignez la Marketplace
          </h5>
          <p className="text-slate-400 text-xs mb-3">
            Vous vendez des produits physiques au Bénin ? Multipliez vos commandes sans frais d'installation.
          </p>
          <button
            onClick={onOpenSellerModal}
            className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm text-center"
          >
            Créer un compte vendeur
          </button>
        </div>
      </div>

      {/* Copyright with Discreet Founder Lock */}
      <div className="border-t border-slate-800 py-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px]">
        <p>
          © 2026 BéninMarket. Plateforme e-commerce multivendeurs dédiée au marché béninois et ouest-africain. Paiement à la livraison exclusif.
        </p>
        {onOpenFounderModal && (
          <button
            onClick={onOpenFounderModal}
            className="text-slate-700 hover:text-slate-400 p-1 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
            title="Administration & Base de données"
            aria-label="Portail Privé"
          >
            <Lock className="w-3 h-3 text-slate-700 hover:text-slate-400" />
            <span className="text-[10px] text-slate-600 hover:text-slate-400">Accès Fondateur</span>
          </button>
        )}
      </div>
    </footer>
  );
};
