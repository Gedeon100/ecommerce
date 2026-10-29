import {
  User,
  Store,
  Product,
  Order,
  SellerSubOrder,
  CartItem,
  ProductReview,
  PlatformSettings,
  OrderStatus,
  SupportTicket,
  StoreCustomer,
  AbandonedCart,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
  INITIAL_REVIEWS,
  DEFAULT_DELIVERY_ZONES,
} from '../data/initialData';
import { generateOrderId } from '../utils/formatters';

export const INITIAL_ABANDONED_CARTS: AbandonedCart[] = [
  {
    id: 'cart-ab-1',
    storeId: 'danxome-creations',
    customerName: 'Gaston Koudjo',
    customerPhone: '+229 97 12 34 56',
    customerEmail: 'gaston.koudjo@gmail.com',
    customerCity: 'Cotonou (Cadjehoun)',
    items: [
      {
        id: 'c-item-1',
        productId: 'prod-wax-blazer',
        storeId: 'danxome-creations',
        productName: 'Veste Blazer Wax Imprimé Royal',
        productImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
        price: 28500,
        normalPrice: 35000,
        quantity: 1,
        selectedVariants: { 'Taille': 'XL', 'Couleur': 'Indigo & Or' },
      },
    ],
    totalAmount: 28500,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastActivityAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'abandoned',
    recoveryAttemptsCount: 0,
  },
  {
    id: 'cart-ab-2',
    storeId: 'danxome-creations',
    customerName: 'Nadège Houessou',
    customerPhone: '+229 95 88 44 22',
    customerEmail: 'nadege.houessou@yahoo.fr',
    customerCity: 'Abomey-Calavi (Tankpè)',
    items: [
      {
        id: 'c-item-2',
        productId: 'prod-wax-tote',
        storeId: 'danxome-creations',
        productName: 'Sac Cabas Cuir & Tissage Kanvô',
        productImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
        price: 18000,
        normalPrice: 22000,
        quantity: 1,
        selectedVariants: { 'Finition': 'Marron Havane' },
      },
    ],
    totalAmount: 18000,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    lastActivityAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: 'abandoned',
    recoveryAttemptsCount: 0,
  },
  {
    id: 'cart-ab-3',
    storeId: 'adjovi-bio',
    customerName: 'Akim Dossou',
    customerPhone: '+229 66 11 22 33',
    customerEmail: 'akim.dossou@hotmail.com',
    customerCity: 'Porto-Novo',
    items: [
      {
        id: 'c-item-3',
        productId: 'prod-shea-butter',
        storeId: 'adjovi-bio',
        productName: 'Beurre de Karité Brut Pur & Bio 500g',
        productImage: 'https://images.unsplash.com/photo-1608248597359-32204c3e8964?auto=format&fit=crop&w=600&q=80',
        price: 4500,
        normalPrice: 5500,
        quantity: 2,
      },
    ],
    totalAmount: 9000,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastActivityAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'abandoned',
    recoveryAttemptsCount: 0,
  },
];

