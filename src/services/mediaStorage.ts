/**
 * Service de stockage de médias locaux (Photos et Vidéos) via IndexedDB.
 * Permet l'import direct depuis l'appareil du vendeur SANS LIMITE DE TAILLE
 * (compatible avec de lourds fichiers vidéos MP4/MOV et photos haute résolution).
 */

const DB_NAME = 'beninmarket_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

export interface StoredMediaFile {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

class MediaStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private urlCache: Map<string, string> = new Map();
  private isLoaded = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB()
        .then(() => this.preloadMediaUrls())
        .catch((err) => {
          console.warn('[MediaStorage] IndexedDB initialization notice:', err);
        });
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        reject(new Error('IndexedDB non supporté'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Précharge les URLs des médias déjà sauvegardés dans IndexedDB au démarrage.
   */
  public async preloadMediaUrls(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const files: StoredMediaFile[] = request.result || [];
        files.forEach((f) => {
          if (f.blob && !this.urlCache.has(f.id)) {
            const url = URL.createObjectURL(f.blob);
            this.urlCache.set(f.id, url);
          }
        });
        this.isLoaded = true;
        this.notify();
      };
    } catch (err) {
      console.warn('[MediaStorage] Failed to preload media URLs:', err);
    }
  }

  /**
   * Sauvegarde un fichier (Image ou Vidéo) sans aucune limite de taille dans IndexedDB.
   */
  public async saveMediaFile(file: File | Blob, nameHint?: string): Promise<{ id: string; url: string; size: number }> {
    const id = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const objectUrl = URL.createObjectURL(file);
    this.urlCache.set(id, objectUrl);

    try {
      const db = await this.initDB();
      const storedItem: StoredMediaFile = {
        id,
        blob: file,
        name: (file as File).name || nameHint || 'media-file',
        type: file.type || 'application/octet-stream',
        size: file.size,
        createdAt: new Date().toISOString(),
      };

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.put(storedItem);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      this.notify();
      return { id, url: objectUrl, size: file.size };
    } catch (err) {
      console.warn('[MediaStorage] IndexedDB save failed, using memory ObjectURL fallback:', err);
      // Fallback: the URL is still available in memory for this session
      return { id, url: objectUrl, size: file.size };
    }
  }

  /**
   * Récupère l'URL d'affichage pour une image ou vidéo.
   * Gère les URLs HTTP/HTTPS, les URLs Data, les URLs Blob et les identifiants IndexedDB.
   */
  public resolveUrl(urlOrId: string | undefined): string {
    if (!urlOrId) return '';
    // Standard web URL or already active blob/data URL
    if (urlOrId.startsWith('http://') || urlOrId.startsWith('https://') || urlOrId.startsWith('data:')) {
      return urlOrId;
    }
    // Check if it's cached from IndexedDB
    if (this.urlCache.has(urlOrId)) {
      return this.urlCache.get(urlOrId)!;
    }
    // If it's a blob url from current memory
    if (urlOrId.startsWith('blob:')) {
      return urlOrId;
    }
    // Attempt asynchronous load if not ready yet
    this.ensureMediaLoaded(urlOrId);
    return urlOrId;
  }

  private async ensureMediaLoaded(id: string): Promise<void> {
    if (this.urlCache.has(id) || !id.startsWith('media-')) return;
    try {
      const db = await this.initDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const file: StoredMediaFile | undefined = req.result;
        if (file && file.blob) {
          const url = URL.createObjectURL(file.blob);
          this.urlCache.set(id, url);
          this.notify();
        }
      };
    } catch (err) {
      console.warn('[MediaStorage] Could not resolve media ID:', id, err);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Octet';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const mediaStorage = new MediaStorageService();
