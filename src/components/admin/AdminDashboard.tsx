import React, { useState } from 'react';
import { User, Store, Product, Order, PlatformSettings, DeliveryZone } from '../../types';
import { storageService } from '../../services/storageService';
import { formatFCFA, formatDateFR, ORDER_STATUS_CONFIG } from '../../utils/formatters';
import {
  ShieldCheck,
  Store as StoreIcon,
  Package,
  Users,
  Settings,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Truck,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Printer,
  Database,
  Download,
  Upload,
  FileJson,
  Key,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onPrintOrderReceipt: (order: Order) => void;
  onOpenStore: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onPrintOrderReceipt,
  onOpenStore,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'products' | 'orders' | 'settings' | 'database'>('overview');
  const [dbSubTab, setDbSubTab] = useState<'orders' | 'stores' | 'products' | 'users'>('orders');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const stores = storageService.getStores();
  const products = storageService.getProducts();
  const orders = storageService.getOrders();
  const settings = storageService.getSettings();
  const users = storageService.getUsers();

  // Global calculations
  const totalStores = stores.length;
  const verifiedStores = stores.filter((s) => s.isVerified).length;
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === 'LIVREE_ENCAISSEE');
  const totalCashCollected = deliveredOrders.reduce((sum, o) => sum + (o.cashCollectedAmount || o.grandTotal), 0);
  const totalVolume = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Settings form state
  const [commissionRate, setCommissionRate] = useState(settings.defaultCommissionRate);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleStoreVerification = (store: Store) => {
    storageService.updateStore({
      ...store,
      isVerified: !store.isVerified,
    });
  };

  const handleToggleProductPublish = (product: Product) => {
    storageService.saveProduct({
      ...product,
      isPublished: !product.isPublished,
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings({
      ...settings,
      defaultCommissionRate: Number(commissionRate),
      supportPhone,
      supportEmail,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportDatabase = () => {
    const jsonStr = storageService.exportCompleteDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beninmarket_database_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = storageService.importCompleteDatabase(content);
      setImportStatus(res.message);
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleResetFactory = () => {
    if (confirm('ATTENTION PASTEUR KAZOTTI : Voulez-vous vraiment réinitialiser toutes les données par défaut ?')) {
      storageService.resetToFactory();
      setImportStatus('Base de données réinitialisée aux données modèles.');
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Super Administration BéninMarket</h1>
              <p className="text-xs text-slate-400">
                Gouvernance de la marketplace multivendeurs & suivi logistique Cash on Delivery
              </p>
            </div>
          </div>
          <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded text-slate-300 font-semibold">
            Rôle : Administrateur Système
          </span>
        </div>

        {/* Tab links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 text-xs font-semibold border-t border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'stores'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Boutiques & Vendeurs ({totalStores})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'products'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Modération Produits ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Toutes les Commandes ({totalOrders})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paramètres Marketplace
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 transition-colors border-b-2 flex items-center gap-1.5 font-bold ${
              activeTab === 'database'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Base de Données Privée</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Espèces Encaissées en Livraison
                </span>
                <div className="text-2xl font-black text-emerald-700 tabular-nums">
                  {formatFCFA(totalCashCollected)}
                </div>
                <span className="text-[11px] text-slate-500">
                  Sur les {deliveredOrders.length} commandes confirmées livrées
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Volume Total Commandé
                </span>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {formatFCFA(totalVolume)}
                </div>
                <span className="text-[11px] text-slate-500">
                  {totalOrders} commandes générées sur la plateforme
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Boutiques Actives
                </span>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {totalStores}
                </div>
                <span className="text-[11px] text-blue-700 font-medium">
                  {verifiedStores} boutiques vérifiées
                </span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Commission estimée ({settings.defaultCommissionRate}%)
                </span>
                <div className="text-2xl font-bold text-amber-700 tabular-nums">
                  {formatFCFA(totalCashCollected * (settings.defaultCommissionRate / 100))}
                </div>
                <span className="text-[11px] text-slate-500">
                  Revenu net de la plateforme
                </span>
              </div>
            </div>

            {/* Quick action alert */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Surveillance de l'écosystème béninois
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                La marketplace opère sans prélèvement bancaire préalable afin de maximiser la confiance des consommateurs au Bénin. Tous les flux financiers reposent sur la transmission d'espèces (XOF) lors de la remise en main propre. Veillez à ce que les livreurs et vendeurs valident systématiquement le montant collecté.
              </p>
            </div>
          </div>
        )}

        {/* STORES TAB */}
        {activeTab === 'stores' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Liste des boutiques vendeurs ({stores.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Boutique</th>
                    <th className="py-2.5 px-4">Ville</th>
                    <th className="py-2.5 px-4">Catégorie</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Statut</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <img src={s.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <span>{s.name}</span>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            /{s.slug}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{s.city}</td>
                      <td className="py-3 px-4 text-slate-600">{s.category}</td>
                      <td className="py-3 px-4 text-slate-600">{s.phone}</td>
                      <td className="py-3 px-4">
                        {s.isVerified ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                            Vérifiée
                          </span>
                        ) : (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStoreVerification(s)}
                          className="text-xs font-semibold text-slate-700 hover:text-amber-700"
                        >
                          {s.isVerified ? 'Révoquer' : 'Valider'}
                        </button>
                        <button
                          onClick={() => onOpenStore(s.slug)}
                          className="text-xs font-semibold text-amber-700 hover:underline"
                        >
                          Visiter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS MODERATION TAB */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Modération des produits publiés ({products.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Produit</th>
                    <th className="py-2.5 px-4">Boutique</th>
                    <th className="py-2.5 px-4">Prix</th>
                    <th className="py-2.5 px-4">Stock</th>
                    <th className="py-2.5 px-4">Statut</th>
                    <th className="py-2.5 px-4 text-right">Modération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const st = stores.find((s) => s.id === p.storeId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="truncate max-w-xs">{p.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{st?.name}</td>
                        <td className="py-3 px-4 font-bold tabular-nums">
                          {formatFCFA(p.isPromoActive && p.promoPrice ? p.promoPrice : p.price)}
                        </td>
                        <td className="py-3 px-4 tabular-nums">{p.stock}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.isPublished
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.isPublished ? 'En ligne' : 'Masqué'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleProductPublish(p)}
                            className="text-xs font-semibold text-slate-700 hover:text-amber-700"
                          >
                            {p.isPublished ? 'Désactiver' : 'Activer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALL ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Toutes les commandes de la plateforme ({orders.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">N° Commande</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Ville</th>
                    <th className="py-2.5 px-4">Montant Total</th>
                    <th className="py-2.5 px-4">Statut</th>
                    <th className="py-2.5 px-4 text-right">Reçu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => {
                    const conf = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.NOUVELLE;
                    return (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{o.id}</td>
                        <td className="py-3 px-4 text-slate-500">{formatDateFR(o.createdAt)}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{o.customerName}</td>
                        <td className="py-3 px-4 text-slate-600">{o.city}</td>
                        <td className="py-3 px-4 font-bold tabular-nums">{formatFCFA(o.grandTotal)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${conf.bg} ${conf.color}`}>
                            {conf.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onPrintOrderReceipt(o)}
                            className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Imprimer</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-xl">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Paramètres Généraux de BéninMarket
            </h2>

            {saveSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs">
                Paramètres enregistrés avec succès.
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Taux de commission plateforme (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Téléphone support client (WhatsApp & Appel)
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail support officiel
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Sauvegarder les paramètres
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DATABASE MANAGEMENT TAB (EXCLUSIVE TO PASTEUR KAZOTTI) */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Super Admin Ownership Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-white">
                    Base de Données Globale & Contrôle Exclusif
                  </h2>
                  <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                    pasteurkazotti@gmail.com
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Cet espace administrateur et cette base de données sont totalement <strong>invisibles</strong> aux acheteurs et vendeurs. Vous êtes le seul propriétaire habilité à visualiser l'ensemble des données, exporter les sauvegardes et gérer la plateforme.
                </p>
              </div>

              {/* Quick Backup Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={handleExportDatabase}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter la BDD (JSON)</span>
                </button>

                <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Restaurer une sauvegarde</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDatabase}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleResetFactory}
                  className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Réinitialiser les données aux valeurs de démonstration"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>

            {importStatus && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            {/* Database Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-slate-500 text-xs font-semibold mb-1">Total Commandes</div>
                <div className="text-2xl font-black text-slate-900 tabular-nums">{orders.length}</div>
                <div className="text-[11px] text-slate-400">Toutes boutiques confondues</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-slate-500 text-xs font-semibold mb-1">Total Produits</div>
                <div className="text-2xl font-black text-slate-900 tabular-nums">{products.length}</div>
                <div className="text-[11px] text-slate-400">Articles physiques en ligne</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-slate-500 text-xs font-semibold mb-1">Total Boutiques</div>
                <div className="text-2xl font-black text-slate-900 tabular-nums">{stores.length}</div>
                <div className="text-[11px] text-slate-400">Vendeurs indépendants</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-slate-500 text-xs font-semibold mb-1">Comptes Utilisateurs</div>
                <div className="text-2xl font-black text-slate-900 tabular-nums">{users.length}</div>
                <div className="text-[11px] text-slate-400">Clients & Vendeurs</div>
              </div>
            </div>

            {/* Raw Collection Viewer */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Exploration Directe des Tables de la Base de Données
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setDbSubTab('orders')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      dbSubTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Commandes ({orders.length})
                  </button>
                  <button
                    onClick={() => setDbSubTab('stores')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      dbSubTab === 'stores' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Boutiques ({stores.length})
                  </button>
                  <button
                    onClick={() => setDbSubTab('products')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      dbSubTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Articles ({products.length})
                  </button>
                  <button
                    onClick={() => setDbSubTab('users')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      dbSubTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Utilisateurs ({users.length})
                  </button>
                </div>
              </div>

              {/* Table: Orders */}
              {dbSubTab === 'orders' && (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Code Commande</th>
                        <th className="py-2.5 px-4">Client</th>
                        <th className="py-2.5 px-4">Téléphone / Email</th>
                        <th className="py-2.5 px-4">Lieu de Livraison</th>
                        <th className="py-2.5 px-4">Montant Total</th>
                        <th className="py-2.5 px-4">Statut COD</th>
                        <th className="py-2.5 px-4 text-right">Bon de commande</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((o) => {
                        const conf = ORDER_STATUS_CONFIG[o.status] || ORDER_STATUS_CONFIG.NOUVELLE;
                        return (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">{o.id}</td>
                            <td className="py-3 px-4 font-medium">{o.customerName}</td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{o.customerPhone}</div>
                              <div className="text-slate-400 text-[11px]">{o.customerEmail}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <span className="font-semibold text-slate-900">{o.city}</span> ({o.neighborhood})
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">{o.deliveryAddress}</div>
                            </td>
                            <td className="py-3 px-4 font-bold tabular-nums text-slate-900">
                              {formatFCFA(o.grandTotal)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${conf.bg} ${conf.color}`}>
                                {conf.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => onPrintOrderReceipt(o)}
                                className="text-amber-700 hover:text-amber-800 font-semibold"
                              >
                                Reçu
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table: Stores */}
              {dbSubTab === 'stores' && (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Boutique</th>
                        <th className="py-2.5 px-4">Ville</th>
                        <th className="py-2.5 px-4">Numéro WhatsApp</th>
                        <th className="py-2.5 px-4">Téléphone</th>
                        <th className="py-2.5 px-4">Catégorie</th>
                        <th className="py-2.5 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stores.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                          <td className="py-3 px-4">{s.city}</td>
                          <td className="py-3 px-4 text-emerald-700 font-semibold">{s.whatsapp}</td>
                          <td className="py-3 px-4 text-slate-600">{s.phone}</td>
                          <td className="py-3 px-4">{s.category}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                              {s.isVerified ? 'Vérifié' : 'En attente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table: Products */}
              {dbSubTab === 'products' && (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Article</th>
                        <th className="py-2.5 px-4">Catégorie</th>
                        <th className="py-2.5 px-4">Prix Normal</th>
                        <th className="py-2.5 px-4">Prix Promo</th>
                        <th className="py-2.5 px-4">Stock</th>
                        <th className="py-2.5 px-4">Vendus</th>
                        <th className="py-2.5 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 text-slate-600">{p.category}</td>
                          <td className="py-3 px-4 font-bold tabular-nums">{formatFCFA(p.price)}</td>
                          <td className="py-3 px-4 font-bold tabular-nums text-amber-700">
                            {p.promoPrice ? formatFCFA(p.promoPrice) : '—'}
                          </td>
                          <td className="py-3 px-4 font-bold">{p.stock}</td>
                          <td className="py-3 px-4 text-slate-600">{p.salesCount || 0}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {p.isPublished ? 'En ligne' : 'Désactivé'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table: Users */}
              {dbSubTab === 'users' && (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Nom</th>
                        <th className="py-2.5 px-4">Email</th>
                        <th className="py-2.5 px-4">Téléphone</th>
                        <th className="py-2.5 px-4">Rôle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                          <td className="py-3 px-4 text-slate-700">{u.email}</td>
                          <td className="py-3 px-4 text-slate-600">{u.phone}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'seller'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {u.role === 'admin' ? 'Super Admin' : u.role === 'seller' ? 'Vendeur' : 'Acheteur'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
