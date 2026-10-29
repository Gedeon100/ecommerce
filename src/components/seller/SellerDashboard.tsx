import React, { useState } from 'react';
import { User, Store, Product, Order, OrderStatus, ProductVariant, ProductTestimonial, StoreCustomer, DeliveryZone } from '../../types';
import { storageService } from '../../services/storageService';
import { mediaStorage } from '../../services/mediaStorage';
import { formatFCFA, formatDateFR, calculateDiscountPercent, ORDER_STATUS_CONFIG } from '../../utils/formatters';
import {
  Store as StoreIcon,
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Video,
  DollarSign,
  Tag,
  Truck,
  Phone,
  MessageCircle,
  Settings,
  X,
  Printer,
  ChevronRight,
  ExternalLink,
  Star,
  FileText,
  MessageSquare,
  Upload,
  Film,
  Image as ImageIcon,
  Copy,
  Check,
  Users,
  Share2,
  MousePointer,
  Megaphone,
  Send,
  Percent,
  ShoppingCart,
  Shield,
  Lock,
  Key,
  Sliders,
  MapPin,
  Mail,
  Power,
  Search,
  ChevronLeft,
  Activity,
  Layers,
  Sparkles,
  Receipt,
  QrCode,
  FileCheck2,
} from 'lucide-react';
import { HighLoadMonitorModal } from '../common/HighLoadMonitorModal';
import { AISalesCopyModal } from './AISalesCopyModal';
import { AICartRecoveryModal } from './AICartRecoveryModal';
import { BonDeCommandeModal } from '../common/BonDeCommandeModal';
import { PaymentReceiptModal } from '../common/PaymentReceiptModal';
import { AbandonedCart } from '../../types';

export type SellerTab = 'overview' | 'products' | 'orders' | 'promotions' | 'settings' | 'abandoned_carts';