const STORAGE_KEYS = {
  USERS: 'beninmarket_users',
  CURRENT_USER: 'beninmarket_current_user',
  STORES: 'beninmarket_stores',
  PRODUCTS: 'beninmarket_products',
  ORDERS: 'beninmarket_orders',
  REVIEWS: 'beninmarket_reviews',
  CART: 'beninmarket_cart',
  SETTINGS: 'beninmarket_settings',
  TICKETS: 'beninmarket_support_tickets',
  ABANDONED_CARTS: 'beninmarket_abandoned_carts',
  INITIALIZED: 'beninmarket_initialized_v2',
};

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[4])); // Default to Brice Mensah (Buyer/Customer)
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(INITIAL_STORES));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      // Sync Owner Admin identity to kazottimahutondj@gmail.com
      try {
        const users = this.getUsers();
        const adminIdx = users.findIndex((u) => u.role === 'admin' || u.email?.toLowerCase() === 'kazottimahutondj@gmail.com');
        if (adminIdx >= 0) {
          if (
            users[adminIdx].email !== 'kazottimahutondj@gmail.com' ||
            users[adminIdx].password !== 'Samuell@8' ||
            users[adminIdx].role !== 'admin'
          ) {
            users[adminIdx].email = 'kazottimahutondj@gmail.com';
            users[adminIdx].password = 'Samuell@8';
            users[adminIdx].role = 'admin';
            users[adminIdx].name = 'Propriétaire BéninMarket (Administrateur)';
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          }
        } else {
          users.unshift({
            id: 'user-admin',
            name: 'Propriétaire BéninMarket (Administrateur)',
            email: 'kazottimahutondj@gmail.com',
            password: 'Samuell@8',
            phone: '+229 97 00 11 22',
            whatsapp: '+229 97 00 11 22',
            role: 'admin',
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
        const current = this.getCurrentUser();
        if (current?.role === 'admin' && current.email?.toLowerCase() !== 'kazottimahutondj@gmail.com') {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
        const existingReviews = this.getReviews();
        if (existingReviews.length === 0) {
          localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
        }
      } catch (err) {
        // ignore
      }

      // Sync initial testimonials and detailed description if missing
      try {
        const storedProds = this.getProducts();
        let modified = false;
        storedProds.forEach((p) => {
          if (p.id === 'prod-wax-blazer' && !p.detailedDescription) {
            p.detailedDescription = INITIAL_PRODUCTS[0].detailedDescription;
            p.testimonials = INITIAL_PRODUCTS[0].testimonials;
            modified = true;
          }
        });
        if (modified) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(storedProds));
        }
      } catch (err) {
        // ignore
      }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- CURRENT USER & AUTH ---
  public getCurrentUser(): User | null {
    if (typeof window === 'undefined') return INITIAL_USERS[1];
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  public getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  }

  public registerBuyer(userData: {
    firstName: string;
    lastName: string;
    phone: string;
    whatsapp?: string;
    email: string;
    password?: string;
  }): User {
    const users = this.getUsers();
    const fullName = `${userData.firstName.trim()} ${userData.lastName.trim().toUpperCase()}`;

    // Check if email already registered
    const existing = users.find((u) => u.email.toLowerCase() === userData.email.trim().toLowerCase());
    if (existing) {
      this.setCurrentUser(existing);
      return existing;
    }

    const newUser: User = {
      id: `user-buyer-${Date.now()}`,
      name: fullName,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim().toUpperCase(),
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone.trim(),
      whatsapp: (userData.whatsapp || userData.phone).trim(),
      password: userData.password || '123',
      role: 'customer',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    return newUser;
  }

  public registerSeller(userData: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phone: string;
    whatsapp?: string;
    password?: string;
    storeName: string;
    storeCity: string;
    storeCategory: string;
    storeDescription?: string;
  }): { user: User; store: Store } {
    const users = this.getUsers();
    const stores = this.getStores();

    const storeId = `store-${Date.now()}`;
    const slug = userData.storeName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const fullName = userData.name || `${userData.firstName || ''} ${(userData.lastName || '').toUpperCase()}`.trim() || 'Vendeur Indépendant';

    const newStore: Store = {
      id: storeId,
      sellerId: `user-seller-${Date.now()}`,
      name: userData.storeName,
      slug: slug || `boutique-${Date.now()}`,
      logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      description: userData.storeDescription || `Boutique officielle ${userData.storeName} au Bénin. Produits physiques de qualité avec paiement à la livraison.`,
      category: userData.storeCategory,
      phone: userData.phone,
      whatsapp: (userData.whatsapp || userData.phone).replace(/\s+/g, ''),
      email: userData.email,
      address: userData.storeCity,
      city: userData.storeCity,
      isVerified: true, // Auto-verified for seamless start
      rating: 5.0,
      reviewCount: 0,
      deliveryZones: DEFAULT_DELIVERY_ZONES,
      createdAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: newStore.sellerId,
      name: fullName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone.trim(),
      whatsapp: (userData.whatsapp || userData.phone).trim(),
      password: userData.password || '123',
      role: 'seller',
      storeId: newStore.id,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    stores.push(newStore);

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    this.setCurrentUser(newUser);

    return { user: newUser, store: newStore };
  }

  public loginUser(identifier: string, password?: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanPhone = (identifier || '').replace(/[^0-9]/g, '');

    // Strict Owner Administrator authentication: kazottimahutondj@gmail.com / Samuell@8
    if (cleanId === 'kazottimahutondj@gmail.com') {
      if (cleanPass !== 'Samuell@8') {
        return { success: false, error: 'Mot de passe administrateur incorrect.' };
      }
      let admin = users.find((u) => u.email.toLowerCase() === 'kazottimahutondj@gmail.com' || u.role === 'admin');
      if (!admin) {
        admin = {
          id: 'user-admin',
          name: 'Propriétaire BéninMarket (Administrateur)',
          email: 'kazottimahutondj@gmail.com',
          password: 'Samuell@8',
          phone: '+229 97 00 11 22',
          whatsapp: '+229 97 00 11 22',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        users.unshift(admin);
      } else {
        admin.email = 'kazottimahutondj@gmail.com';
        admin.password = 'Samuell@8';
        admin.role = 'admin';
        admin.name = 'Propriétaire BéninMarket (Administrateur)';
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.setCurrentUser(admin);
      return { success: true, user: admin };
    }

    const matched = users.find((u) => {
      if (u.role === 'admin') return false;
      const matchEmail = u.email.toLowerCase() === cleanId;
      const matchPhone = cleanPhone.length > 6 && u.phone.replace(/[^0-9]/g, '').includes(cleanPhone);
      return matchEmail || matchPhone;
    });

    if (matched) {
      if (cleanPass && matched.password && matched.password !== cleanPass) {
        return { success: false, error: 'Mot de passe incorrect pour ce compte.' };
      }
      if (matched.isBlocked) {
        return {
          success: false,
          error: 'Ce compte vendeur a été bloqué par l’administrateur de BéninMarket.',
        };
      }
      if (matched.role === 'seller') {
        const sellerStore = this.getStores().find(
          (s) => s.id === matched.storeId || s.sellerId === matched.id
        );
        if (sellerStore?.isBlocked) {
          return {
            success: false,
            error: `La boutique « ${sellerStore.name} » est actuellement bloquée par l’administrateur (${sellerStore.blockReason || 'Suspension administrative'}).`,
          };
        }
      }
      this.setCurrentUser(matched);
      return { success: true, user: matched };
    }

    return { success: false, error: 'Aucun compte trouvé avec cet e-mail ou numéro WhatsApp.' };
  }

  public logout(): void {
    this.setCurrentUser(null);
  }

  // --- STORES ---
  public getStores(): Store[] {
    const data = localStorage.getItem(STORAGE_KEYS.STORES);
    return data ? JSON.parse(data) : INITIAL_STORES;
  }

  public getStoreById(id: string): Store | undefined {
    return this.getStores().find((s) => s.id === id);
  }

  public getStoreBySlug(slug: string): Store | undefined {
    return this.getStores().find((s) => s.slug === slug);
  }

  public updateStore(store: Store): void {
    const stores = this.getStores();
    const index = stores.findIndex((s) => s.id === store.id);
    if (index !== -1) {
      stores[index] = store;
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
      this.notify();
    }
  }

  public toggleStoreBlock(storeId: string, block: boolean, reason?: string): Store | null {
    const stores = this.getStores();
    const idx = stores.findIndex((s) => s.id === storeId);
    if (idx === -1) return null;

    const targetStore = stores[idx];
    const updatedStore: Store = {
      ...targetStore,
      isBlocked: block,
      blockReason: block ? (reason?.trim() || 'Suspension administrative par le propriétaire') : undefined,
      blockedAt: block ? new Date().toISOString() : undefined,
    };
    stores[idx] = updatedStore;
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));

    // Sync seller user account blocked flag
    const users = this.getUsers();
    let usersModified = false;
    users.forEach((u) => {
      if (u.role === 'seller' && (u.id === targetStore.sellerId || u.storeId === storeId)) {
        u.isBlocked = block;
        usersModified = true;
      }
    });
    if (usersModified) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    // Remove blocked store's items from active buyer cart and sign out seller if active
    if (block) {
      const cart = this.getCart().filter((item) => item.storeId !== storeId);
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));

      const current = this.getCurrentUser();
      if (current?.role === 'seller' && (current.id === targetStore.sellerId || current.storeId === storeId)) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }

    this.notify();
    return updatedStore;
  }

  public deleteSellerAndStore(storeId: string): {
    deletedStoreName: string;
    deletedSellerName: string;
    deletedProductsCount: number;
  } {
    const stores = this.getStores();
    const targetStore = stores.find((s) => s.id === storeId);
    const deletedStoreName = targetStore?.name || 'Boutique supprimée';

    // Remove store
    const remainingStores = stores.filter((s) => s.id !== storeId);
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(remainingStores));

    // Remove associated seller user(s)
    const users = this.getUsers();
    const sellerUser = users.find(
      (u) => u.role === 'seller' && (u.storeId === storeId || (targetStore && u.id === targetStore.sellerId))
    );
    const deletedSellerName = sellerUser?.name || 'Vendeur';
    const remainingUsers = users.filter(
      (u) => !(u.role === 'seller' && (u.storeId === storeId || (targetStore && u.id === targetStore.sellerId)))
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remainingUsers));

    // Remove all products belonging to this store
    const allProducts = this.getProducts();
    const remainingProducts = allProducts.filter((p) => p.storeId !== storeId);
    const deletedProductsCount = allProducts.length - remainingProducts.length;
    this.cachedProducts = remainingProducts;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(remainingProducts));

    // Clean up reviews, cart items, and abandoned carts for this store
    const remainingReviews = this.getReviews().filter((r) => r.storeId !== storeId);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(remainingReviews));

    const remainingCart = this.getCart().filter((c) => c.storeId !== storeId);
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(remainingCart));

    try {
      const abRaw = localStorage.getItem(STORAGE_KEYS.ABANDONED_CARTS);
      if (abRaw) {
        const abList: AbandonedCart[] = JSON.parse(abRaw);
        localStorage.setItem(
          STORAGE_KEYS.ABANDONED_CARTS,
          JSON.stringify(abList.filter((a) => a.storeId !== storeId))
        );
      }
    } catch {
      // ignore
    }

    // Sign out if current user was the deleted seller
    const current = this.getCurrentUser();
    if (
      current?.role === 'seller' &&
      (current.storeId === storeId || (targetStore && current.id === targetStore.sellerId))
    ) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }

    this.notify();
    return { deletedStoreName, deletedSellerName, deletedProductsCount };
  }

  public recordProductView(productId: string): void {
    const products = this.getProducts();
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      p.viewsCount = (p.viewsCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      this.recordStoreView(p.storeId);
      this.notify();
    }
  }

  public recordStoreView(storeId: string): void {
    const stores = this.getStores();
    const s = stores.find((st) => st.id === storeId);
    if (s) {
      s.viewsCount = (s.viewsCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
      this.notify();
    }
  }

  public recordCartAbandon(storeId: string, amount: number): void {
    const stores = this.getStores();
    const s = stores.find((st) => st.id === storeId);
    if (s) {
      s.cartAbandonCount = (s.cartAbandonCount || 0) + 1;
      s.cartAbandonTotal = (s.cartAbandonTotal || 0) + amount;
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
      this.notify();
    }
  }

  public getStoreCustomers(storeId: string): StoreCustomer[] {
    const orders = this.getOrdersByStore(storeId);
    const map = new Map<string, StoreCustomer>();

    orders.forEach((o) => {
      const sub = o.subOrders.find((s) => s.storeId === storeId);
      if (!sub) return;

      const key = o.customerPhone.replace(/[^0-9]/g, '') || o.customerEmail || o.customerName;
      const existing = map.get(key);
      const itemsNames = sub.items.map((i) => i.productName);

      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += sub.total;
        if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
        }
        itemsNames.forEach((n) => {
          if (!existing.lastOrderedItems.includes(n)) {
            existing.lastOrderedItems.push(n);
          }
        });
      } else {
        map.set(key, {
          name: o.customerName,
          phone: o.customerPhone,
          whatsapp: o.customerPhone,
          email: o.customerEmail,
          city: o.city || 'Cotonou',
          ordersCount: 1,
          totalSpent: sub.total,
          lastOrderDate: o.createdAt,
          lastOrderedItems: itemsNames,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );
  }

  // --- PRODUCTS (UNLIMITED CAPACITY ARCHITECTURE) ---
  private cachedProducts: Product[] | null = null;

  public getProducts(): Product[] {
    if (this.cachedProducts) {
      return this.cachedProducts;
    }
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const prods: Product[] = data ? JSON.parse(data) : INITIAL_PRODUCTS;
    this.cachedProducts = prods;
    return prods;
  }

  public getProductsByStore(storeId: string): Product[] {
    return this.getProducts().filter((p) => p.storeId === storeId);
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public saveProduct(product: Product): void {
    const products = [...this.getProducts()];
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    this.cachedProducts = products;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (quotaError) {
      console.warn('[BéninMarket Storage] Quota localStorage atteint avec un catalogue massif. Sauvegarde en mémoire vive / cache actif.', quotaError);
    }
    this.notify();
  }

  /**
   * Sauvegarde un lot complet de produits en une seule passe pour éviter les re-rendus saccadés.
   */
  public saveProductsBatch(newProducts: Product[]): void {
    const current = [...this.getProducts()];
    const merged = [...newProducts, ...current.filter((c) => !newProducts.some((np) => np.id === c.id))];
    this.cachedProducts = merged;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(merged));
    } catch (quotaError) {
      console.warn('[BéninMarket Storage] Sauvegarde de lot massif dans le cache haute performance.', quotaError);
    }
    this.notify();
  }

  /**
   * Duplication instantanée d'un article pour expansion rapide du catalogue vendeur.
   */
  public duplicateProduct(productId: string): Product | null {
    const product = this.getProductById(productId);
    if (!product) return null;

    const cloned: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${product.name} (Copie)`,
      slug: `${product.slug}-copie-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      salesCount: 0,
    };

    this.saveProduct(cloned);
    return cloned;
  }

  /**
   * Génère un lot de démonstration pour tester la capacité illimitée (10, 25, 50 articles au choix).
   */
  public generateUnlimitedDemoBatch(storeId: string, count = 10): Product[] {
    const store = this.getStoreById(storeId) || this.getStores()[0];
    const categories = [
      'Mode & Vêtements',
      'Artisanat & Décoration',
      'Beauté & Soins Naturels',
      'Électronique & High-Tech',
      'Chaussures & Maroquinerie',
      'Épicerie & Saveurs Locales',
    ];

    const templates = [
      { name: 'Robe Brodée Wax Akwaba', cat: 'Mode & Vêtements', price: 18500, img: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80' },
      { name: 'Beurre de Karité Pur du Nord Bénin (500g)', cat: 'Beauté & Soins Naturels', price: 4500, img: 'https://images.unsplash.com/photo-1608248597359-59754f9a08e6?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sandales Cuir Artisanal Dassa', cat: 'Chaussures & Maroquinerie', price: 12000, img: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?auto=format&fit=crop&w=600&q=80' },
      { name: 'Écouteurs Sans Fil Pro Bass TWS', cat: 'Électronique & High-Tech', price: 14000, img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80' },
      { name: 'Tableau Toile Peinte Danxomè', cat: 'Artisanat & Décoration', price: 25000, img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80' },
      { name: 'Montre Quartz Bracelet Cuir Sauvage', cat: 'Électronique & High-Tech', price: 19500, img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Chemise Homme Lin & Broderie Royale', cat: 'Mode & Vêtements', price: 22000, img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80' },
      { name: 'Savon Noir Africain & Miel Pur (Lot de 3)', cat: 'Beauté & Soins Naturels', price: 3500, img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sac à Main Cuir Wax & Finitions Dorées', cat: 'Chaussures & Maroquinerie', price: 16500, img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80' },
      { name: 'Miel Sauvage d’Atacora (Pot 1kg)', cat: 'Épicerie & Saveurs Locales', price: 6000, img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80' },
    ];

    const generated: Product[] = [];
    for (let i = 0; i < count; i++) {
      const tmpl = templates[i % templates.length];
      const seq = Math.floor(i / templates.length) + 1;
      const name = seq > 1 ? `${tmpl.name} Série #${seq}` : tmpl.name;
      const isPromo = i % 3 === 0;

      generated.push({
        id: `prod-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        storeId: store.id,
        name,
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
        category: tmpl.cat,
        shortDescription: `Article officiel haute qualité sélectionné par ${store.name}. Paiement à la livraison au Bénin.`,
        description: `Produit authentique de la boutique ${store.name}. Expédition rapide sur Cotonou, Calavi, Porto-Novo et tout le Bénin. Vérification du colis avant paiement en espèces.`,
        detailedDescription: `Spécifications détaillées :\n- Origine : Bénin & Afrique de l'Ouest\n- Garantie : Contrôle qualité à l'emballage\n- Mode de règlement : 100% Cash on Delivery (0 FCFA prélevé en ligne).`,
        price: tmpl.price,
        promoPrice: isPromo ? Math.round(tmpl.price * 0.85) : undefined,
        isPromoActive: isPromo,
        stock: 15 + (i * 2),
        images: [tmpl.img],
        isPublished: true,
        featured: i < 3,
        rating: 5.0,
        reviewCount: Math.floor(Math.random() * 12) + 1,
        salesCount: Math.floor(Math.random() * 25),
        viewsCount: Math.floor(Math.random() * 150) + 10,
        createdAt: new Date().toISOString(),
      });
    }

    this.saveProductsBatch(generated);
    return generated;
  }

  public deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    this.cachedProducts = products;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      // ignore
    }
    this.notify();
  }

  // --- CART ---
  public getCart(): CartItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.CART);
    return data ? JSON.parse(data) : [];
  }

  public addToCart(item: Omit<CartItem, 'id'>): void {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(
      (c) =>
        c.productId === item.productId &&
        JSON.stringify(c.selectedVariants || {}) === JSON.stringify(item.selectedVariants || {})
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += item.quantity;
    } else {
      cart.push({ ...item, id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` });
    }
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    this.notify();
  }

  public updateCartQuantity(itemId: string, quantity: number): void {
    let cart = this.getCart();
    if (quantity <= 0) {
      cart = cart.filter((i) => i.id !== itemId);
    } else {
      const item = cart.find((i) => i.id === itemId);
      if (item) item.quantity = quantity;
    }
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    this.notify();
  }

  public clearCart(): void {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
    this.notify();
  }

  // --- ABANDONED CARTS (PANIER ABANDONNÉ & RELANCE IA) ---
  public getAbandonedCarts(): AbandonedCart[] {
    const data = localStorage.getItem(STORAGE_KEYS.ABANDONED_CARTS);
    return data ? JSON.parse(data) : INITIAL_ABANDONED_CARTS;
  }

  public getAbandonedCartsByStore(storeId: string): AbandonedCart[] {
    return this.getAbandonedCarts().filter((c) => c.storeId === storeId);
  }

  public recordAbandonedCart(cartData: {
    storeId: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerCity?: string;
    items: CartItem[];
    totalAmount: number;
  }): AbandonedCart {
    const carts = this.getAbandonedCarts();
    const existingIndex = carts.findIndex(
      (c) =>
        c.storeId === cartData.storeId &&
        ((cartData.customerPhone && c.customerPhone === cartData.customerPhone) ||
          (cartData.customerEmail && c.customerEmail === cartData.customerEmail))
    );

    const now = new Date().toISOString();
    let recordedCart: AbandonedCart;

    if (existingIndex >= 0) {
      carts[existingIndex].items = cartData.items;
      carts[existingIndex].totalAmount = cartData.totalAmount;
      carts[existingIndex].lastActivityAt = now;
      if (cartData.customerName) carts[existingIndex].customerName = cartData.customerName;
      if (cartData.customerCity) carts[existingIndex].customerCity = cartData.customerCity;
      recordedCart = carts[existingIndex];
    } else {
      recordedCart = {
        id: `cart-ab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        storeId: cartData.storeId,
        customerName: cartData.customerName || 'Visiteur BéninMarket',
        customerPhone: cartData.customerPhone || '',
        customerEmail: cartData.customerEmail || '',
        customerCity: cartData.customerCity || 'Cotonou',
        items: cartData.items,
        totalAmount: cartData.totalAmount,
        createdAt: now,
        lastActivityAt: now,
        status: 'abandoned',
        recoveryAttemptsCount: 0,
      };
      carts.unshift(recordedCart);
    }

    localStorage.setItem(STORAGE_KEYS.ABANDONED_CARTS, JSON.stringify(carts));
    this.notify();
    return recordedCart;
  }

  public recordRecoveryAttempt(cartId: string, channel: 'whatsapp' | 'email', message?: string): void {
    const carts = this.getAbandonedCarts();
    const cart = carts.find((c) => c.id === cartId);
    if (!cart) return;

    cart.recoveryAttemptsCount = (cart.recoveryAttemptsCount || 0) + 1;
    cart.lastRecoverySentAt = new Date().toISOString();
    cart.lastRecoveryChannel = channel;
    cart.status = 'relanced';
    if (message) cart.lastGeneratedRecoveryMessage = message;

    localStorage.setItem(STORAGE_KEYS.ABANDONED_CARTS, JSON.stringify(carts));
    this.notify();
  }

  public markCartRecovered(cartId: string): void {
    const carts = this.getAbandonedCarts();
    const cart = carts.find((c) => c.id === cartId);
    if (!cart) return;

    cart.status = 'recovered';
    localStorage.setItem(STORAGE_KEYS.ABANDONED_CARTS, JSON.stringify(carts));
    this.notify();
  }

  public deleteAbandonedCart(cartId: string): void {
    const carts = this.getAbandonedCarts().filter((c) => c.id !== cartId);
    localStorage.setItem(STORAGE_KEYS.ABANDONED_CARTS, JSON.stringify(carts));
    this.notify();
  }

  // --- ORDERS ---
  public getOrders(): Order[] {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : INITIAL_ORDERS;
  }

  public getOrdersByStore(storeId: string): Order[] {
    return this.getOrders().filter((o) =>
      o.subOrders.some((sub) => sub.storeId === storeId)
    );
  }

  public getOrderByIdOrCode(idOrCode: string): Order | undefined {
    const search = idOrCode.trim().toUpperCase();
    return this.getOrders().find(
      (o) => o.id.toUpperCase() === search || o.trackingCode.toUpperCase() === search
    );
  }

  public createOrder(orderPayload: {
    customerFirstName: string;
    customerLastName: string;
    customerName?: string;
    customerPhone: string;
    customerEmail: string;
    city: string;
    neighborhood: string;
    deliveryAddress: string;
    deliveryInstructions?: string;
    items: CartItem[];
  }): Order {
    const orderId = generateOrderId();
    const stores = this.getStores();

    // Group items by store to create suborders
    const itemsByStore: Record<string, CartItem[]> = {};
    orderPayload.items.forEach((item) => {
      if (!itemsByStore[item.storeId]) {
        itemsByStore[item.storeId] = [];
      }
      itemsByStore[item.storeId].push(item);
    });

    let totalProductsAmount = 0;
    let totalDeliveryFee = 0;
    const subOrders: SellerSubOrder[] = [];

    // Calculate delivery fee for each store according to city
    Object.entries(itemsByStore).forEach(([storeId, items]) => {
      const store = stores.find((s) => s.id === storeId);
      const storeName = store ? store.name : 'Vendeur Indépendant';
      const storePhone = store ? store.phone : '';
      const storeWhatsapp = store ? store.whatsapp : storePhone.replace(/[^\d+]/g, '');

      const storeSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      totalProductsAmount += storeSubtotal;

      // Delivery zone lookup
      const zone = store?.deliveryZones.find(
        (z) => z.city.toLowerCase() === orderPayload.city.toLowerCase()
      ) || DEFAULT_DELIVERY_ZONES.find(
        (z) => z.city.toLowerCase() === orderPayload.city.toLowerCase()
      );

      let deliveryFee = zone ? zone.fee : 1500;
      if (zone?.freeAbove && storeSubtotal >= zone.freeAbove) {
        deliveryFee = 0;
      }
      totalDeliveryFee += deliveryFee;

      const orderItems = items.map((i) => ({
        productId: i.productId,
        storeId: i.storeId,
        productName: i.productName,
        productImage: i.productImage,
        unitPrice: i.price,
        quantity: i.quantity,
        totalPrice: i.price * i.quantity,
        selectedVariants: i.selectedVariants,
      }));

      subOrders.push({
        id: `sub-${orderId}-${storeId}`,
        orderId,
        storeId,
        storeName,
        storePhone,
        storeWhatsapp,
        items: orderItems,
        subtotal: storeSubtotal,
        deliveryFee,
        total: storeSubtotal + deliveryFee,
        status: 'NOUVELLE',
      });
    });

    const fullCustomerName = orderPayload.customerName ||
      `${orderPayload.customerFirstName} ${orderPayload.customerLastName}`.trim();

    const now = new Date().toISOString();
    const newOrder: Order = {
      id: orderId,
      trackingCode: orderId,
      customerFirstName: orderPayload.customerFirstName,
      customerLastName: orderPayload.customerLastName,
      customerName: fullCustomerName,
      customerPhone: orderPayload.customerPhone,
      customerEmail: orderPayload.customerEmail,
      city: orderPayload.city,
      neighborhood: orderPayload.neighborhood,
      deliveryAddress: orderPayload.deliveryAddress,
      deliveryInstructions: orderPayload.deliveryInstructions,
      paymentMethod: 'CASH_ON_DELIVERY',
      status: 'NOUVELLE',
      items: subOrders.flatMap((s) => s.items),
      subOrders,
      productsTotal: totalProductsAmount,
      deliveryTotal: totalDeliveryFee,
      grandTotal: totalProductsAmount + totalDeliveryFee,
      bonDeCommandeSentAt: now,
      bonDeCommandeEmail: orderPayload.customerEmail,
      receiptNumber: `REC-${orderId}`,
      createdAt: now,
      updatedAt: now,
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Reduce stock for products
    const products = this.getProducts();
    orderPayload.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        prod.salesCount = (prod.salesCount || 0) + item.quantity;
      }
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // Mark or remove any matching abandoned cart for this customer
    try {
      const abandonedCarts = this.getAbandonedCarts();
      const updatedCarts = abandonedCarts.filter(
        (c) =>
          c.customerEmail !== orderPayload.customerEmail &&
          c.customerPhone !== orderPayload.customerPhone
      );
      localStorage.setItem(STORAGE_KEYS.ABANDONED_CARTS, JSON.stringify(updatedCarts));
    } catch (e) {
      // ignore
    }

    // Trigger async simulated email dispatch
    if (typeof window !== 'undefined') {
      fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bon_de_commande',
          orderId: newOrder.id,
          recipientEmail: newOrder.customerEmail,
          recipientPhone: newOrder.customerPhone,
          recipientName: newOrder.customerName,
          amount: newOrder.grandTotal,
        }),
      }).catch(() => {});
    }

    this.clearCart();
    this.notify();
    return newOrder;
  }

  public confirmDeliveryAndPayment(
    orderId: string,
    subOrderId?: string,
    cashAmount?: number,
    sellerName?: string
  ): { success: boolean; order?: Order; message: string } {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId || o.trackingCode === orderId);
    if (!order) return { success: false, message: 'Commande introuvable.' };

    const now = new Date().toISOString();
    order.status = 'LIVREE_ENCAISSEE';
    order.deliveredAt = now;
    order.receiptNumber = order.receiptNumber || `REC-${order.id}`;
    order.receiptSentAt = now;
    order.receiptSentEmail = order.customerEmail;
    order.receiptSentWhatsapp = order.customerPhone;
    order.cashEncaissedBy = sellerName || 'Vendeur Agréé BéninMarket';

    if (subOrderId) {
      const sub = order.subOrders.find((s) => s.id === subOrderId);
      if (sub) {
        sub.status = 'LIVREE_ENCAISSEE';
        sub.deliveredAt = now;
        sub.cashCollected = cashAmount !== undefined ? cashAmount : sub.total;
      }
    } else {
      order.subOrders.forEach((sub) => {
        sub.status = 'LIVREE_ENCAISSEE';
        sub.deliveredAt = now;
        sub.cashCollected = sub.total;
      });
      order.cashCollectedAmount = cashAmount !== undefined ? cashAmount : order.grandTotal;
    }

    order.updatedAt = now;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Async notification dispatch
    if (typeof window !== 'undefined') {
      fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'recu_paiement',
          orderId: order.id,
          recipientEmail: order.customerEmail,
          recipientPhone: order.customerPhone,
          recipientName: order.customerName,
          amount: order.grandTotal,
        }),
      }).catch(() => {});
    }

    this.notify();
    return {
      success: true,
      order,
      message: `La livraison a été confirmée avec succès ! Le reçu de paiement n° ${order.receiptNumber} a été transmis à ${order.customerEmail} et préparé pour WhatsApp.`,
    };
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    subOrderId?: string,
    cashAmount?: number
  ): void {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (subOrderId) {
      const sub = order.subOrders.find((s) => s.id === subOrderId);
      if (sub) {
        sub.status = newStatus;
        if (newStatus === 'LIVREE_ENCAISSEE') {
          sub.deliveredAt = new Date().toISOString();
          sub.cashCollected = cashAmount !== undefined ? cashAmount : sub.total;
        }
      }
    } else {
      order.status = newStatus;
      order.subOrders.forEach((sub) => {
        sub.status = newStatus;
        if (newStatus === 'LIVREE_ENCAISSEE') {
          sub.deliveredAt = new Date().toISOString();
          sub.cashCollected = sub.total;
        }
      });
      if (newStatus === 'LIVREE_ENCAISSEE') {
        order.cashCollectedAmount = cashAmount !== undefined ? cashAmount : order.grandTotal;
      }
    }

    order.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    this.notify();
  }

  public cancelOrderByCustomer(orderId: string, reason?: string): { success: boolean; message: string } {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId || o.trackingCode === orderId);
    if (!order) return { success: false, message: 'Commande introuvable.' };

    if (order.status === 'LIVREE_ENCAISSEE') {
      return { success: false, message: 'Cette commande a déjà été livrée et encaissée.' };
    }

    if (order.status === 'ANNULEE') {
      return { success: false, message: 'Cette commande est déjà annulée.' };
    }

    order.status = 'ANNULEE';
    order.deliveryInstructions = order.deliveryInstructions
      ? `${order.deliveryInstructions} [Annulée par l'acheteur: ${reason || 'Sans motif particulier'}]`
      : `[Annulée par l'acheteur: ${reason || 'Sans motif particulier'}]`;
    order.updatedAt = new Date().toISOString();

    // cancel all suborders
    order.subOrders.forEach((sub) => {
      sub.status = 'ANNULEE';
    });

    // restore inventory for all products
    const products = this.getProducts();
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock += item.quantity;
        prod.salesCount = Math.max(0, (prod.salesCount || 0) - item.quantity);
      }
    });

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    this.notify();
    return { success: true, message: 'Votre commande a bien été annulée. Aucun livreur ne sera envoyé.' };
  }

  // --- SUPPORT TICKETS (kgmservices229@gmail.com) ---
  public getSupportTickets(): SupportTicket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  }

  public createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status' | 'targetEmail'>): SupportTicket {
    const tickets = this.getSupportTickets();
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket-${Date.now()}`,
      targetEmail: 'kgmservices229@gmail.com',
      status: 'NOUVEAU',
      createdAt: new Date().toISOString(),
    };
    tickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    this.notify();
    return newTicket;
  }

  // --- REVIEWS ---
  public getReviews(): ProductReview[] {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : [];
  }

  public getReviewsByProduct(productId: string): ProductReview[] {
    return this.getReviews().filter((r) => r.productId === productId);
  }

  public addReview(review: Omit<ProductReview, 'id' | 'createdAt'>): void {
    const reviews = this.getReviews();
    const newReview: ProductReview = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    reviews.unshift(newReview);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    // Update product average rating
    const products = this.getProducts();
    const product = products.find((p) => p.id === review.productId);
    if (product) {
      const prodReviews = reviews.filter((r) => r.productId === review.productId);
      const totalScore = prodReviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = Number((totalScore / prodReviews.length).toFixed(1));
      product.reviewCount = prodReviews.length;
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
    this.notify();
  }

  public deleteReview(reviewId: string): void {
    const reviews = this.getReviews().filter((r) => r.id !== reviewId);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    this.notify();
  }

  // --- SETTINGS ---
  public getSettings(): PlatformSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : INITIAL_SETTINGS;
  }

  public updateSettings(settings: PlatformSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.notify();
  }

  public resetToFactory(): void {
    localStorage.clear();
    this.init();
    this.notify();
  }

  // --- DATABASE EXPORT & BACKUP FOR PASTEUR KAZOTTI ---
  public exportCompleteDatabase(): string {
    const data = {
      version: '1.0',
      platform: 'BéninMarket',
      exportedAt: new Date().toISOString(),
      superAdmin: 'kazottimahutondj@gmail.com',
      totalRecords: {
        stores: this.getStores().length,
        products: this.getProducts().length,
        orders: this.getOrders().length,
        users: this.getUsers().length,
      },
      stores: this.getStores(),
      products: this.getProducts(),
      orders: this.getOrders(),
      users: this.getUsers(),
      reviews: this.getReviews(),
      tickets: this.getSupportTickets(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importCompleteDatabase(jsonContent: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.stores && parsed.products && parsed.orders) {
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(parsed.stores));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(parsed.orders));
        if (parsed.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed.users));
        if (parsed.reviews) localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(parsed.reviews));
        if (parsed.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
        this.notify();
        return { success: true, message: 'Base de données restaurée avec succès !' };
      }
      return { success: false, message: 'Format de fichier non valide (propriétés requises manquantes).' };
    } catch (e: any) {
      return { success: false, message: 'Fichier JSON corrompu ou illisible.' };
    }
  }
}

export const storageService = new StorageService();
