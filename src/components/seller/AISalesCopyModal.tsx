import React, { useState } from 'react';
import { AISalesCopyResponse } from '../../types';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Send,
  Loader2,
  FileText,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';

interface AISalesCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
  initialCategory?: string;
  initialPrice?: number;
  initialBenefits?: string;
  storeName?: string;
  onApplyCopy?: (copy: {
    title: string;
    description: string;
    features: string[];
  }) => void;
}

export const AISalesCopyModal: React.FC<AISalesCopyModalProps> = ({
  isOpen,
  onClose,
  initialProductName = '',
  initialCategory = 'Mode & Vêtements',
  initialPrice,
  initialBenefits = '',
  storeName = '',
  onApplyCopy,
}) => {
  const [productName, setProductName] = useState(initialProductName);
  const [category, setCategory] = useState(initialCategory);
  const [price, setPrice] = useState<number | ''>(initialPrice || '');
  const [keyBenefits, setKeyBenefits] = useState(initialBenefits);
  const [targetAudience, setTargetAudience] = useState('Femmes, hommes et familles au Bénin');

  const [isLoading, setIsLoading] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<AISalesCopyResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productName.trim()) {
      setErrorMsg('Veuillez renseigner le nom de votre produit.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setAppliedSuccess(false);

    try {
      const response = await fetch('/api/ai/sales-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category,
          price: price ? Number(price) : undefined,
          keyBenefits,
          targetAudience,
          storeName,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Erreur lors de la génération par IA');
      }

      setGeneratedCopy(resData.data);
    } catch (err: any) {
      console.warn('AI Sales copy fetch failed, fallback applied:', err);
      setErrorMsg('Connexion ralentie. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyToProduct = () => {
    if (!generatedCopy) return;

    if (onApplyCopy) {
      onApplyCopy({
        title: generatedCopy.salesTitle,
        description: `${generatedCopy.hook}\n\n${generatedCopy.persuasiveDescription}\n\n${generatedCopy.codGuaranteeArgument}`,
        features: generatedCopy.bulletPoints,
      });
      setAppliedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Rédacteur de Page de Vente IA</h2>
              <p className="text-xs text-amber-100">
                Générez des titres accrocheurs, arguments chocs et textes vendeurs adaptés au Bénin
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

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Input Form */}
          <form onSubmit={handleGenerate} className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Dites simplement à l'IA ce que vous vendez (même en quelques mots) :</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Montre connectée sport étanche, Robe wax..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catégorie</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Électronique, Mode, Beauté..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Prix de vente (FCFA)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ex: 15000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Points forts ou mots-clés</label>
                <input
                  type="text"
                  value={keyBenefits}
                  onChange={(e) => setKeyBenefits(e.target.value)}
                  placeholder="Ex: étanche, longue autonomie, tissu authentique..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-600 font-semibold">{errorMsg}</div>
            )}

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Spécialement optimisé pour les ventes avec <strong>Paiement à la livraison</strong>.
              </span>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rédaction par l'IA en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{generatedCopy ? 'Régénérer avec l\'IA' : 'Rédiger ma Page de Vente'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Generated Result Output */}
          {generatedCopy && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header result with Apply Button */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Page de vente rédigée avec succès !</span>
                </div>
                {onApplyCopy && (
                  <button
                    onClick={handleApplyToProduct}
                    disabled={appliedSuccess}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    {appliedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Appliqué au produit !</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Appliquer à mon article</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 1. Titre Commercial */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    1. Titre commercial percutant
                  </span>
                  <button
                    onClick={() => handleCopyText(generatedCopy.salesTitle, 'title')}
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'title' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'title' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900">
                  {generatedCopy.salesTitle}
                </div>
              </div>

              {/* 2. Phrase d'Accroche (Hook) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    2. Accroche émotionnelle (Hook)
                  </span>
                  <button
                    onClick={() => handleCopyText(generatedCopy.hook, 'hook')}
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'hook' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'hook' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl text-xs font-semibold text-amber-950 italic">
                  « {generatedCopy.hook} »
                </div>
              </div>

              {/* 3. Description Persuasive */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    3. Description commerciale complète
                  </span>
                  <button
                    onClick={() => handleCopyText(generatedCopy.persuasiveDescription, 'desc')}
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'desc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'desc' ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {generatedCopy.persuasiveDescription}
                </div>
              </div>

              {/* 4. Points Clés & Bénéfices */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  4. Caractéristiques clés & Bénéfices
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedCopy.bulletPoints.map((bp, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 flex items-start gap-2"
                    >
                      <span>{bp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Garantie Cash on Delivery */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  5. Argument choc Cash on Delivery (Zéro Risque)
                </span>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{generatedCopy.codGuaranteeArgument}</span>
                </div>
              </div>

              {/* 6. FAQ Client */}
              {generatedCopy.faq && generatedCopy.faq.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    6. Questions fréquentes rassurantes (FAQ)
                  </span>
                  <div className="space-y-2">
                    {generatedCopy.faq.map((item, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{item.question}</span>
                        </div>
                        <p className="text-slate-600 pl-5">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Fermer
          </button>
          {generatedCopy && onApplyCopy && (
            <button
              onClick={handleApplyToProduct}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <span>Appliquer ces textes à mon produit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
