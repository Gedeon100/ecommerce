import React, { useState, useEffect } from 'react';
import { AISalesCopyResponse, AIProductImageItem, ProductTestimonial } from '../../types';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Loader2,
  FileText,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Lightbulb,
  Image as ImageIcon,
  Globe,
  Zap,
  ExternalLink,
  Star,
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
    images?: string[];
    testimonials?: ProductTestimonial[];
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
  const [targetAudience, setTargetAudience] = useState('Clients et familles au Bénin');

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<AISalesCopyResponse | null>(null);
  const [generatedImages, setGeneratedImages] = useState<AIProductImageItem[]>([]);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [webSources, setWebSources] = useState<{ title: string; uri: string }[]>([]);
  const [visualSummary, setVisualSummary] = useState('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialProductName) setProductName(initialProductName);
      if (initialCategory) setCategory(initialCategory);
      if (initialPrice !== undefined) setPrice(initialPrice || '');
      if (initialBenefits) setKeyBenefits(initialBenefits);
      setAppliedSuccess(false);
      setErrorMsg('');
    }
  }, [isOpen, initialProductName, initialCategory, initialPrice, initialBenefits]);

  if (!isOpen) return null;

  const handleGenerateCopyAndImages = async (e?: React.FormEvent, withImages = true) => {
    if (e) e.preventDefault();
    if (!productName.trim()) {
      setErrorMsg('Veuillez renseigner le nom de votre produit.');
      return;
    }

    setIsLoading(true);
    if (withImages) setIsLoadingImages(true);
    setErrorMsg('');
    setAppliedSuccess(false);

    try {
      const copyPromise = fetch('/api/ai/sales-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          category,
          price: price ? Number(price) : undefined,
          keyBenefits,
          targetAudience,
          storeName,
        }),
      }).then((r) => r.json());

      const imagesPromise = withImages
        ? fetch('/api/ai/product-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productName: productName.trim(),
              category,
              price: price ? Number(price) : undefined,
              storeName,
            }),
          }).then((r) => r.json())
        : Promise.resolve(null);

      const [copyRes, imgRes] = await Promise.all([copyPromise, imagesPromise]);

      if (copyRes?.success && copyRes.data) {
        setGeneratedCopy(copyRes.data);
      } else {
        throw new Error(copyRes?.error || 'Erreur lors de la génération IA');
      }

      if (imgRes?.success && imgRes.data) {
        const imgs: AIProductImageItem[] = imgRes.data.images || [];
        setGeneratedImages(imgs);
        setSelectedImageUrls(imgs.slice(0, 3).map((i) => i.url));
        setWebSources(imgRes.data.webSources || []);
        setVisualSummary(imgRes.data.visualSummary || '');
      }
    } catch (err: any) {
      console.warn('AI Sales generation error:', err);
      setErrorMsg('Connexion ralentie. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      setIsLoadingImages(false);
    }
  };

  const handleGenerateOnlyImages = async () => {
    if (!productName.trim()) {
      setErrorMsg('Veuillez renseigner le nom de votre produit avant de générer des images.');
      return;
    }
    setIsLoadingImages(true);
    setErrorMsg('');
    try {
      const resp = await fetch('/api/ai/product-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          category,
          price: price ? Number(price) : undefined,
          storeName,
        }),
      });
      const imgRes = await resp.json();
      if (imgRes?.success && imgRes.data) {
        const imgs: AIProductImageItem[] = imgRes.data.images || [];
        setGeneratedImages(imgs);
        setSelectedImageUrls(imgs.slice(0, 3).map((i) => i.url));
        setWebSources(imgRes.data.webSources || []);
        setVisualSummary(imgRes.data.visualSummary || '');
      }
    } catch {
      setErrorMsg('Erreur lors de la recherche web des images.');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const toggleImageSelection = (url: string) => {
    setSelectedImageUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyToProduct = () => {
    if (!onApplyCopy) return;
    if (!generatedCopy && selectedImageUrls.length === 0) return;

    const mappedTestimonials: ProductTestimonial[] | undefined =
      generatedCopy?.suggestedTestimonials?.map((st, idx) => ({
        id: `ai-testi-${Date.now()}-${idx}`,
        author: st.author,
        city: st.city,
        rating: st.rating || 5,
        comment: st.comment,
        date: 'Récemment',
        verified: true,
      }));

    onApplyCopy({
      title: generatedCopy?.salesTitle || productName,
      description: generatedCopy
        ? `${generatedCopy.urgencyBadge ? `${generatedCopy.urgencyBadge}\n\n` : ''}${generatedCopy.hook}\n\n${generatedCopy.persuasiveDescription}\n\n${generatedCopy.codGuaranteeArgument}`
        : '',
      features: generatedCopy?.bulletPoints || [],
      images: selectedImageUrls.length > 0 ? selectedImageUrls : undefined,
      testimonials: mappedTestimonials,
    });
    setAppliedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-amber-900 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>IA Page de Vente Ultra-Rapide + Images Web</span>
              </h2>
              <p className="text-xs text-amber-100">
                Argumentaire persuasif haute conversion + recherche d’images internet & affiches studio pour vos produits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Input Form */}
          <form
            onSubmit={(e) => handleGenerateCopyAndImages(e, true)}
            className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Indiquez votre produit : l’IA rédige l’argumentaire convaincant et recherche des images adaptées sur internet</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Montre connectée étanche, Blazer Wax Royal, Karité Bio..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catégorie</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Téléphones & Électronique, Mode, Beauté..."
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
                <label className="font-semibold text-slate-700">Points forts / arguments clés</label>
                <input
                  type="text"
                  value={keyBenefits}
                  onChange={(e) => setKeyBenefits(e.target.value)}
                  placeholder="Ex: batterie 7 jours, 100% pur, garantie 6 mois..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            {errorMsg && <div className="text-xs text-rose-600 font-semibold">{errorMsg}</div>}

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-600 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Moteur IA Turbo optimisé pour convaincre les clients COD</span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateOnlyImages}
                  disabled={isLoadingImages}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {isLoadingImages ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  <span>Générer Images (Recherche Web)</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Génération ultra-rapide...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{generatedCopy ? 'Régénérer Page + Images' : 'Générer Page de Vente + Images'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* AI Web-Researched & Studio Generated Product Images Section */}
          {(generatedImages.length > 0 || isLoadingImages) && (
            <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>Images Produit IA & Recherche Web pour la Page de Vente</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {visualSummary ||
                      'Cliquez sur les visuels que vous souhaitez intégrer à votre fiche de vente.'}
                  </p>
                </div>
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold w-fit">
                  {selectedImageUrls.length} image(s) sélectionnée(s)
                </span>
              </div>

              {isLoadingImages ? (
                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  <span>Recherche internet adaptée & création des affiches studio...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {generatedImages.map((img) => {
                    const isSelected = selectedImageUrls.includes(img.url);
                    return (
                      <div
                        key={img.id}
                        onClick={() => toggleImageSelection(img.url)}
                        className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all group bg-slate-900 ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/30'
                            : 'border-slate-800 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="aspect-4/3 bg-slate-800 overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 bg-slate-900/95 text-[10px] flex items-center justify-between gap-1">
                          <span className="truncate text-slate-200 font-semibold">{img.title}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              img.style === 'studio_poster'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {img.style === 'studio_poster' ? 'Affiche IA' : 'Web HD'}
                          </span>
                        </div>

                        <div
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-950/70 text-white border border-white/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {webSources.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">Sources Web analysées :</span>
                  {webSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800"
                    >
                      <span className="truncate max-w-[140px]">{src.title}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Persuasive Copy Output */}
          {generatedCopy && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Argumentaire haute conversion prêt pour votre page de vente !</span>
                </div>
                {onApplyCopy && (
                  <button
                    onClick={handleApplyToProduct}
                    disabled={appliedSuccess}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {appliedSuccess
                        ? 'Appliqué avec succès !'
                        : `Appliquer Texte${selectedImageUrls.length > 0 ? ` + ${selectedImageUrls.length} Image(s)` : ''}`}
                    </span>
                  </button>
                )}
              </div>

              {generatedCopy.urgencyBadge && (
                <div className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold">
                  {generatedCopy.urgencyBadge}
                </div>
              )}

              {/* 1. Sales Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    1. Titre commercial persuasif
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

              {/* 2. Hook */}
              <div className="space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  2. Accroche émotionnelle immédiate
                </span>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs font-semibold text-amber-950 italic">
                  « {generatedCopy.hook} »
                </div>
              </div>

              {/* 3. Persuasive Description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    3. Argumentaire de vente complet
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

              {/* 4. Bullet Points */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  4. Points forts convaincants
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedCopy.bulletPoints.map((bp, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      {bp}
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. COD Guarantee */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{generatedCopy.codGuaranteeArgument}</span>
              </div>

              {/* 6. Suggested Testimonials */}
              {generatedCopy.suggestedTestimonials && generatedCopy.suggestedTestimonials.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                    6. Avis types prêts à rassurer vos acheteurs
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {generatedCopy.suggestedTestimonials.map((st, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                          <span>{st.author} ({st.city})</span>
                          <span className="text-amber-500 flex">
                            {Array.from({ length: st.rating || 5 }).map((_, j) => (
                              <Star key={j} className="w-3 h-3 fill-current" />
                            ))}
                          </span>
                        </div>
                        <p className="text-slate-600 italic">« {st.comment} »</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. FAQ */}
              {generatedCopy.faq && generatedCopy.faq.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                    7. Réponses aux objections fréquentes (FAQ)
                  </span>
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
          {(generatedCopy || selectedImageUrls.length > 0) && onApplyCopy && (
            <button
              onClick={handleApplyToProduct}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <span>
                Appliquer à ma Page de Vente
                {selectedImageUrls.length > 0 ? ` (${selectedImageUrls.length} images)` : ''}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
