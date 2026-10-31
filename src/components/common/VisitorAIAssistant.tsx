import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageCircle,
  X,
  Send,
  Loader2,
  HelpCircle,
  Truck,
  ShieldCheck,
  Store,
  Package,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  GripVertical,
  Move,
} from 'lucide-react';

interface VisitorAIAssistantProps {
  onOpenTrack?: () => void;
  onNavigateToSeller?: () => void;
  onNavigateToBuyer?: () => void;
  onOpenCustomerService?: () => void;
  onOpenSellerOnboarding?: () => void;
  onExploreMarketplace?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: 'track' | 'seller' | 'support' | 'home';
}

const DEFAULT_WELCOME = 
  "👋 Bonjour et bienvenue sur BéninMarket !\n\n" +
  "Je suis votre **Assistant Virtuel IA**, disponible 24h/24 pour répondre à toutes vos questions :\n" +
  "• Fonctionnement du paiement 100% à la livraison (Cash on Delivery)\n" +
  "• Délais et tarifs de livraison à Cotonou, Calavi, Parakou...\n" +
  "• Bon de commande et reçu officiel\n" +
  "• Ouverture gratuite de votre boutique vendeuse\n\n" +
  "Que souhaitez-vous savoir ?";

const SUGGESTIONS = [
  { label: '💵 Paiement à la livraison ?', prompt: 'Comment fonctionne le paiement à la livraison sur BéninMarket ?' },
  { label: '🚚 Délais & Frais au Bénin ?', prompt: 'Quels sont les délais et tarifs de livraison à Cotonou et dans les autres villes ?' },
  { label: '📦 Suivre ma commande', prompt: 'Comment puis-je suivre l\'acheminement de mon colis en direct ?' },
  { label: '🏪 Devenir Vendeur', prompt: 'Comment ouvrir une boutique vendeuse pour vendre mes produits sur BéninMarket ?' },
  { label: '🧾 Reçu & Bon de commande', prompt: 'Comment obtenir mon bon de commande et mon reçu de paiement ?' },
];

