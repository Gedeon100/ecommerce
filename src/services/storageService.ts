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
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
  DEFAULT_DELIVERY_ZONES,
} from '../data/initialData';
import { generateOrderId } from '../utils/formatters';

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
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      // Sync Super Admin identity to Pasteur Kazotti
      try {
        const users = this.getUsers();
        const adminIdx = users.findIndex((u) => u.role === 'admin');
        if (adminIdx >= 0 && users[adminIdx].email !== 'pasteurkazotti@gmail.com') {
          users[adminIdx].email = 'pasteurkazotti@gmail.com';
          users[adminIdx].name = 'Pasteur Kazotti (Fondateur & Super Admin)';
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[^0-9]/g, '');

    // Allow Pasteur Kazotti master access
    if (cleanId === 'pasteurkazotti@gmail.com' || cleanId === 'pasteurkazotti') {
      let admin = users.find((u) => u.email === 'pasteurkazotti@gmail.com' || u.role === 'admin');
      if (!admin) {
        admin = {
          id: 'user-admin',
          name: 'Pasteur Kazotti (Fondateur & Super Admin)',
          email: 'pasteurkazotti@gmail.com',
          phone: '+229 97 00 11 22',
          whatsapp: '+229 97 00 11 22',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        users.push(admin);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      this.setCurrentUser(admin);
      return { success: true, user: admin };
    }

    const matched = users.find((u) => {
      const matchEmail = u.email.toLowerCase() === cleanId;
      const matchPhone = cleanPhone.length > 6 && u.phone.replace(/[^0-9]/g, '').includes(cleanPhone);
      return matchEmail || matchPhone;
    });

    if (matched) {
      if (password && matched.password && matched.password !== password) {
        return { success: false, error: 'Mot de passe incorrect pour ce compte.' };
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

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  }

  public getProductsByStore(storeId: string): Product[] {
    return this.getProducts().filter((p) => p.storeId === storeId);
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public saveProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.notify();
  }

  public deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    this.clearCart();
    this.notify();
    return newOrder;
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
      superAdmin: 'pasteurkazotti@gmail.com',
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
