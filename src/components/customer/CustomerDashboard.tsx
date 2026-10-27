import React from 'react';
import { User, Order } from '../../types';
import { storageService } from '../../services/storageService';
import { formatFCFA, formatDateFR, ORDER_STATUS_CONFIG } from '../../utils/formatters';
import { Package, Clock, ShieldCheck, Printer, ArrowRight, UserCheck, Ban, Mail } from 'lucide-react';

interface CustomerDashboardProps {
  currentUser: User;
  onOpenOrderReceipt: (order: Order) => void;
  onTrackOrder: (orderId: string) => void;
  onNavigateShopping: () => void;
  onOpenCustomerService?: (orderId?: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  onOpenOrderReceipt,
  onTrackOrder,
  onNavigateShopping,
  onOpenCustomerService,
}) => {
  const [orders, setOrders] = React.useState<Order[]>(() => storageService.getOrders());

  const refreshOrders = () => {
    setOrders(storageService.getOrders());
  };

  const handleCancel = (order: Order) => {
    const reason = window.prompt("Veuillez indiquer le motif d'annulation de votre commande :", "Changement d'avis / Commande en double");
    if (!reason) return;
    const res = storageService.cancelOrderByCustomer(order.id, reason);
    if (res.success) {
      alert("Votre commande a bien été annulée.");
      refreshOrders();
    } else {
      alert(res.message);
    }
  };
  const myOrders = orders.filter(
    (o) =>
      o.customerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      o.customerPhone.replace(/[\s+-]/g, '').includes(currentUser.phone.replace(/[\s+-]/g, ''))
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mon Espace Client BéninMarket</h1>
              <p className="text-xs text-slate-400">
                {currentUser.name} · {currentUser.email} · {currentUser.phone}
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateShopping}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Continuer mes achats
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-xs text-emerald-900">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong className="block text-sm">Paiement à la livraison garanti</strong>
            Toutes vos commandes en cours sont payables en espèces à la livraison. Vous ne déboursez rien en ligne.
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Historique de mes commandes ({myOrders.length})
            </h2>
          </div>

          {myOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-700 mb-1">Vous n'avez pas encore passé de commande.</p>
              <p className="text-slate-400 mb-4">Commandez vos articles préférés et réglez à la livraison.</p>
              <button
                onClick={onNavigateShopping}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold"
              >
                Découvrir la boutique
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {myOrders.map((order) => {
                const conf = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.NOUVELLE;
                return (
                  <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{order.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${conf.bg} ${conf.color}`}>
                            {conf.label}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px]">
                          Passée le {formatDateFR(order.createdAt)} · Livraison : {order.neighborhood}, {order.city}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-right mr-2">
                          <span className="text-slate-500 block text-[11px]">Montant à payer au livreur :</span>
                          <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                            {formatFCFA(order.grandTotal)}
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenOrderReceipt(order)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1 text-slate-700 font-semibold cursor-pointer"
                          title="Imprimer / Télécharger le reçu"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reçu</span>
                        </button>
                        <button
                          onClick={() => onTrackOrder(order.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Suivre</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        {(order.status === 'NOUVELLE' || order.status === 'CONFIRMEE') && (
                          <button
                            onClick={() => handleCancel(order)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                            title="Annuler cette commande"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Annuler</span>
                          </button>
                        )}
                        {onOpenCustomerService && (
                          <button
                            onClick={() => onOpenCustomerService(order.id)}
                            className="px-2.5 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                            title="Contacter le responsable du site (kgmservices229@gmail.com)"
                          >
                            <Mail className="w-3.5 h-3.5 text-amber-700" />
                            <span>Aide</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                      {order.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-slate-700">
                          <span>
                            {i.productName} (x{i.quantity})
                          </span>
                          <span className="font-semibold tabular-nums">{formatFCFA(i.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
