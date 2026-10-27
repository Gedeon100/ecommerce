import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { User } from '../../types';
import { ShieldCheck, Lock, Key, X, ArrowRight, AlertTriangle, Database } from 'lucide-react';

interface FounderAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted: (adminUser: User) => void;
}

export const FounderAccessModal: React.FC<FounderAccessModalProps> = ({
  isOpen,
  onClose,
  onAccessGranted,
}) => {
  if (!isOpen) return null;

  const [inputEmailOrPin, setInputEmailOrPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const val = inputEmailOrPin.trim().toLowerCase();

    // Verification: pasteurkazotti@gmail.com OR secret founder PIN '2026' OR 'kazotti'
    if (val === 'pasteurkazotti@gmail.com' || val === 'pasteurkazotti' || val === '2026' || val === 'kazotti') {
      setIsSubmitting(true);
      const users = storageService.getUsers();
      let adminUser = users.find((u) => u.email === 'pasteurkazotti@gmail.com' || u.role === 'admin');

      if (!adminUser) {
        adminUser = {
          id: 'user-admin',
          name: 'Pasteur Kazotti (Fondateur & Super Admin)',
          email: 'pasteurkazotti@gmail.com',
          phone: '+229 97 00 11 22',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
      } else {
        adminUser.email = 'pasteurkazotti@gmail.com';
        adminUser.name = 'Pasteur Kazotti (Fondateur & Super Admin)';
        adminUser.role = 'admin';
      }

      storageService.setCurrentUser(adminUser);
      setIsSubmitting(false);
      onAccessGranted(adminUser);
      onClose();
    } else {
      setErrorMsg("Accès refusé. Cette porte est strictement réservée au fondateur Pasteur Kazotti.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Accès Privé Fondateur & BDD
              </h3>
              <p className="text-[11px] text-slate-400">
                Supervision Maître & Base de données
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contrôle Maître de BéninMarket</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cet espace administrateur est <strong>invisible au grand public</strong>. Seul le fondateur Pasteur Kazotti a accès aux commandes de toutes les boutiques, aux marges COD et à l'export brut de la base de données.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Identifiant Fondateur (E-mail ou Code d'Accès) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="pasteurkazotti@gmail.com ou Code PIN"
                value={inputEmailOrPin}
                onChange={(e) => setInputEmailOrPin(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              />
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Indice sécurisé : Saisissez votre e-mail <strong>pasteurkazotti@gmail.com</strong> ou votre code PIN maître (<strong>2026</strong>).
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white font-medium"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <span>{isSubmitting ? 'Vérification...' : 'Déverrouiller la BDD'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
