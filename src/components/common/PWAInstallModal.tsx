import React from 'react';
import { Share, PlusSquare, Smartphone, CheckCircle2, X, Download, ShieldCheck, Zap } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  onDirectInstall?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isAndroid,
  onDirectInstall
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-2">
              <img src="/icon.svg" alt="BéninMarket Icon" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Application Mobile
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Gratuit
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">Installer BéninMarket</h3>
            <p className="text-xs text-slate-400">Pour iPhone, iPad et tous smartphones Android</p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-slate-800/50 rounded-2xl border border-slate-800 text-center">
          <div className="p-2">
            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Accès Rapide</div>
            <div className="text-[10px] text-slate-400">1 clic écran accueil</div>
          </div>
          <div className="p-2 border-x border-slate-700/50">
            <Smartphone className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Plein Écran</div>
            <div className="text-[10px] text-slate-400">Sans barre URL</div>
          </div>
          <div className="p-2">
            <ShieldCheck className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">0 Mémoire</div>
            <div className="text-[10px] text-slate-400">Léger & fluide</div>
          </div>
        </div>

        {/* Platform Specific Step Instructions */}
        {isIOS ? (
          <div className="space-y-4 mb-6">
            <div className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Guide d'installation sur iPhone / iPad :
            </div>
            
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div className="leading-relaxed text-xs">
                  Dans Safari au bas de votre écran, touchez le bouton <strong>Partager</strong>{' '}
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-800 rounded border border-slate-700 text-blue-400 align-middle ml-1">
                    <Share className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div className="leading-relaxed text-xs">
                  Faites défiler le menu vers le bas et sélectionnez{' '}
                  <strong className="text-white">« Sur l'écran d'accueil »</strong>{' '}
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-800 rounded border border-slate-700 text-white align-middle ml-1">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div className="leading-relaxed text-xs">
                  Touchez <strong className="text-amber-400">Ajouter</strong> en haut à droite. L'icône BéninMarket apparaît instantanément sur votre téléphone !
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Installation instantanée sur Android :
            </div>

            {onDirectInstall && (
              <button
                onClick={() => {
                  onDirectInstall();
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-white shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
              >
                <Download className="w-5 h-5" /> Installer l'application maintenant
              </button>
            )}

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">Alternative manuelle Chrome Android :</p>
              <p>1. Cliquez sur le menu <strong>⋮ (trois points)</strong> en haut à droite.</p>
              <p>2. Cliquez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Compatible iPhone (iOS 11.3+) & Android (Chrome, Samsung Internet)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