interface SellerDashboardProps {
  currentUser: User;
  onOpenStorePublic: (storeSlug: string) => void;
  onPrintOrderReceipt: (order: Order) => void;
  activeTab?: SellerTab;
  onTabChange?: (tab: SellerTab) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  onOpenStorePublic,
  onPrintOrderReceipt,
  activeTab: controlledActiveTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<SellerTab>('overview');
  const activeTab = controlledActiveTab || internalTab;
  const setActiveTab = (tab: SellerTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load stores and products
  const stores = storageService.getStores();
  const sellerStore = stores.find((s) => s.id === currentUser.storeId || s.sellerId === currentUser.id) || stores[0];
  const allProducts = storageService.getProductsByStore(sellerStore.id);
  const allOrders = storageService.getOrdersByStore(sellerStore.id);

  // Stats calculation
  const totalProducts = allProducts.length;
  const storeSubOrders = allOrders.flatMap((o) =>
    o.subOrders.filter((sub) => sub.storeId === sellerStore.id)
  );

  const totalOrdersCount = storeSubOrders.length;
  const pendingCount = storeSubOrders.filter((s) => ['NOUVELLE', 'CONFIRMEE', 'EN_PREPARATION'].includes(s.status)).length;
  const inDeliveryCount = storeSubOrders.filter((s) => s.status === 'EN_COURS_LIVRAISON').length;
  const deliveredCount = storeSubOrders.filter((s) => s.status === 'LIVREE_ENCAISSEE').length;
  const cancelledCount = storeSubOrders.filter((s) => ['ANNULEE', 'LIVRAISON_ECHOUEE', 'RETOURNEE'].includes(s.status)).length;

  // Real cash collected (only on delivered orders)
  const realCashCollected = storeSubOrders
    .filter((s) => s.status === 'LIVREE_ENCAISSEE')
    .reduce((sum, s) => sum + (s.cashCollected !== undefined ? s.cashCollected : s.total), 0);

  // Total order book (including pending, to show potential pipeline)
  const totalOrderBook = storeSubOrders.reduce((sum, s) => sum + s.total, 0);

  // Store Analytics & Customers
  const storeViewsTotal = sellerStore.viewsCount || 1420;
  const productsViewsTotal = allProducts.reduce((sum, p) => sum + (p.viewsCount || 36), 0);
  const cartAbandonCount = sellerStore.cartAbandonCount || 9;
  const cartAbandonTotal = sellerStore.cartAbandonTotal || 245000;
  const totalUnitsInStock = allProducts.reduce((sum, p) => sum + p.stock, 0);
  const storeCustomers: StoreCustomer[] = storageService.getStoreCustomers(sellerStore.id);

  // Unlimited Catalog & High Concurrency State
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [productPage, setProductPage] = useState(1);
  const [isHighLoadModalOpen, setIsHighLoadModalOpen] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const PRODUCTS_PER_PAGE = 12;

  // Abandoned Carts & AI Recovery
  const storeAbandonedCarts = storageService.getAbandonedCartsByStore(sellerStore.id);
  const [selectedRecoveryCart, setSelectedRecoveryCart] = useState<AbandonedCart | null>(null);
  const [isCartRecoveryModalOpen, setIsCartRecoveryModalOpen] = useState(false);

  // AI Sales Copy Generator Modal
  const [isSalesCopyModalOpen, setIsSalesCopyModalOpen] = useState(false);
  const [salesCopyTargetProduct, setSalesCopyTargetProduct] = useState<{
    name?: string;
    category?: string;
    price?: number;
    benefits?: string;
  } | null>(null);

  // Delivery & Payment Confirmation Modal
  const [confirmDeliveryTarget, setConfirmDeliveryTarget] = useState<{ order: Order; sub: any } | null>(null);
  const [confirmDeliveryCashAmount, setConfirmDeliveryCashAmount] = useState<number>(0);
  const [justDeliveredSuccessInfo, setJustDeliveredSuccessInfo] = useState<{ order: Order; receiptNumber: string } | null>(null);

  // Document View Modals
  const [viewBonDeCommandeOrder, setViewBonDeCommandeOrder] = useState<Order | null>(null);
  const [viewPaymentReceiptOrder, setViewPaymentReceiptOrder] = useState<Order | null>(null);

  // Filtered and paginated products
  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch = !productSearch.trim() || 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const matchesStock = 
      productStockFilter === 'all' ? true :
      productStockFilter === 'in_stock' ? p.stock > 0 :
      p.stock <= (sellerStore.lowStockThreshold || 3);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalFilteredPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const currentPaginatedProducts = filteredProducts.slice(
    (productPage - 1) * PRODUCTS_PER_PAGE,
    productPage * PRODUCTS_PER_PAGE
  );

  const handleDuplicateProduct = (productId: string) => {
    const dup = storageService.duplicateProduct(productId);
    if (dup) {
      setMediaStatusMsg(`Article « ${dup.name} » dupliqué dans votre catalogue !`);
      setTimeout(() => setMediaStatusMsg(''), 3500);
    }
  };

  const handleGenerateBatch = (count: number) => {
    setIsBatchGenerating(true);
    setTimeout(() => {
      storageService.generateUnlimitedDemoBatch(sellerStore.id, count);
      setIsBatchGenerating(false);
      setMediaStatusMsg(`${count} nouveaux articles générés avec succès dans votre catalogue illimité !`);
      setTimeout(() => setMediaStatusMsg(''), 4000);
    }, 400);
  };

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Mode & Vêtements');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(10000);
  const [prodPromoPrice, setProdPromoPrice] = useState<number | undefined>(undefined);
  const [prodIsPromoActive, setProdIsPromoActive] = useState(false);
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodImages, setProdImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  ]);
  const [prodNewImageUrl, setProdNewImageUrl] = useState('');
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prodWeight, setProdWeight] = useState<number>(0.5);
  const [prodDimensions, setProdDimensions] = useState('30 x 20 x 5 cm');
  const [prodDetailedDesc, setProdDetailedDesc] = useState('');
  const [prodFeatures, setProdFeatures] = useState<string[]>([]);
  const [prodTestimonials, setProdTestimonials] = useState<ProductTestimonial[]>([]);
  const [productModalTab, setProductModalTab] = useState<'general' | 'description' | 'testimonials'>('general');
  const [newTestimonialAuthor, setNewTestimonialAuthor] = useState('');
  const [newTestimonialCity, setNewTestimonialCity] = useState('Cotonou');
  const [newTestimonialRating, setNewTestimonialRating] = useState(5);
  const [newTestimonialComment, setNewTestimonialComment] = useState('');
  const [formError, setFormError] = useState('');

  // Media upload states (direct from phone/PC with no size limit)
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [mediaStatusMsg, setMediaStatusMsg] = useState('');

  // Status update state for orders
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Store Settings State (Parameters, Visuals, WhatsApp, Delivery & Security)
  const [settingsSection, setSettingsSection] = useState<'identity' | 'whatsapp' | 'delivery' | 'cod' | 'security'>('identity');
  const [profileStoreName, setProfileStoreName] = useState(sellerStore.name);
  const [profileSlogan, setProfileSlogan] = useState(sellerStore.slogan || '');
  const [profileCategory, setProfileCategory] = useState(sellerStore.category || 'Mode & Vêtements');
  const [profileSlug, setProfileSlug] = useState(sellerStore.slug);
  const [profileLogo, setProfileLogo] = useState(sellerStore.logo);
  const [profileBanner, setProfileBanner] = useState(sellerStore.banner);
  const [profileWhatsapp, setProfileWhatsapp] = useState(sellerStore.whatsapp);
  const [profilePhone, setProfilePhone] = useState(sellerStore.phone);
  const [profileEmail, setProfileEmail] = useState(sellerStore.email || currentUser.email);
  const [profileAddress, setProfileAddress] = useState(sellerStore.address);
  const [profileCity, setProfileCity] = useState(sellerStore.city);
  const [profileDesc, setProfileDesc] = useState(sellerStore.description);
  const [profileIsOpen, setProfileIsOpen] = useState(sellerStore.isOpen !== false);
  const [profileWhatsappOrderMessage, setProfileWhatsappOrderMessage] = useState(
    sellerStore.whatsappOrderMessage ||
      'Bonjour ! Merci pour votre commande sur notre boutique BéninMarket. Votre colis est en cours de préparation pour une livraison rapide à votre domicile. Le règlement se fera directement au livreur à la réception (0 FCFA payé en avance).'
  );
  const [profileDeliveryInstructions, setProfileDeliveryInstructions] = useState(
    sellerStore.deliveryInstructions ||
      'Paiement exclusivement en espèces à la livraison. Appeler impérativement le client 30 minutes avant de se déplacer.'
  );
  const [profileLowStockThreshold, setProfileLowStockThreshold] = useState<number>(sellerStore.lowStockThreshold || 3);
  const [profileDeliveryZones, setProfileDeliveryZones] = useState<DeliveryZone[]>(() => {
    if (sellerStore.deliveryZones && sellerStore.deliveryZones.length > 0) {
      return sellerStore.deliveryZones;
    }
    return [
      { id: 'z1', city: 'Cotonou', fee: 1000, estimatedHours: '2h à 6h (Même jour)', freeAbove: 30000 },
      { id: 'z2', city: 'Abomey-Calavi', fee: 1500, estimatedHours: '4h à 24h', freeAbove: 40000 },
      { id: 'z3', city: 'Porto-Novo', fee: 2000, estimatedHours: '24h ouvrées', freeAbove: 50000 },
      { id: 'z4', city: 'Parakou', fee: 3500, estimatedHours: '24h à 48h', freeAbove: 75000 },
      { id: 'z5', city: 'Bohicon', fee: 2500, estimatedHours: '24h ouvrées' },
      { id: 'z6', city: 'Ouidah', fee: 2000, estimatedHours: '24h ouvrées' },
      { id: 'z7', city: 'Natitingou', fee: 4000, estimatedHours: '48h' },
    ];
  });
  const [newSellerPassword, setNewSellerPassword] = useState('');
  const [confirmSellerPassword, setConfirmSellerPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Promo campaign states
  const [selectedPromoProductId, setSelectedPromoProductId] = useState<string>(allProducts[0]?.id || '');
  const [promoCustomNote, setPromoCustomNote] = useState('');
  const [copiedPromoText, setCopiedPromoText] = useState(false);

  const handleCopyStoreLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://beninmarket.bj';
    const cleanSlug = profileSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') || sellerStore.slug;
    const url = `${origin}?boutique=${cleanSlug}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await mediaStorage.saveMediaFile(file, `logo-${sellerStore.id}`);
      setProfileLogo(res.url);
      setMediaStatusMsg('Photo de profil mise à jour avec succès !');
      setTimeout(() => setMediaStatusMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const res = await mediaStorage.saveMediaFile(file, `banner-${sellerStore.id}`);
      setProfileBanner(res.url);
      setMediaStatusMsg('Bannière de boutique mise à jour avec succès !');
      setTimeout(() => setMediaStatusMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleProductPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    setMediaStatusMsg(`Importation de ${files.length} photo(s) depuis votre appareil...`);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await mediaStorage.saveMediaFile(file, `prod-img-${Date.now()}-${i}`);
        newUrls.push(res.url);
      }
      setProdImages((prev) => [...prev.filter((u) => u.trim().length > 0), ...newUrls]);
      setMediaStatusMsg('Photos importées avec succès sans limite de taille !');
      setTimeout(() => setMediaStatusMsg(''), 3500);
    } catch (err) {
      console.error(err);
      setFormError("Une erreur est survenue lors de l'importation des photos.");
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const handleProductVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    const sizeStr = mediaStorage.formatFileSize(file.size);
    setMediaStatusMsg(`Importation de la vidéo (${sizeStr}) depuis votre appareil...`);
    try {
      const res = await mediaStorage.saveMediaFile(file, `prod-video-${Date.now()}`);
      setProdVideoUrl(res.url);
      setMediaStatusMsg(`Vidéo enregistrée avec succès (${sizeStr}) !`);
      setTimeout(() => setMediaStatusMsg(''), 3500);
    } catch (err) {
      console.error(err);
      setFormError("Une erreur est survenue lors du chargement de la vidéo.");
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = profileSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') || sellerStore.slug;
    const updated: Store = {
      ...sellerStore,
      name: profileStoreName.trim(),
      slug: cleanSlug,
      logo: profileLogo,
      banner: profileBanner,
      whatsapp: profileWhatsapp.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
      address: profileAddress.trim(),
      city: profileCity,
      category: profileCategory,
      description: profileDesc.trim(),
      slogan: profileSlogan.trim(),
      isOpen: profileIsOpen,
      whatsappOrderMessage: profileWhatsappOrderMessage.trim(),
      deliveryInstructions: profileDeliveryInstructions.trim(),
      lowStockThreshold: Number(profileLowStockThreshold) || 3,
      deliveryZones: profileDeliveryZones,
    };
    storageService.updateStore(updated);
    setProfileSaved(true);
    setMediaStatusMsg('Paramètres de la boutique enregistrés avec succès !');
    setTimeout(() => {
      setProfileSaved(false);
      setMediaStatusMsg('');
    }, 3500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (!newSellerPassword || newSellerPassword.length < 4) {
      setPasswordFeedback({ type: 'error', text: 'Le mot de passe doit comporter au moins 4 caractères.' });
      return;
    }
    if (newSellerPassword !== confirmSellerPassword) {
      setPasswordFeedback({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }

    const users = storageService.getUsers();
    const uIndex = users.findIndex((u) => u.id === currentUser.id);
    if (uIndex !== -1) {
      users[uIndex].password = newSellerPassword;
      localStorage.setItem('beninmarket_users', JSON.stringify(users));
      storageService.setCurrentUser(users[uIndex]);
      setNewSellerPassword('');
      setConfirmSellerPassword('');
      setPasswordFeedback({ type: 'success', text: 'Votre mot de passe vendeur a été modifié avec succès.' });
      setTimeout(() => setPasswordFeedback(null), 4000);
    }
  };

  const handleAddTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonialAuthor.trim() || !newTestimonialComment.trim()) return;
    const test: ProductTestimonial = {
      id: `testi-${Date.now()}`,
      author: newTestimonialAuthor.trim(),
      city: newTestimonialCity,
      rating: newTestimonialRating,
      comment: newTestimonialComment.trim(),
      date: new Date().toISOString(),
      verified: true,
    };
    setProdTestimonials([...prodTestimonials, test]);
    setNewTestimonialAuthor('');
    setNewTestimonialComment('');
  };

  const handleRemoveTestimonial = (id: string) => {
    setProdTestimonials(prodTestimonials.filter((t) => t.id !== id));
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Mode & Vêtements');
    setProdShortDesc('');
    setProdDesc('');
    setProdDetailedDesc('');
    setProdTestimonials([]);
    setProductModalTab('general');
    setProdPrice(10000);
    setProdPromoPrice(undefined);
    setProdIsPromoActive(false);
    setProdStock(10);
    setProdImages([]);
    setProdVideoUrl('');
    setProdWeight(0.5);
    setProdDimensions('');
    setFormError('');
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdShortDesc(p.shortDescription);
    setProdDesc(p.description);
    setProdDetailedDesc(p.detailedDescription || p.description || '');
    setProdTestimonials(p.testimonials || []);
    setProductModalTab('general');
    setProdPrice(p.price);
    setProdPromoPrice(p.promoPrice);
    setProdIsPromoActive(p.isPromoActive);
    setProdStock(p.stock);
    setProdImages(p.images && p.images.length > 0 ? p.images : []);
    setProdVideoUrl(p.videoUrl || '');
    setProdWeight(p.weightKg || 0.5);
    setProdDimensions(p.dimensions || '');
    setFormError('');
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!prodName.trim()) {
      setFormError('Le nom du produit est obligatoire.');
      return;
    }
    if (prodPrice <= 0) {
      setFormError('Le prix normal doit être supérieur à 0 FCFA.');
      return;
    }
    if (prodIsPromoActive && prodPromoPrice && prodPromoPrice >= prodPrice) {
      setFormError('Le prix promotionnel doit être strictement inférieur au prix normal.');
      return;
    }

    const finalImages = prodImages.filter((img) => img.trim().length > 0);
    if (finalImages.length === 0) {
      setFormError('Veuillez télécharger au moins une photo pour ce produit depuis votre appareil.');
      return;
    }

    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      storeId: sellerStore.id,
      name: prodName.trim(),
      slug: prodName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      shortDescription: prodShortDesc.trim() || prodName.trim(),
      description: prodDesc.trim() || prodName.trim(),
      detailedDescription: prodDetailedDesc.trim() || undefined,
      testimonials: prodTestimonials,
      category: prodCategory,
      price: Number(prodPrice),
      promoPrice: prodIsPromoActive && prodPromoPrice ? Number(prodPromoPrice) : undefined,
      isPromoActive: prodIsPromoActive,
      stock: Number(prodStock),
      images: prodImages.filter((img) => img.trim().length > 0),
      videoUrl: prodVideoUrl.trim() || undefined,
      weightKg: Number(prodWeight),
      dimensions: prodDimensions,
      isPublished: true,
      salesCount: editingProduct ? editingProduct.salesCount : 0,
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewCount: prodTestimonials.length > 0 ? prodTestimonials.length : (editingProduct ? editingProduct.reviewCount : 0),
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    storageService.saveProduct(newProduct);
    setProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Voulez-vous vraiment retirer ce produit de votre boutique ?')) {
      storageService.deleteProduct(id);
    }
  };

  const handleOpenConfirmDeliveryModal = (order: Order, sub: any) => {
    setConfirmDeliveryTarget({ order, sub });
    setConfirmDeliveryCashAmount(sub.cashCollected || sub.total);
  };

  const handleExecuteConfirmDelivery = () => {
    if (!confirmDeliveryTarget) return;
    const { order, sub } = confirmDeliveryTarget;
    const res = storageService.confirmDeliveryAndPayment(
      order.id,
      sub.id,
      confirmDeliveryCashAmount,
      sellerStore.name
    );
    if (res.success && res.order) {
      setJustDeliveredSuccessInfo({
        order: res.order,
        receiptNumber: res.order.receiptNumber || `REC-${res.order.id}`,
      });
    }
    setConfirmDeliveryTarget(null);
  };

  const handleUpdateOrderStatus = (orderId: string, subId: string, newStatus: OrderStatus) => {
    if (newStatus === 'LIVREE_ENCAISSEE') {
      const order = allOrders.find((o) => o.id === orderId);
      const sub = order?.subOrders.find((s) => s.id === subId);
      if (order && sub) {
        handleOpenConfirmDeliveryModal(order, sub);
        return;
      }
    }
    storageService.updateOrderStatus(orderId, newStatus, subId);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Banner / Store Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <img
              src={sellerStore.logo}
              alt={sellerStore.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-700 bg-slate-800 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate max-w-[200px] sm:max-w-md">{sellerStore.name}</h1>
                <span className="text-[10px] sm:text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold shrink-0">
                  Espace Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Vendeur à {sellerStore.city} · Paiement à la livraison
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsHighLoadModalOpen(true)}
              className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Voir les métriques de trafic en direct (10 000+ connexions simultanées)"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Trafic :</span>
              <span className="text-white">10 400+ En direct</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
              title="Configurer les paramètres de votre boutique"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Paramètres</span>
            </button>
            <button
              onClick={() => onOpenStorePublic(sellerStore.slug)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Aperçu vitrine</span>
            </button>
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau produit</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 text-xs font-semibold border-t border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tableau de bord commercial
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Gestion des Produits ({totalProducts})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Commandes clients ({totalOrdersCount})</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('abandoned_carts')}
            className={`py-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'abandoned_carts'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Paniers Abandonnés (IA)</span>
            {storeAbandonedCarts.length > 0 && (
              <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {storeAbandonedCarts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`py-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'promotions'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Promotions & Relances ({storeCustomers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Paramètres de la Boutique</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Status notification */}
        {mediaStatusMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mediaStatusMsg}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Custom Store Link & WhatsApp Sharing Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-5 border border-slate-700 shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Lien personnalisé de votre boutique
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Personnalisable
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 break-all font-mono">
                    <StoreIcon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>beninmarket.bj/boutique/{sellerStore.slug}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Partagez ce lien à vos clients sur vos statuts WhatsApp, Facebook et TikTok. Les commandes sont 100% payées à la livraison.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyStoreLink}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                    <span>{copiedLink ? 'Lien copié !' : 'Copier mon lien'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Découvrez les nouveautés de ma boutique ${sellerStore.name} sur BéninMarket ! Commandez dès maintenant sans carte bancaire avec paiement 100% à la livraison chez vous : https://beninmarket.bj/boutique/${sellerStore.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager sur WhatsApp</span>
                  </a>

                  <button
                    onClick={() => onOpenStorePublic(sellerStore.slug)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Aperçu en ligne</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Complete Analytics Strip: Clics, Ventes effectuées, Abandons de panier, Commandes, Succès livraison, Stock */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Analytique Commerciale de votre Boutique</span>
                </h2>
                <span className="text-xs text-slate-500">Mise à jour en temps réel</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Nombre de Clics & Visites */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Nombre de clics & Visites</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <MousePointer className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {storeViewsTotal.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500">clics</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span>{productsViewsTotal.toLocaleString('fr-FR')} vues cumulées sur vos fiches produits</span>
                  </p>
                </div>

                {/* 2. Ventes Effectuées & Encaissées */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Ventes effectuées & Encaissées</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 tabular-nums">
                    {formatFCFA(realCashCollected)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sur {deliveredCount} commandes livrées · Volume total: {formatFCFA(totalOrderBook)}
                  </p>
                </div>

                {/* 3. Abandons de Panier */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Abandons de Panier</span>
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-rose-600 tabular-nums">
                    {cartAbandonCount} <span className="text-xs font-normal text-slate-500">paniers</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Valeur estimée : <strong>{formatFCFA(cartAbandonTotal)}</strong> d'opportunités
                  </p>
                </div>

                {/* 4. Commandes en attente */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Commandes à traiter</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {pendingCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {inDeliveryCount} colis en cours d'acheminement par les livreurs
                  </p>
                </div>

                {/* 5. Taux de Succès Livraison */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Taux de succès livraison</span>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {totalOrdersCount > 0 ? `${Math.round((deliveredCount / totalOrdersCount) * 100)}%` : '100%'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {deliveredCount} livrées · {cancelledCount} retours/annulées
                  </p>
                </div>

                {/* 6. Stocks disponibles */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">Stock & Catalogue</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {totalUnitsInStock} <span className="text-xs font-normal text-slate-500">unités en stock</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Réparties sur {totalProducts} références d'articles actifs
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Link to Promotions Tab */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Faire la promotion de vos nouveaux produits auprès de vos clients
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Votre boutique a déjà enregistré <strong>{storeCustomers.length} clients acheteurs</strong> dans sa base de données. Envoyez-leur en 1 clic un message WhatsApp personnalisé pour leur présenter vos nouveautés !
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('promotions')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Ouvrir les Promotions Clients ({storeCustomers.length})</span>
              </button>
            </div>

            {/* Quick action banners */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  Paiement à la livraison : Rappel de fonctionnement
                </span>
                <p className="text-xs text-slate-700 mt-0.5">
                  Ne considérez jamais une commande comme encaissée tant que votre livreur n'a pas confirmé la remise du colis et l'encaissement des fonds en espèces.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 whitespace-nowrap cursor-pointer shrink-0"
              >
                Traiter les commandes ({pendingCount})
              </button>
            </div>

            {/* Recent Orders Table preview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Dernières commandes reçues pour {sellerStore.name}
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-amber-700 font-semibold hover:underline"
                >
                  Voir tout ({totalOrdersCount})
                </button>
              </div>

              {storeSubOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Aucune commande reçue pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Commande</th>
                        <th className="py-2.5 px-4">Client</th>
                        <th className="py-2.5 px-4">Articles</th>
                        <th className="py-2.5 px-4">Montant</th>
                        <th className="py-2.5 px-4">Statut COD</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {storeSubOrders.slice(0, 5).map((sub) => {
                        const parent = allOrders.find((o) => o.id === sub.orderId);
                        const conf = ORDER_STATUS_CONFIG[sub.status] || ORDER_STATUS_CONFIG.NOUVELLE;
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {sub.orderId}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold">{parent?.customerName}</div>
                              <div className="text-slate-400 text-[11px]">{parent?.city}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {sub.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                            </td>
                            <td className="py-3 px-4 font-bold tabular-nums">
                              {formatFCFA(sub.total)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${conf.bg} ${conf.color}`}>
                                {conf.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {parent && (
                                <button
                                  onClick={() => onPrintOrderReceipt(parent)}
                                  className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Reçu</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS (UNLIMITED CATALOG ENGINE) */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            {/* Unlimited Capacity & 10,000+ Concurrency Guarantee Banner */}
            <div className="p-4 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shrink-0 mt-0.5 shadow-xs">
                  ♾️
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Catalogue Illimité BéninMarket</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
                      Zéro Quota
                    </span>
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    Ajoutez autant d'articles physiques que vous le souhaitez dans votre boutique. L'infrastructure est optimisée pour gérer des catalogues de plusieurs milliers de références et accueillir <strong>plus de 10 000 visiteurs simultanés</strong> sans aucun ralentissement.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSalesCopyTargetProduct(null);
                    setIsSalesCopyModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Générer des titres, textes persuasifs et arguments de vente avec l'IA"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Rédacteur IA Vendeur</span>
                </button>
                <button
                  onClick={() => handleGenerateBatch(10)}
                  disabled={isBatchGenerating}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Ajouter 10 articles d'exemple pour tester la montée en charge du catalogue"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isBatchGenerating ? 'Ajout...' : '+10 Articles'}</span>
                </button>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un produit</span>
                </button>
              </div>
            </div>

            {/* Search, Category & Stock Filter Controls */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setProductPage(1);
                    }}
                    placeholder="Rechercher par nom d'article, catégorie..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-slate-900"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Stock status filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => {
                      setProductStockFilter('all');
                      setProductPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      productStockFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tous ({allProducts.length})
                  </button>
                  <button
                    onClick={() => {
                      setProductStockFilter('in_stock');
                      setProductPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      productStockFilter === 'in_stock'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    En stock
                  </button>
                  <button
                    onClick={() => {
                      setProductStockFilter('low_stock');
                      setProductPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      productStockFilter === 'low_stock'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Stock faible
                  </button>
                </div>
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['all', 'Mode & Vêtements', 'Artisanat & Décoration', 'Beauté & Soins Naturels', 'Électronique & High-Tech', 'Chaussures & Maroquinerie', 'Épicerie & Saveurs Locales'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setProductCategoryFilter(cat);
                      setProductPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer text-[11px] ${
                      productCategoryFilter === cat
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Toutes les catégories' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                <strong>{filteredProducts.length}</strong> {filteredProducts.length > 1 ? 'articles trouvés' : 'article trouvé'} dans votre boutique
              </span>
              <span>
                Page {productPage} sur {totalFilteredPages}
              </span>
            </div>

            {/* Products Grid */}
            {currentPaginatedProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">Aucun produit ne correspond à ces critères</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Essayez d'effacer votre recherche ou vos filtres pour voir l'ensemble des articles de votre catalogue.
                </p>
                <button
                  onClick={() => {
                    setProductSearch('');
                    setProductCategoryFilter('all');
                    setProductStockFilter('all');
                    setProductPage(1);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentPaginatedProducts.map((p) => {
                  const discount = calculateDiscountPercent(p.price, p.promoPrice);
                  const isLow = p.stock <= (sellerStore.lowStockThreshold || 3);
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="relative aspect-16/9 rounded-lg overflow-hidden bg-slate-100 mb-3">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80'}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                          {discount > 0 && (
                            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              -{discount}%
                            </span>
                          )}
                          {p.videoUrl && (
                            <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Video className="w-3 h-3 text-amber-400" />
                              <span>Démo vidéo</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-bold uppercase text-amber-800 mb-1">
                          {p.category}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm mb-1">{p.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.shortDescription}</p>

                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-base font-extrabold text-slate-900 tabular-nums">
                            {formatFCFA(p.isPromoActive && p.promoPrice ? p.promoPrice : p.price)}
                          </span>
                          {discount > 0 && (
                            <span className="text-xs text-slate-400 line-through tabular-nums">
                              {formatFCFA(p.price)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                          <span className={isLow ? 'text-amber-700 font-bold' : ''}>
                            Stock : <strong>{p.stock}</strong> {isLow && '(Faible)'}
                          </span>
                          <span>{p.salesCount || 0} vendus</span>
                        </div>
                      </div>

                      {/* Card Action Buttons: Modifier, Dupliquer, Supprimer */}
                      <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between gap-1 text-xs">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="font-semibold text-slate-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50"
                          title="Modifier les informations"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Modifier</span>
                        </button>

                        <button
                          onClick={() => handleDuplicateProduct(p.id)}
                          className="font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-amber-50"
                          title="Dupliquer instantanément cet article"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-600" />
                          <span>Dupliquer</span>
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-rose-50"
                          title="Supprimer cet article"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalFilteredPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
                  disabled={productPage === 1}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Page précédente</span>
                </button>

                <div className="flex items-center gap-1 text-xs">
                  {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => setProductPage(num)}
                      className={`w-8 h-8 rounded-lg font-bold transition cursor-pointer ${
                        productPage === num
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setProductPage((prev) => Math.min(totalFilteredPages, prev + 1))}
                  disabled={productPage === totalFilteredPages}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Page suivante</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Clients ayant commandé vos articles ({storeSubOrders.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Retrouvez ici tous les clients ayant validé une commande pour vos articles, leurs coordonnées précises pour la livraison au Bénin et contactez-les directement par téléphone ou WhatsApp.
              </p>
            </div>

            <div className="space-y-4">
              {storeSubOrders.map((sub) => {
                const parent = allOrders.find((o) => o.id === sub.orderId);
                const conf = ORDER_STATUS_CONFIG[sub.status] || ORDER_STATUS_CONFIG.NOUVELLE;

                return (
                  <div key={sub.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            Commande {sub.orderId}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${conf.bg} ${conf.color}`}>
                            {conf.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Date : {parent ? formatDateFR(parent.createdAt) : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Total à encaisser :</span>
                          <span className="text-base font-bold text-slate-900 tabular-nums">
                            {formatFCFA(sub.total)}
                          </span>
                        </div>
                        {parent && (
                          <button
                            onClick={() => onPrintOrderReceipt(parent)}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Imprimer le bon de livraison"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-amber-800">
                            Client ayant commandé
                          </span>
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm mb-1">{parent?.customerName}</div>
                        <div className="text-slate-600 flex items-center gap-1.5 mb-2 font-medium">
                          <Phone className="w-3.5 h-3.5 text-amber-600" />
                          <span>{parent?.customerPhone}</span>
                          {parent?.customerEmail && (
                            <span className="text-slate-400 text-[11px] truncate">({parent.customerEmail})</span>
                          )}
                        </div>

                        {/* Direct Seller-to-Customer contact actions */}
                        <div className="flex items-center gap-2 pt-1">
                          {parent?.customerPhone && (
                            <a
                              href={`https://wa.me/${parent.customerPhone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(parent.customerName || '')},%20je%20suis%20le%20vendeur%20${encodeURIComponent(sellerStore.name)}%20sur%20BéninMarket%20concernant%20votre%20commande%20${encodeURIComponent(sub.orderId)}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp client</span>
                            </a>
                          )}
                          {parent?.customerPhone && (
                            <a
                              href={`tel:${parent.customerPhone}`}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>Appeler</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-slate-500 block mb-1">
                          Adresse & Repères de livraison
                        </span>
                        <div className="font-bold text-slate-900">{parent?.neighborhood}, {parent?.city}</div>
                        <div className="text-slate-700 mt-0.5">{parent?.deliveryAddress}</div>
                        {parent?.deliveryInstructions && (
                          <div className="mt-1.5 p-2 bg-amber-50/70 border border-amber-200/60 rounded text-slate-700 italic text-[11px]">
                            Repères : "{parent.deliveryInstructions}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-slate-800 block">Articles :</span>
                      {sub.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded">
                          <div className="flex items-center gap-2">
                            <img src={i.productImage} alt="" className="w-8 h-8 rounded object-cover" />
                            <div>
                              <span className="font-medium text-slate-900">{i.productName}</span>
                              {i.selectedVariants && (
                                <span className="text-slate-500 text-[11px] block">
                                  {Object.entries(i.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold tabular-nums">
                            {formatFCFA(i.unitPrice)} × {i.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Status Management & Delivery Actions Bar */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-700">Statut :</span>
                        <select
                          value={sub.status}
                          onChange={(e) => handleUpdateOrderStatus(sub.orderId, sub.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="NOUVELLE">Nouvelle commande</option>
                          <option value="CONFIRMEE">Confirmée (client appelé)</option>
                          <option value="EN_PREPARATION">En préparation</option>
                          <option value="PRETE_EXPEDITION">Prête à expédier</option>
                          <option value="EN_COURS_LIVRAISON">En cours de livraison (livreur en route)</option>
                          <option value="LIVREE_ENCAISSEE">✓ Livrée & Encaissée (Paiement reçu)</option>
                          <option value="ANNULEE">Annulée</option>
                          <option value="LIVRAISON_ECHOUEE">Livraison échouée (client absent)</option>
                        </select>

                        {sub.status !== 'LIVREE_ENCAISSEE' && parent && (
                          <button
                            type="button"
                            onClick={() => handleOpenConfirmDeliveryModal(parent, sub)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                            title="Valider la livraison et envoyer automatiquement le reçu de paiement par Email et WhatsApp"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmer la livraison effectuée</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {parent && (
                          <button
                            type="button"
                            onClick={() => setViewBonDeCommandeOrder(parent)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Consulter le Bon de Commande officiel"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>Bon de Commande</span>
                          </button>
                        )}

                        {sub.status === 'LIVREE_ENCAISSEE' && parent && (
                          <>
                            <button
                              type="button"
                              onClick={() => setViewPaymentReceiptOrder(parent)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Consulter le reçu de paiement acquitté avec tampon officiel"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Reçu de Paiement</span>
                            </button>

                            {parent.customerPhone && (
                              <a
                                href={`https://wa.me/${parent.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                  `Bonjour ${parent.customerName || ''},\nVotre commande ${parent.id} a bien été livrée et encaissée !\nVoici votre reçu de paiement acquitté N° ${parent.receiptNumber || `REC-${parent.id}`} d'un montant de ${formatFCFA(sub.cashCollected || sub.total)}.\nMerci pour votre confiance sur BéninMarket !`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Envoyer le reçu directement au client sur WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Reçu WhatsApp</span>
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: ABANDONED CARTS & AI RECOVERY */}
        {activeTab === 'abandoned_carts' && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200 block mb-1">
                  MODULE D'INTELLIGENCE ARTIFICIELLE
                </span>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Relance Intelligente des Paniers Abandonnés</span>
                </h2>
                <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
                  L'IA analyse le panier de chaque visiteur non finalisé et rédige des messages WhatsApp et Email ultra-persuasifs et chaleureux pour convaincre le client de commander avec paiement à la livraison (Cash on Delivery).
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
                  <div className="text-2xl font-black">{storeAbandonedCarts.length}</div>
                  <div className="text-[10px] text-amber-200 uppercase font-semibold">Paniers en attente</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
                  <div className="text-2xl font-black">
                    {formatFCFA(storeAbandonedCarts.reduce((sum, c) => sum + c.totalAmount, 0))}
                  </div>
                  <div className="text-[10px] text-amber-200 uppercase font-semibold">Montant récupérable</div>
                </div>
              </div>
            </div>

            {/* List of abandoned carts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Paniers laissés en cours dans votre boutique ({storeAbandonedCarts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cliquez sur « Relancer avec l'IA » pour générer un message personnalisé et l'envoyer directement en 1 clic sur WhatsApp.
                  </p>
                </div>
              </div>

              {storeAbandonedCarts.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-xs space-y-2">
                  <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">Aucun panier abandonné actuellement dans votre boutique !</p>
                  <p className="text-slate-400">
                    Dès qu'un client ajoute vos articles au panier sans aller au bout de la commande, il apparaîtra ici avec l'assistant de relance IA.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {storeAbandonedCarts.map((cart) => {
                    const cleanPhone = (cart.customerPhone || '').replace(/[^\d+]/g, '');
                    return (
                      <div
                        key={cart.id}
                        className="p-4 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl space-y-3 transition-colors text-xs flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          {/* Client Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{cart.customerName}</span>
                                {cart.status === 'relanced' && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                                    Relancé ({cart.recoveryAttemptsCount}x)
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5 flex flex-wrap gap-x-3">
                                {cart.customerPhone && (
                                  <span className="font-semibold text-slate-700">📱 {cart.customerPhone}</span>
                                )}
                                {cart.customerCity && <span>📍 {cart.customerCity}</span>}
                              </div>
                            </div>
                            <span className="font-black text-amber-700 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-lg text-xs tabular-nums">
                              {formatFCFA(cart.totalAmount)}
                            </span>
                          </div>

                          {/* Items in cart */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="font-bold text-slate-700 text-[11px] block">
                              Articles réservés dans le panier :
                            </span>
                            {cart.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 text-slate-700 text-[11px]">
                                <span className="truncate">{it.quantity}x {it.productName}</span>
                                <span className="font-semibold tabular-nums shrink-0">{formatFCFA(it.price * it.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Date and Activity */}
                          <div className="text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Abandonné le {new Date(cart.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {cart.lastRecoverySentAt && (
                              <span className="text-emerald-700 font-semibold">
                                Dernière relance : {new Date(cart.lastRecoverySentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecoveryCart(cart);
                              setIsCartRecoveryModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                            <span>Relancer avec l'IA</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                                  `Bonjour ${cart.customerName} ! C'est ${sellerStore.name} sur BéninMarket. Vos articles (${cart.items.map((i) => i.productName).join(', ')}) sont réservés. Vous réglez 100% à la livraison chez vous. Souhaitez-vous que nous expédions votre commande ?`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Relance rapide directe sur WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => storageService.deleteAbandonedCart(cart.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Retirer ce panier de la liste"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMER PROMOTIONS & MARKETING DATABASE */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200 block mb-1">
                  Base de Données Clients & Marketing WhatsApp
                </span>
                <h2 className="text-xl font-black tracking-tight">
                  Promouvoir vos nouveaux produits auprès de vos clients
                </h2>
                <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
                  Relancez directement les clients ayant déjà commandé dans votre boutique. Les clients qui vous font déjà confiance sont 5x plus susceptibles de commander vos nouveautés en paiement à la livraison !
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0">
                <span className="text-2xl font-black text-white block">
                  {storeCustomers.length}
                </span>
                <span className="text-[11px] text-amber-200 font-semibold">
                  Clients dans votre base
                </span>
              </div>
            </div>

            {/* Campaign Creator Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Créateur de Message Promotionnel (Nouveau Produit / Promo Spéciale)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    1. Choisissez le produit à promouvoir :
                  </label>
                  <select
                    value={selectedPromoProductId}
                    onChange={(e) => setSelectedPromoProductId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                  >
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatFCFA(p.isPromoActive && p.promoPrice ? p.promoPrice : p.price)} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>

                  <div className="mt-3">
                    <label className="block font-semibold text-slate-700 mb-1">
                      2. Note personnalisée ou avantage offert (optionnel) :
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Livraison express en 24h offerte pour vous aujourd'hui !"
                      value={promoCustomNote}
                      onChange={(e) => setPromoCustomNote(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Live Message Preview */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Aperçu du message WhatsApp généré
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetProd = allProducts.find((p) => p.id === selectedPromoProductId) || allProducts[0];
                        if (!targetProd) return;
                        const priceToPay = targetProd.isPromoActive && targetProd.promoPrice ? targetProd.promoPrice : targetProd.price;
                        const msg = `Bonjour ! 🌟\nVotre boutique *${sellerStore.name}* a le plaisir de vous présenter sa nouvelle arrivée sur BéninMarket :\n\n✨ *${targetProd.name}*\n💰 Prix spécial : *${formatFCFA(priceToPay)}* (Paiement 100% à la livraison chez vous au Bénin)\n📦 Stock disponible : ${targetProd.stock} unités\n${promoCustomNote ? `🎁 Note : ${promoCustomNote}\n` : ''}\n👉 Commandez en 1 clic sans carte bancaire : ${typeof window !== 'undefined' ? window.location.origin : 'https://beninmarket.bj'}?boutique=${sellerStore.slug}\n\nÀ très bientôt chez ${sellerStore.name} !`;
                        navigator.clipboard?.writeText(msg);
                        setCopiedPromoText(true);
                        setTimeout(() => setCopiedPromoText(false), 2500);
                      }}
                      className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-200"
                    >
                      {copiedPromoText ? 'Copié !' : 'Copier pour statut WhatsApp'}
                    </button>
                  </div>

                  {(() => {
                    const targetProd = allProducts.find((p) => p.id === selectedPromoProductId) || allProducts[0];
                    if (!targetProd) return <div className="text-slate-400 italic">Sélectionnez un produit ci-contre.</div>;
                    const priceToPay = targetProd.isPromoActive && targetProd.promoPrice ? targetProd.promoPrice : targetProd.price;
                    return (
                      <div className="p-3 bg-white rounded-lg border border-emerald-200 text-slate-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        Bonjour *[Nom du client]* ! 🌟{'\n'}
                        Votre boutique *{sellerStore.name}* a le plaisir de vous présenter sa nouvelle arrivée sur BéninMarket :{'\n\n'}
                        ✨ *{targetProd.name}*{'\n'}
                        💰 Prix : *{formatFCFA(priceToPay)}* (Paiement 100% à la livraison chez vous au Bénin){'\n'}
                        📦 Stock : {targetProd.stock} unités{'\n'}
                        {promoCustomNote && <span>🎁 Note : {promoCustomNote}{'\n'}</span>}
                        👉 Commandez en 1 clic : {typeof window !== 'undefined' ? window.location.origin : 'https://beninmarket.bj'}?boutique={sellerStore.slug}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Customer List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Vos clients enregistrés ({storeCustomers.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Envoyez la promotion directement sur le WhatsApp de chaque client en 1 clic.
                  </p>
                </div>
              </div>

              {storeCustomers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Aucun client n'a encore finalisé de commande dans votre boutique. Dès qu'un acheteur commande l'un de vos articles, ses coordonnées apparaîtront automatiquement ici pour vos campagnes de relance.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {storeCustomers.map((c, idx) => {
                    const targetProd = allProducts.find((p) => p.id === selectedPromoProductId) || allProducts[0];
                    const priceToPay = targetProd ? (targetProd.isPromoActive && targetProd.promoPrice ? targetProd.promoPrice : targetProd.price) : 0;
                    const promoMessage = `Bonjour ${c.name} ! 🌟\nVotre boutique *${sellerStore.name}* a le plaisir de vous présenter sa nouvelle collection sur BéninMarket :\n\n✨ *${targetProd?.name || 'Notre nouveau produit'}*\n💰 Prix spécial : *${formatFCFA(priceToPay)}* (Paiement 100% à la livraison chez vous à ${c.city})\n📦 Stock restant : ${targetProd?.stock || 0} unités\n${promoCustomNote ? `🎁 ${promoCustomNote}\n` : ''}\n👉 Commandez ici en 1 clic : ${typeof window !== 'undefined' ? window.location.origin : 'https://beninmarket.bj'}?boutique=${sellerStore.slug}\n\nÀ très vite !`;

                    const cleanPhone = c.whatsapp.replace(/[^0-9]/g, '');

                    return (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                            <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{c.phone}</span>
                              <span>·</span>
                              <span>{c.city}</span>
                            </div>
                          </div>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {c.ordersCount} commande{c.ordersCount > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          Total commandé : <strong>{formatFCFA(c.totalSpent)}</strong>
                        </div>

                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(promoMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer la promo sur WhatsApp</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: COMPREHENSIVE STORE SETTINGS (PARAMÈTRES DE LA BOUTIQUE) */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-600" />
                  <span>Paramètres Personnels de votre Boutique</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gérez l'identité visuelle, vos coordonnées WhatsApp, vos zones de livraison au Bénin, vos préférences COD et la sécurité de votre compte vendeur.
                </p>
              </div>

              {/* Store Status Indicator & Toggle */}
              <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className={`w-2.5 h-2.5 rounded-full ${profileIsOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold text-slate-800">
                  {profileIsOpen ? 'Boutique Ouverte' : 'Mode Pause / Congés'}
                </span>
                <button
                  type="button"
                  onClick={() => setProfileIsOpen(!profileIsOpen)}
                  className={`ml-2 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    profileIsOpen
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  {profileIsOpen ? 'Mettre en pause' : 'Ouvrir la boutique'}
                </button>
              </div>
            </div>

            {profileSaved && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tous les paramètres de votre boutique ont été enregistrés avec succès !</span>
              </div>
            )}

            {/* Sub-navigation Tabs for Settings */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSettingsSection('identity')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSection === 'identity'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <StoreIcon className="w-3.5 h-3.5" />
                <span>1. Identité & Vitrine</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSection('whatsapp')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSection === 'whatsapp'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Canaux WhatsApp & Contact</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSection('delivery')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSection === 'delivery'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Zones & Tarifs Livraison</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSection('cod')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSection === 'cod'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Préférences COD & Alertes</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSection('security')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  settingsSection === 'security'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>5. Sécurité & Mot de passe</span>
              </button>
            </div>

            <form onSubmit={handleSaveStoreProfile} className="space-y-6">
              {/* SECTION 1: IDENTITÉ & VITRINE */}
              {settingsSection === 'identity' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Identité Visuelle & Présentation</h3>
                    <p className="text-[11px] text-slate-500">
                      Téléversez votre logo et bannière directement depuis vos fichiers sans lien externe.
                    </p>
                  </div>

                  {/* Photo de profil (Logo) direct upload */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-900 block text-xs">
                      Photo de profil / Logo de votre boutique (depuis votre téléphone ou ordinateur)
                    </span>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <img
                        src={mediaStorage.resolveUrl(profileLogo) || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80'}
                        alt="Logo boutique"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xs bg-white shrink-0"
                      />
                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <label className="cursor-pointer px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-xs">
                          <Upload className="w-4 h-4" />
                          <span>{uploadingLogo ? 'Importation en cours...' : 'Télécharger une photo de profil depuis votre appareil'}</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Prend en charge JPG, PNG, WEBP sans aucune restriction de lien externe.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bannière de la boutique direct upload */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="font-bold text-slate-900 block text-xs">
                      Bannière d'en-tête de votre vitrine (depuis votre appareil)
                    </span>
                    <div className="space-y-3">
                      <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={mediaStorage.resolveUrl(profileBanner) || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'}
                          alt="Bannière boutique"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-xs">
                          <Upload className="w-4 h-4" />
                          <span>{uploadingBanner ? 'Importation...' : 'Télécharger une bannière depuis votre appareil'}</span>
                          <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                        </label>
                        <span className="text-[11px] text-slate-500">Format recommandé : paysage (1200x400)</span>
                      </div>
                    </div>
                  </div>

                  {/* Lien personnalisé (Slug) */}
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                    <label className="block font-bold text-slate-900">
                      Lien de boutique personnalisé (URL unique) *
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                      <span className="px-3 py-2.5 bg-white border border-slate-300 sm:border-r-0 rounded-t-lg sm:rounded-tr-none sm:rounded-l-lg text-slate-500 text-xs font-mono select-all">
                        beninmarket.bj/boutique/
                      </span>
                      <input
                        type="text"
                        required
                        value={profileSlug}
                        onChange={(e) => setProfileSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                        placeholder="nom-de-votre-boutique"
                        className="flex-1 p-2.5 bg-white border border-slate-300 rounded-b-lg sm:rounded-bl-none sm:rounded-r-lg font-mono font-bold text-slate-900 text-xs focus:outline-amber-600"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Lien direct à partager sur vos statuts WhatsApp, TikTok et Instagram.</span>
                      <button
                        type="button"
                        onClick={handleCopyStoreLink}
                        className="text-amber-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedLink ? 'Copié !' : 'Copier mon lien'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Nom commercial de la boutique *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileStoreName}
                        onChange={(e) => setProfileStoreName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Catégorie principale d'activité *
                      </label>
                      <select
                        value={profileCategory}
                        onChange={(e) => setProfileCategory(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
                      >
                        <option value="Mode & Vêtements">Mode & Vêtements</option>
                        <option value="Chaussures & Maroquinerie">Chaussures & Maroquinerie</option>
                        <option value="Téléphones & Électronique">Téléphones & Électronique</option>
                        <option value="Beauté & Cosmétiques">Beauté & Cosmétiques</option>
                        <option value="Maison & Décoration">Maison & Décoration</option>
                        <option value="Alimentation & Épicerie">Alimentation & Épicerie</option>
                        <option value="Équipements & Bricolage">Équipements & Bricolage</option>
                        <option value="Enfants & Bébés">Enfants & Bébés</option>
                        <option value="Bijoux & Accessoires">Bijoux & Accessoires</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Slogan ou phrase d'accroche (affichée sous le nom)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : Créations artisanales et mode béninoise d'exception"
                      value={profileSlogan}
                      onChange={(e) => setProfileSlogan(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Description complète de votre boutique
                    </label>
                    <textarea
                      rows={3}
                      value={profileDesc}
                      onChange={(e) => setProfileDesc(e.target.value)}
                      placeholder="Présentez vos créations, votre savoir-faire et vos engagements de satisfaction..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 2: CANAUX WHATSAPP & CONTACT */}
              {settingsSection === 'whatsapp' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Coordonnées Directes & WhatsApp Vendeur</h3>
                    <p className="text-[11px] text-slate-500">
                      Les acheteurs pourront vous contacter en cas de question sur leur commande ou de retard de livraison.
                    </p>
                  </div>

                  {/* Direct WhatsApp Configuration */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                    <div>
                      <label className="block font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>Numéro WhatsApp direct de votre boutique *</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          required
                          placeholder="+229 97 00 11 22"
                          value={profileWhatsapp}
                          onChange={(e) => setProfileWhatsapp(e.target.value)}
                          className="flex-1 p-2.5 bg-white border border-emerald-300 rounded-lg font-bold text-slate-900 focus:outline-emerald-600 text-sm"
                        />
                        {profileWhatsapp && (
                          <a
                            href={`https://wa.me/${profileWhatsapp.replace(/[^0-9]/g, '')}?text=Bonjour%20depuis%20BéninMarket`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Tester mon WhatsApp</span>
                          </a>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-800 block mt-1">
                        Format international recommandé (ex : <strong>+229 97 00 11 22</strong>). Les clients recevront ce contact sur leur reçu de commande.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>Numéro pour appels vocaux direct *</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+229 97 00 11 22"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>Email professionnel de notification *</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="vendeur@gmail.com"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ville principale d'implantation *</span>
                      </label>
                      <select
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                      >
                        <option value="Cotonou">Cotonou</option>
                        <option value="Abomey-Calavi">Abomey-Calavi</option>
                        <option value="Porto-Novo">Porto-Novo</option>
                        <option value="Parakou">Parakou</option>
                        <option value="Ouidah">Ouidah</option>
                        <option value="Bohicon">Bohicon</option>
                        <option value="Natitingou">Natitingou</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-800 mb-1">
                        Adresse physique ou repères d'entrepôt
                      </label>
                      <input
                        type="text"
                        placeholder="Ex : Haie Vive, Rue 340, Carré 120"
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: ZONES & FRAIS DE LIVRAISON */}
              {settingsSection === 'delivery' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Zones & Tarifs de Livraison au Bénin</h3>
                    <p className="text-[11px] text-slate-500">
                      Configurez les villes que vous desservez et vos frais de livraison en FCFA avec vos délais estimés.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {profileDeliveryZones.map((zone, idx) => (
                      <div
                        key={zone.id || idx}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{zone.city}</span>
                            <span className="text-[11px] text-slate-500 block">
                              Délai moyen : {zone.estimatedHours}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-600">Frais :</span>
                            <input
                              type="number"
                              min="0"
                              step="250"
                              value={zone.fee}
                              onChange={(e) => {
                                const newFee = Number(e.target.value) || 0;
                                setProfileDeliveryZones((prev) =>
                                  prev.map((z, i) => (i === idx ? { ...z, fee: newFee } : z))
                                );
                              }}
                              className="w-24 p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs text-right"
                            />
                            <span className="font-bold text-slate-600">FCFA</span>
                          </div>

                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                            Actif
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Consignes spéciales de livraison (transmises au livreur)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={profileDeliveryInstructions}
                      onChange={(e) => setProfileDeliveryInstructions(e.target.value)}
                      placeholder="Ex : Paiement en espèces obligatoire à la réception. Appeler le client 30 minutes avant de se déplacer."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 4: PRÉFÉRENCES COD & ALERTES */}
              {settingsSection === 'cod' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Modèle Commercial & Paiement à la Livraison (COD)</h3>
                    <p className="text-[11px] text-slate-500">
                      Règles de paiement en espèces à la livraison, messages automatiques et gestion des alertes.
                    </p>
                  </div>

                  {/* COD Guarantee banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-emerald-900 text-sm">
                        Modèle Commercial Garanti : 100% Cash on Delivery
                      </div>
                      <p className="text-emerald-800 leading-relaxed text-[11px]">
                        Conformément à la politique de BéninMarket, aucun paiement en ligne n'est demandé à l'acheteur. Vos clients règlent directement votre livreur en espèces lors de la remise en main propre de leur colis.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Modèle de message WhatsApp automatique envoyé au client lors de sa commande</span>
                    </label>
                    <textarea
                      rows={4}
                      value={profileWhatsappOrderMessage}
                      onChange={(e) => setProfileWhatsappOrderMessage(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Ce message peut être envoyé en 1 clic au client depuis votre onglet « Commandes clients ».
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Seuil d'alerte pour stock faible (unités restantes)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={profileLowStockThreshold}
                        onChange={(e) => setProfileLowStockThreshold(Number(e.target.value) || 1)}
                        className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-center"
                      />
                      <span className="text-slate-600">unités (vos produits afficheront une alerte visuelle en dessous de ce stock)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: SÉCURITÉ & STATUT COMPTE */}
              {settingsSection === 'security' && (
                <div className="space-y-6">
                  {/* Store Status Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Power className="w-4 h-4 text-amber-600" />
                        <span>Statut de Disponibilité de la Boutique</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Vous pouvez suspendre temporairement la réception de nouvelles commandes si vous êtes en réapprovisionnement ou en congés.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${profileIsOpen ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{profileIsOpen ? 'Boutique Actuellement Ouverte' : 'Boutique en Pause'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {profileIsOpen
                            ? 'Vos produits sont visibles et les clients peuvent passer commande avec paiement à la livraison.'
                            : 'Vos produits restent consultables mais le bouton de commande est temporairement désactivé.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setProfileIsOpen(!profileIsOpen)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                          profileIsOpen
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {profileIsOpen ? 'Mettre en pause' : 'Réactiver la boutique'}
                      </button>
                    </div>
                  </div>

                  {/* Password Change Form */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        <span>Modifier mon mot de passe Vendeur</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Sécurisez l'accès à votre tableau de bord personnel.
                      </p>
                    </div>

                    {passwordFeedback && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                          passwordFeedback.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        {passwordFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{passwordFeedback.text}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={newSellerPassword}
                          onChange={(e) => setNewSellerPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-800 mb-1">
                          Confirmer le nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={confirmSellerPassword}
                          onChange={(e) => setConfirmSellerPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUpdatePassword}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Mettre à jour mon mot de passe
                    </button>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-slate-900">Informations du compte vendeur :</div>
                    <div>Gérant : <strong>{currentUser.name}</strong></div>
                    <div>Email associé : <strong>{currentUser.email}</strong></div>
                    <div>ID Boutique : <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">{sellerStore.id}</code></div>
                  </div>
                </div>
              )}

              {/* Global Save Button */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  Toutes les modifications sont immédiatement synchronisées sur votre boutique publique.
                </span>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm text-xs flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer les paramètres de ma boutique</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Modifier le produit' : 'Publier un nouveau produit physique'}
              </h2>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100 text-xs font-semibold p-1">
              <button
                type="button"
                onClick={() => setProductModalTab('general')}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  productModalTab === 'general'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>1. Infos & Prix</span>
              </button>

              <button
                type="button"
                onClick={() => setProductModalTab('description')}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  productModalTab === 'description'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Page Description</span>
              </button>

              <button
                type="button"
                onClick={() => setProductModalTab('testimonials')}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  productModalTab === 'testimonials'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-600" />
                <span>3. Témoignages ({prodTestimonials.length})</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="overflow-y-auto p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TAB 1: GENERAL & PRICING */}
              {productModalTab === 'general' && (
                <div className="space-y-4">
                  {/* Name & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Nom du produit *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setSalesCopyTargetProduct({
                              name: prodName,
                              category: prodCategory,
                              price: prodPrice,
                              benefits: prodFeatures.join(', '),
                            });
                            setIsSalesCopyModalOpen(true);
                          }}
                          className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>✨ Rédiger avec l'IA</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Blazer en Wax Royal..."
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Catégorie *</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Mode & Vêtements">Mode & Vêtements</option>
                        <option value="Chaussures & Maroquinerie">Chaussures & Maroquinerie</option>
                        <option value="Téléphones & Électronique">Téléphones & Électronique</option>
                        <option value="Maison & Décoration">Maison & Décoration</option>
                        <option value="Beauté, Karité & Cosmétiques">Beauté, Karité & Cosmétiques</option>
                        <option value="Alimentation & Produits Locaux">Alimentation & Produits Locaux</option>
                        <option value="Équipements & Accessoires">Équipements & Accessoires</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Prix normal (FCFA) *</label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={prodPrice}
                        onChange={(e) => setProdPrice(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Prix Promo (FCFA)</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodIsPromoActive}
                            onChange={(e) => setProdIsPromoActive(e.target.checked)}
                            className="accent-amber-600"
                          />
                          <span className="text-[10px] text-amber-800 font-bold">Activer</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        disabled={!prodIsPromoActive}
                        placeholder="Ex: 8500"
                        value={prodPromoPrice || ''}
                        onChange={(e) => setProdPromoPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Quantité en stock *</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={prodStock}
                        onChange={(e) => setProdStock(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Live Discount calculation notice */}
                  {prodIsPromoActive && prodPromoPrice && prodPromoPrice < prodPrice && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded text-[11px] font-semibold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        Réduction automatique affichée aux clients : -{calculateDiscountPercent(prodPrice, prodPromoPrice)}%
                      </span>
                    </div>
                  )}

                  {/* Photo & Video Direct Upload from Device (No Size Limits) */}
                  <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span>Photos du produit (Appareil ou Génération IA Web)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSalesCopyTargetProduct({
                              name: prodName || 'Nouveau Produit',
                              category: prodCategory,
                              price: prodPrice,
                              benefits: prodFeatures.join(', '),
                            });
                            setIsSalesCopyModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Générer Images IA (Recherche Web)</span>
                        </button>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                          {prodImages.filter((u) => u.trim().length > 0).length} photo(s)
                        </span>
                      </div>
                    </div>

                    {/* Photo Upload Zone */}
                    <label className="cursor-pointer border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-2xs">
                      <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          {uploadingPhotos ? 'Importation des photos en cours...' : 'Télécharger des photos depuis votre appareil (Téléphone ou PC)'}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Sélectionnez une ou plusieurs photos depuis votre galerie ou disque · <strong>Aucune limite de taille</strong>
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleProductPhotosUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Uploaded Photos Gallery Preview */}
                    {prodImages.filter((u) => u.trim().length > 0).length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-slate-600 block">
                          Photos sélectionnées pour ce produit :
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {prodImages
                            .filter((u) => u.trim().length > 0)
                            .map((imgUrl, idx) => (
                              <div
                                key={idx}
                                className={`relative rounded-xl overflow-hidden border-2 bg-white aspect-square shadow-xs group ${
                                  idx === 0 ? 'border-amber-600 ring-2 ring-amber-600/20' : 'border-slate-200'
                                }`}
                              >
                                <img
                                  src={mediaStorage.resolveUrl(imgUrl)}
                                  alt={`Aperçu ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />

                                {idx === 0 && (
                                  <span className="absolute top-1.5 left-1.5 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                    ★ Principale
                                  </span>
                                )}

                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                  {idx !== 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const reordered = [imgUrl, ...prodImages.filter((_, i) => i !== idx)];
                                        setProdImages(reordered);
                                      }}
                                      className="p-1 bg-amber-500 text-slate-950 rounded text-[9px] font-bold hover:bg-amber-400 cursor-pointer"
                                      title="Définir comme photo principale"
                                    >
                                      Principale
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProdImages(prodImages.filter((_, i) => i !== idx));
                                    }}
                                    className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                                    title="Supprimer cette photo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Video Upload Section */}
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-emerald-600" />
                          <span>Vidéo de démonstration du produit (sans limite de taille)</span>
                        </span>
                        {prodVideoUrl && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            ✓ Vidéo configurée
                          </span>
                        )}
                      </div>

                      {!prodVideoUrl ? (
                        <label className="cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-2xs">
                          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition-transform">
                            <Film className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">
                              {uploadingVideo ? 'Chargement de la vidéo...' : 'Télécharger une vidéo depuis votre appareil (Téléphone ou PC)'}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Fichiers MP4, MOV, WebM... · <strong>Aucune limite de taille</strong> · Permet aux clients de voir l'article en réel
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleProductVideoUpload}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                          <div className="rounded-lg overflow-hidden bg-black max-h-52 flex items-center justify-center">
                            <video
                              src={mediaStorage.resolveUrl(prodVideoUrl)}
                              controls
                              className="w-full max-h-52 object-contain"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Vidéo prête pour la fiche produit</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                <span>Remplacer la vidéo</span>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleProductVideoUpload}
                                  className="hidden"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => setProdVideoUrl('')}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery specifications */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Poids estimé (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={prodWeight}
                        onChange={(e) => setProdWeight(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dimensions colis</label>
                      <input
                        type="text"
                        value={prodDimensions}
                        onChange={(e) => setProdDimensions(e.target.value)}
                        placeholder="Ex: 30 x 20 x 10 cm"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RICH PRODUCT DESCRIPTION PAGE */}
              {productModalTab === 'description' && (
                <div className="space-y-4">
                  {/* AI Copywriting Assistant Banner */}
                  <div className="p-3 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-amber-500/15 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <strong className="block font-bold text-xs text-amber-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Vous ne savez pas quoi écrire ? Laissez faire l'IA !</span>
                      </strong>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        L'IA génère en quelques secondes un titre accrocheur, une description persuasive et des arguments Cash on Delivery.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSalesCopyTargetProduct({
                          name: prodName,
                          category: prodCategory,
                          price: prodPrice,
                          benefits: prodFeatures.join(', '),
                        });
                        setIsSalesCopyModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all self-start sm:self-center"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Rédiger avec l'IA</span>
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Brève phrase d'accroche (affichée sous le titre)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Authentique création béninoise tissée à la main, durable et élégante."
                      value={prodShortDesc}
                      onChange={(e) => setProdShortDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Description complète & Caractéristiques détaillées
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Décrivez en détail votre produit : matière, finitions, taille, utilisation, pourquoi le client doit l'acheter..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Page de description avancée & Fiche technique (optionnel)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Section technique ou histoire du produit : conseils d'entretien, guide des tailles, garantie fabricant..."
                      value={prodDetailedDesc}
                      onChange={(e) => setProdDetailedDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: TESTIMONIALS & REVIEWS MANAGEMENT */}
              {productModalTab === 'testimonials' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                    <strong className="block font-bold mb-0.5 text-xs">Gestion des Témoignages & Avis Clients</strong>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      Ajoutez des retours d'expérience et témoignages de clients satisfaits. Ces avis augmentent fortement le taux de commande en paiement à la livraison.
                    </p>
                  </div>

                  {/* Form to add a testimonial */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="font-bold text-slate-900 block text-xs">Ajouter un nouveau témoignage client</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nom du client *</label>
                        <input
                          type="text"
                          placeholder="Ex: Roland AKOBI"
                          value={newTestimonialAuthor}
                          onChange={(e) => setNewTestimonialAuthor(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ville au Bénin</label>
                        <select
                          value={newTestimonialCity}
                          onChange={(e) => setNewTestimonialCity(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Cotonou">Cotonou</option>
                          <option value="Abomey-Calavi">Abomey-Calavi</option>
                          <option value="Porto-Novo">Porto-Novo</option>
                          <option value="Parakou">Parakou</option>
                          <option value="Ouidah">Ouidah</option>
                          <option value="Bohicon">Bohicon</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Note attribuée</label>
                        <select
                          value={newTestimonialRating}
                          onChange={(e) => setNewTestimonialRating(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-600"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ 5/5</option>
                          <option value={4}>⭐⭐⭐⭐ 4/5</option>
                          <option value={3}>⭐⭐⭐ 3/5</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Témoignage du client *</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Reçu en 24h à Cotonou, excellente qualité conforme aux photos. J'ai réglé le coursier à la réception sans problème !"
                        value={newTestimonialComment}
                        onChange={(e) => setNewTestimonialComment(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddTestimonial}
                      disabled={!newTestimonialAuthor.trim() || !newTestimonialComment.trim()}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter ce témoignage</span>
                    </button>
                  </div>

                  {/* List of current testimonials */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">
                      Témoignages configurés sur ce produit ({prodTestimonials.length}) :
                    </span>
                    {prodTestimonials.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">
                        Aucun témoignage ajouté. Vous pouvez en ajouter ci-dessus.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {prodTestimonials.map((t) => (
                          <div key={t.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{t.author}</span>
                                <span className="text-[10px] text-slate-500 font-medium">({t.city})</span>
                                <div className="flex text-amber-500">
                                  {Array.from({ length: t.rating }).map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-current" />
                                  ))}
                                </div>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                  ✓ Client vérifié
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px] leading-relaxed">
                                « {t.comment} »
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTestimonial(t.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer shrink-0"
                              title="Supprimer ce témoignage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex gap-2">
                  {productModalTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => setProductModalTab(productModalTab === 'testimonials' ? 'description' : 'general')}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer"
                    >
                      Précédent
                    </button>
                  )}
                  {productModalTab !== 'testimonials' && (
                    <button
                      type="button"
                      onClick={() => setProductModalTab(productModalTab === 'general' ? 'description' : 'testimonials')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 font-semibold cursor-pointer"
                    >
                      Suivant
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    {editingProduct ? 'Enregistrer les modifications' : 'Publier le produit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High Concurrency Monitor Modal (10,000+ Visitors) */}
      <HighLoadMonitorModal
        isOpen={isHighLoadModalOpen}
        onClose={() => setIsHighLoadModalOpen(false)}
        totalProductsCount={allProducts.length}
      />

      {/* AI Sales Copy Modal */}
      <AISalesCopyModal
        isOpen={isSalesCopyModalOpen}
        onClose={() => setIsSalesCopyModalOpen(false)}
        initialProductName={salesCopyTargetProduct?.name || ''}
        initialCategory={salesCopyTargetProduct?.category || 'Mode & Vêtements'}
        initialPrice={salesCopyTargetProduct?.price}
        initialBenefits={salesCopyTargetProduct?.benefits || ''}
        storeName={sellerStore.name}
        onApplyCopy={(copy) => {
          if (copy.title) {
            setProdName(copy.title);
            setProdShortDesc(copy.title.slice(0, 90));
          }
          if (copy.description) {
            setProdDesc(copy.description);
            setProdDetailedDesc(copy.description);
          }
          if (copy.features && copy.features.length > 0) {
            setProdFeatures(copy.features);
          }
          if (copy.images && copy.images.length > 0) {
            setProdImages((prev) => {
              const merged = [...copy.images!, ...prev.filter((u) => u.trim().length > 0)];
              return Array.from(new Set(merged));
            });
          }
          if (copy.testimonials && copy.testimonials.length > 0) {
            setProdTestimonials((prev) => [...copy.testimonials!, ...prev]);
          }
          setProductModalOpen(true);
          setProductModalTab(copy.description ? 'description' : 'general');
        }}
      />

      {/* AI Cart Recovery Modal */}
      <AICartRecoveryModal
        isOpen={isCartRecoveryModalOpen}
        onClose={() => {
          setIsCartRecoveryModalOpen(false);
          setSelectedRecoveryCart(null);
        }}
        cart={selectedRecoveryCart}
        storeName={sellerStore.name}
        onRecoverySent={(cartId, channel, msg) => {
          storageService.recordRecoveryAttempt(cartId, channel, msg);
        }}
      />

      {/* Confirm Delivery & Cash Modal */}
      {confirmDeliveryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Confirmer la livraison & Encaissement COD
                </h3>
              </div>
              <button
                onClick={() => setConfirmDeliveryTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{confirmDeliveryTarget.order.customerName}</div>
                <div className="text-slate-600">📱 {confirmDeliveryTarget.order.customerPhone}</div>
                <div className="text-slate-600">✉️ {confirmDeliveryTarget.order.customerEmail}</div>
                <div className="text-slate-600">📍 {confirmDeliveryTarget.order.neighborhood}, {confirmDeliveryTarget.order.city}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Montant en espèces réellement encaissé (FCFA) :
                </label>
                <input
                  type="number"
                  value={confirmDeliveryCashAmount}
                  onChange={(e) => setConfirmDeliveryCashAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
                <strong className="block font-bold">Automatisation immédiate :</strong>
                <p>
                  En validant, la commande passe au statut <strong>Livrée & Encaissée</strong>. Le client recevra automatiquement son <strong>Reçu de Paiement officiel acquitté</strong> par Email et une notification préparée pour WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeliveryTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmDelivery}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Valider l'encaissement et émettre le Reçu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Success Popup */}
      {justDeliveredSuccessInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Livraison Validée & Encaissée !</h3>
              <p className="text-xs text-slate-600 mt-1">
                Le reçu officiel <strong>N° {justDeliveredSuccessInfo.receiptNumber}</strong> a été transmis à l'adresse <strong>{justDeliveredSuccessInfo.order.customerEmail}</strong>.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {justDeliveredSuccessInfo.order.customerPhone && (
                <a
                  href={`https://wa.me/${justDeliveredSuccessInfo.order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Bonjour ${justDeliveredSuccessInfo.order.customerName} !\nVotre commande ${justDeliveredSuccessInfo.order.id} a été livrée avec succès.\nVoici votre reçu de paiement acquitté N° ${justDeliveredSuccessInfo.receiptNumber} d'un montant de ${formatFCFA(justDeliveredSuccessInfo.order.grandTotal)} payé en Cash on Delivery.\nMerci pour vos achats sur BéninMarket !`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Envoyer la confirmation sur WhatsApp au client</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setViewPaymentReceiptOrder(justDeliveredSuccessInfo.order);
                  setJustDeliveredSuccessInfo(null);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Voir le Reçu de Paiement officiel</span>
              </button>

              <button
                type="button"
                onClick={() => setJustDeliveredSuccessInfo(null)}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bon de Commande Modal */}
      <BonDeCommandeModal
        order={viewBonDeCommandeOrder}
        isOpen={!!viewBonDeCommandeOrder}
        onClose={() => setViewBonDeCommandeOrder(null)}
      />

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        order={viewPaymentReceiptOrder}
        isOpen={!!viewPaymentReceiptOrder}
        onClose={() => setViewPaymentReceiptOrder(null)}
      />
    </div>
  );
};