export const VisitorAIAssistant: React.FC<VisitorAIAssistantProps> = ({
  onOpenTrack,
  onNavigateToSeller,
  onNavigateToBuyer,
  onOpenCustomerService,
  onOpenSellerOnboarding,
  onExploreMarketplace,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: DEFAULT_WELCOME,
      timestamp: 'À l\'instant',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Position déplaçable (par défaut au milieu de l'écran en bas)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Initialisation au milieu de l'écran
  useEffect(() => {
    const handleInitialCenter = () => {
      if (typeof window !== 'undefined' && !position && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const initialX = Math.max(10, (window.innerWidth - rect.width) / 2);
        // Au-dessus de la barre mobile de navigation (~70px)
        const initialY = Math.max(10, window.innerHeight - (window.innerWidth < 768 ? 76 : 84));
        setPosition({ x: initialX, y: initialY });
      }
    };
    handleInitialCenter();
  }, []);

  // Gestion du glisser-déposer (Drag and drop) fluide tactile et souris
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const curX = rect ? rect.left : position?.x || (window.innerWidth - 150) / 2;
    const curY = rect ? rect.top : position?.y || window.innerHeight - 80;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: curX,
      initY: curY,
      moved: false,
    };
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      dragStartRef.current.moved = true;
      setIsDragging(true);

      const rect = buttonRef.current?.getBoundingClientRect();
      const btnW = rect ? rect.width : 140;
      const btnH = rect ? rect.height : 46;

      const newX = Math.max(8, Math.min(window.innerWidth - btnW - 8, dragStartRef.current.initX + dx));
      const newY = Math.max(8, Math.min(window.innerHeight - btnH - 8, dragStartRef.current.initY + dy));

      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const wasMoved = dragStartRef.current.moved;
    dragStartRef.current = null;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Si l'utilisateur n'a pas glissé (simple clic/tap), on ouvre/ferme
    if (!wasMoved) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleSendMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/visitor-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          history: messages.slice(-4).map((m) => ({ role: m.sender, content: m.text })),
        }),
      });

      const resData = await response.json();
      const aiReply = resData.answer || "Je suis à votre entière disposition pour répondre à toutes vos interrogations sur vos commandes BéninMarket.";

      // Detect smart action links
      let detectedAction: 'track' | 'seller' | 'support' | 'home' | undefined;
      const lowerReply = aiReply.toLowerCase();
      if (lowerReply.includes('suivi') || lowerReply.includes('code de commande')) {
        detectedAction = 'track';
      } else if (lowerReply.includes('boutique') || lowerReply.includes('vendeur')) {
        detectedAction = 'seller';
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        action: detectedAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('Visitor assistant error, fallback used:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: "Sur BéninMarket, vous commandez sans carte bancaire et vous réglez exclusivement au livreur après réception de votre colis. Tous nos vendeurs sont certifiés.",
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action === 'track' && onOpenTrack) {
      onOpenTrack();
      setIsOpen(false);
    } else if (action === 'seller') {
      if (onOpenSellerOnboarding) onOpenSellerOnboarding();
      else if (onNavigateToSeller) onNavigateToSeller();
      setIsOpen(false);
    } else if (action === 'support' && onOpenCustomerService) {
      onOpenCustomerService();
      setIsOpen(false);
    } else if (action === 'home') {
      if (onExploreMarketplace) onExploreMarketplace();
      else if (onNavigateToBuyer) onNavigateToBuyer();
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Draggable Trigger Button (when closed) */}
      {!isOpen && (
        <div
          ref={buttonRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={
            position
              ? {
                  position: 'fixed',
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  touchAction: 'none',
                }
              : {
                  position: 'fixed',
                  left: '50%',
                  bottom: '72px',
                  transform: 'translateX(-50%)',
                  touchAction: 'none',
                }
          }
          className={`z-50 print:hidden select-none cursor-grab active:cursor-grabbing transition-transform ${
            isDragging ? 'scale-105 opacity-90 shadow-2xl' : 'hover:scale-102 shadow-xl'
          }`}
          title="Assistant IA (Glissez pour déplacer n'importe où sur l'écran)"
        >
          <div className="relative flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 via-amber-600 to-yellow-600 text-white rounded-full border-2 border-white/70 ring-2 ring-amber-500/30 backdrop-blur-xs">
            {/* Grip handle */}
            <div className="text-amber-200/80 -ml-1 flex items-center" title="Déplaçable">
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Sparkles with live indicator */}
            <div className="relative">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-amber-700 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-amber-700"></span>
            </div>

            {/* Label */}
            <div className="text-left pr-0.5">
              <div className="text-xs font-black leading-none flex items-center gap-1">
                <span>Assistant IA</span>
                <span className="text-[9px] bg-slate-900/40 text-amber-200 px-1 py-0.2 rounded font-semibold hidden xs:inline">
                  Bénin
                </span>
              </div>
              <div className="text-[9px] text-amber-100 font-medium leading-tight mt-0.5 hidden xs:block">
                Déplaçable · 24h/7
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Chat Widget (Modal centré avec fond estompé) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200 print:hidden font-sans">
          <div className="w-[94vw] sm:w-[420px] max-w-md h-[540px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                  <span>Assistant BéninMarket IA</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </h3>
                <p className="text-[10px] text-amber-200">En ligne · Guide d'achat & Support</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'msg-welcome',
                      sender: 'assistant',
                      text: DEFAULT_WELCOME,
                      timestamp: 'À l\'instant',
                    },
                  ])
                }
                title="Réinitialiser la conversation"
                className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-full font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {sug.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {messages.map((m) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                      isAssistant
                        ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                        : 'bg-amber-600 text-white rounded-tr-xs'
                    }`}
                  >
                    {m.text}

                    {/* Smart Action Buttons inside assistant reply */}
                    {isAssistant && m.action && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {m.action === 'track' && onOpenTrack && (
                          <button
                            onClick={() => handleActionClick('track')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-amber-200 cursor-pointer"
                          >
                            <Package className="w-3 h-3 text-amber-600" />
                            <span>Suivre mon colis en direct</span>
                          </button>
                        )}
                        {m.action === 'seller' && onNavigateToSeller && (
                          <button
                            onClick={() => handleActionClick('seller')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-amber-200 cursor-pointer"
                          >
                            <Store className="w-3 h-3 text-amber-600" />
                            <span>Accéder à l'Espace Vendeur</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2 bg-white rounded-xl border border-slate-200 max-w-[70%]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                <span>L'IA formule votre réponse...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez votre question à l'IA..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-slate-900 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          </div>
        </div>
      )}
    </>
  );
};
