import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { User } from '../../types';
import { ShieldCheck, Lock, Mail, Key, X, ArrowRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail !== 'kazottimahutondj@gmail.com') {
      setErrorMsg(
        'Adresse e-mail non reconnue. Cet espace est réservé au propriétaire du site.'
      );
      return;
    }

    if (cleanPassword !== 'Samuell@8') {
      setErrorMsg('Mot de passe administrateur incorrect. Vérifiez les majuscules et chiffres.');
      return;
    }

    setIsSubmitting(true);
    const result = storageService.loginUser(cleanEmail, cleanPassword);
    setIsSubmitting(false);

    if (result.success && result.user) {
      setEmail('');
      setPassword('');
      onAccessGranted(result.user);
      onClose();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setErrorMsg(result.error || 'Connexion refusée.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/assets/aistudio/Logo_B_nin_Market_aux_couleurs_du_B_nin__1__cf490afb.png"
                alt="Logo BéninMarket"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Connexion Administrateur — Propriétaire
              </h3>
              <p className="text-[11px] text-slate-400">
                Accès sécurisé réservé au propriétaire de BéninMarket
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-slate-300 space-y-1 leading-relaxed">
            <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Espace Propriétaire Sécurisé</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Connectez-vous pour consulter tous les vendeurs inscrits, les différentes commandes validées et l’ensemble des avis clients de la plateforme.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Adresse E-mail Propriétaire *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoFocus
                autoComplete="username"
                placeholder="Votre adresse e-mail administrateur"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Mot de passe Administrateur *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              />
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                aria-label="Afficher ou masquer le mot de passe"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white font-medium cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <span>{isSubmitting ? 'Connexion...' : 'Se connecter (Admin)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
