import { OrderStatus } from '../types';

/**
 * Format a number into FCFA / XOF currency string.
 * Example: 25000 -> "25 000 FCFA"
 */
export function formatFCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Calculate the discount percentage between standard and promotional price.
 */
export function calculateDiscountPercent(normalPrice: number, promoPrice?: number): number {
  if (!promoPrice || promoPrice >= normalPrice || normalPrice <= 0) return 0;
  return Math.round(((normalPrice - promoPrice) / normalPrice) * 100);
}

/**
 * Format date into readable French format.
 */
export function formatDateFR(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-BJ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Generate a unique order tracking code.
 * Example: BM-2026-8492
 */
export function generateOrderId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `BM-${year}-${randomNum}`;
}

/**
 * Human-readable order status configuration with labels, colors and descriptions.
 */
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; description: string; color: string; bg: string; stepIndex: number }
> = {
  NOUVELLE: {
    label: 'Nouvelle commande',
    description: 'En attente de prise en charge par le vendeur',
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-200',
    stepIndex: 1,
  },
  CONFIRMEE: {
    label: 'Confirmée',
    description: 'Commande vérifiée et validée avec le client',
    color: 'text-blue-800',
    bg: 'bg-blue-50 border-blue-200',
    stepIndex: 2,
  },
  EN_PREPARATION: {
    label: 'En préparation',
    description: 'Le vendeur prépare le colis et les variantes',
    color: 'text-indigo-800',
    bg: 'bg-indigo-50 border-indigo-200',
    stepIndex: 3,
  },
  PRETE_EXPEDITION: {
    label: 'Prête à expédier',
    description: 'Colis emballé, remis au service de livraison',
    color: 'text-purple-800',
    bg: 'bg-purple-50 border-purple-200',
    stepIndex: 4,
  },
  EN_COURS_LIVRAISON: {
    label: 'En cours de livraison',
    description: 'Le livreur est en route vers votre domicile',
    color: 'text-amber-900',
    bg: 'bg-amber-100 border-amber-300',
    stepIndex: 5,
  },
  LIVREE_ENCAISSEE: {
    label: 'Livrée & Encaissée',
    description: 'Colis reçu par le client et montant payé au livreur',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50 border-emerald-200',
    stepIndex: 6,
  },
  ANNULEE: {
    label: 'Annulée',
    description: 'Commande annulée par le client ou le vendeur',
    color: 'text-rose-800',
    bg: 'bg-rose-50 border-rose-200',
    stepIndex: 0,
  },
  LIVRAISON_ECHOUEE: {
    label: 'Livraison échouée',
    description: 'Client injoignable ou adresse introuvable',
    color: 'text-orange-800',
    bg: 'bg-orange-50 border-orange-200',
    stepIndex: 0,
  },
  RETOUR_DEMANDE: {
    label: 'Retour demandé',
    description: 'Demande de retour en cours d’examen',
    color: 'text-slate-800',
    bg: 'bg-slate-100 border-slate-300',
    stepIndex: 0,
  },
  RETOURNEE: {
    label: 'Retournée',
    description: 'Colis retourné au vendeur',
    color: 'text-slate-800',
    bg: 'bg-slate-100 border-slate-300',
    stepIndex: 0,
  },
};
