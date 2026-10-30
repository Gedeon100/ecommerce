import React from 'react';
import {
  Share,
  PlusSquare,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  Download,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop?: boolean;
  isInIframe?: boolean;
  hasNativePrompt?: boolean;
  onDirectInstall?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isAndroid,
  isDesktop = false,
  isInIframe = false,
  hasNativePrompt = false,
  onDirectInstall,
}) => {
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-amber-400 to-red-500 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1">
              <img
                src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
                alt="Logo BéninMarket"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Téléphone & Ordinateur
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Gratuit
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">Installer l’App BéninMarket</h3>
            <p className="text-xs text-slate-400">
              Application directe sur Android, iPhone, Windows et Mac
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-slate-800/50 rounded-2xl border border-slate-800 text-center">
          <div className="p-2">
            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Accès Direct</div>
            <div className="text-[10px] text-slate-400">Icône Bureau / Écran</div>
          </div>
          <div className="p-2 border-x border-slate-700/50">
            <Monitor className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Mobile & PC</div>
            <div className="text-[10px] text-slate-400">Fenêtre dédiée</div>
          </div>
          <div className="p-2">
            <ShieldCheck className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Ultra Léger</div>
            <div className="text-[10px] text-slate-400">Hors-ligne inclus</div>
          </div>
        </div>

        {/* Direct 1-Click Install Button when prompt is available */}
        {hasNativePrompt && onDirectInstall && (
          <div className="mb-5">
            <button
              onClick={() => {
                onDirectInstall();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Installer l’application maintenant (1 clic)</span>
            </button>
          </div>
        )}

        {/* If inside an embedded preview iframe, provide 1-click full tab launcher so Chrome/Edge immediately triggers OS install */}
        {isInIframe && !hasNativePrompt && (
          <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2.5">
            <p className="text-xs text-amber-200 leading-relaxed">
              💡 Pour lancer l’installation directe sur votre <strong>ordinateur</strong> ou <strong>téléphone</strong>, ouvrez l’application dans un onglet complet puis cliquez sur <strong>Installer</strong> :
            </p>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ouvrir et Installer directement sur mon appareil</span>
            </a>
          </div>
        )}

        {/* Platform Specific Instructions */}
        {isIOS ? (
          <div className="space-y-3 mb-6">
            <div className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Sur iPhone / iPad (Safari) :
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">1</span>
                <div>
                  Appuyez sur le bouton <strong>Partager</strong>{' '}
                  <Share className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" /> dans la barre Safari.
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">2</span>
                <div>
                  Choisissez <strong className="text-white">« Sur l’écran d’accueil »</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-white mx-0.5" /> puis touchez <strong className="text-amber-400">Ajouter</strong>.
                </div>
              </div>
            </div>
          </div>
        ) : isDesktop ? (
          <div className="space-y-3 mb-6">
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Sur Ordinateur (Windows, Mac, Chrome, Edge) :
            </div>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2">
              <p>
                1. Cliquez sur l’icône d’installation <strong>⊕ / 📲</strong> située à droite dans la barre d’adresse de votre navigateur (Chrome, Edge ou Brave).
              </p>
              <p>
                2. Ou ouvrez le menu <strong>⋮</strong> en haut à droite → <strong>« Cast, enregistrer et partager »</strong> → <strong>« Installer la page en tant qu’application »</strong>.
              </p>
              <p className="text-emerald-400 font-medium">
                ✓ L’application BéninMarket s’ajoutera directement sur votre Bureau et barre des tâches !
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Sur Smartphone Android (Chrome / Samsung) :
            </div>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
              <p>1. Appuyez sur le menu <strong>⋮ (trois points)</strong> en haut à droite du navigateur.</p>
              <p>2. Appuyez sur <strong>« Installer l’application »</strong> ou <strong>« Ajouter à l’écran d’accueil »</strong>.</p>
              {isAndroid && (
                <p className="text-emerald-400 font-medium pt-1">
                  ✓ L’application s’installe instantanément dans vos applications Android !
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">
            Compatible Android, iPhone/iPad, Windows & macOS
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
