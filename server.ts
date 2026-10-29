import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI SDK (Server-Side Only)
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[Server] Failed to initialize GoogleGenAI with provided key:', err);
  }
}

// Ultra-fast in-memory response cache for instant repeat queries
const aiFastCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function getCached<T>(key: string): T | null {
  const entry = aiFastCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    aiFastCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached(key: string, data: unknown): void {
  if (aiFastCache.size > 300) {
    const firstKey = aiFastCache.keys().next().value;
    if (firstKey) aiFastCache.delete(firstKey);
  }
  aiFastCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 4500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`AI timeout after ${timeoutMs}ms`)), timeoutMs);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ==========================================
// API ROUTE 1: Ultra-Fast & Persuasive AI Sales Page Generator
// ==========================================
app.post('/api/ai/sales-copy', async (req: Request, res: Response) => {
  try {
    const { productName, category, price, keyBenefits, targetAudience, storeName, language } = req.body;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: 'Le nom du produit est obligatoire.' });
    }

    const cacheKey = `sales-copy:${productName.trim().toLowerCase()}:${category || ''}:${price || ''}:${keyBenefits || ''}:${language || 'fr'}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const langInstruction =
      language && language !== 'fr'
        ? `Rédige l'intégralité des champs dans la langue correspondant au code "${language}".`
        : `Rédige l'intégralité des champs en français percutant, fluide et naturel.`;

    const systemPrompt = `Tu es le meilleur copywriter e-commerce d'Afrique de l'Ouest et expert en psychologie d'achat Cash on Delivery (Paiement à la livraison).
Ta mission : rédiger instantanément une page de vente IRRÉSISTIBLE et ultra-convaincante adaptée exactement à la nature du produit (Mode, Électronique, Beauté/Karité, Maison, Chaussures, Alimentation, etc.).
${langInstruction}
Utilise la méthode AIDA + PAS :
- Capte l'attention dès la 1ère seconde.
- Valorise les bénéfices concrets qui transforment le quotidien du client.
- Élimine 100% des doutes grâce à l'argument Zéro Risque : aucun paiement en ligne, le client inspecte son colis devant le livreur avant de payer en espèces ou Mobile Money.`;

    const userPrompt = `Crée la fiche de vente haute conversion pour :
- Produit : ${productName}
- Catégorie : ${category || 'Général'}
- Prix : ${price ? `${price} FCFA` : 'Tarif promotionnel'}
- Boutique : ${storeName || 'Boutique Vérifiée BéninMarket'}
- Atouts clés : ${keyBenefits || 'Qualité supérieure testée, finitions soignées, haute durabilité'}
- Public cible : ${targetAudience || 'Clients exigeants au Bénin'}`;

    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                salesTitle: { type: Type.STRING },
                hook: { type: Type.STRING },
                urgencyBadge: { type: Type.STRING },
                persuasiveDescription: { type: Type.STRING },
                bulletPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                whyBuyReasons: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                codGuaranteeArgument: { type: Type.STRING },
                callToAction: { type: Type.STRING },
                faq: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING },
                    },
                    required: ['question', 'answer'],
                  },
                },
                suggestedTestimonials: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      author: { type: Type.STRING },
                      city: { type: Type.STRING },
                      rating: { type: Type.NUMBER },
                      comment: { type: Type.STRING },
                    },
                    required: ['author', 'city', 'rating', 'comment'],
                  },
                },
              },
              required: [
                'salesTitle',
                'hook',
                'urgencyBadge',
                'persuasiveDescription',
                'bulletPoints',
                'whyBuyReasons',
                'codGuaranteeArgument',
                'callToAction',
                'faq',
                'suggestedTestimonials',
              ],
            },
          },
        }),
        4500
      );

        const text = response.text || '';
        const parsed = JSON.parse(text);
        setCached(cacheKey, parsed);
        return res.json({ success: true, data: parsed });
      } catch (geminiError: any) {
        console.warn('[Server] Gemini call failed for sales-copy, using tailored local generator:', geminiError?.message);
      }
    }

    const fallback = generateFallbackSalesCopy(productName, category, price, keyBenefits);
    setCached(cacheKey, fallback);
    return res.json({ success: true, data: fallback, fallback: true });
  } catch (error: any) {
    console.error('[Server] Error in /api/ai/sales-copy:', error);
    return res.status(500).json({ error: 'Erreur lors de la génération de la page de vente.' });
  }
});

// ==========================================
// API ROUTE 2: Fast Buyer Sales Pitch on Product Page (/api/ai/product-pitch)
// ==========================================
app.post('/api/ai/product-pitch', async (req: Request, res: Response) => {
  try {
    const { productName, category, price, shortDescription, storeName, language } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'Produit manquant.' });
    }

    const lang = language || 'fr';
    const cacheKey = `pitch:${productName.toLowerCase()}:${price || ''}:${lang}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Convaincs un client acheteur en 3 secondes d'acheter ce produit sur notre page de vente (paiement 100% à la livraison après vérification du colis).
Produit: ${productName}
Catégorie: ${category || 'Populaire'}
Prix: ${price ? `${price} FCFA` : ''}
Infos: ${shortDescription || ''}
Boutique: ${storeName || 'BéninMarket'}
Langue de réponse obligatoire (code ISO): ${lang}`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reassurance: { type: Type.STRING },
                  verdict: { type: Type.STRING },
                },
                required: ['headline', 'reasons', 'reassurance', 'verdict'],
              },
            },
          }),
          3800
        );

        const parsed = JSON.parse(response.text || '{}');
        setCached(cacheKey, parsed);
        return res.json({ success: true, data: parsed });
      } catch (err: any) {
        console.warn('[Server] Gemini pitch fallback:', err?.message);
      }
    }

    const fallbackPitch = {
      headline: `🔥 Pourquoi « ${productName} » fait partie des choix N°1 de nos acheteurs`,
      reasons: [
        `✅ Rapport qualité/prix imbattable dans le rayon ${category || 'Sélection Vérifiée'}`,
        `✨ Finitions contrôlées par ${storeName || 'notre boutique partenaire'} avant expédition`,
        `🚚 Livraison rapide à domicile (24h-48h) sans payer un seul franc d'avance`,
      ],
      reassurance: `🛡️ Zéro risque : ouvrez et vérifiez votre article avec le livreur avant de régler.`,
      verdict: `Commandez dès maintenant pendant qu'il est encore en stock !`,
    };
    setCached(cacheKey, fallbackPitch);
    return res.json({ success: true, data: fallbackPitch, fallback: true });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de l’analyse express du produit.' });
  }
});

// ==========================================
// API ROUTE 3: AI Web Research & Product Image Generator for Sales Page
// ==========================================
app.post('/api/ai/product-images', async (req: Request, res: Response) => {
  try {
    const { productName, category, price, storeName } = req.body;
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: 'Veuillez indiquer le nom du produit.' });
    }

    const cacheKey = `prod-imgs:${productName.trim().toLowerCase()}:${category || ''}:${price || ''}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const baseQueries = buildSmartSearchQueries(productName, category);
    let englishQueries: string[] = [...baseQueries];
    let visualSummary = `Visuels adaptés par recherche web pour la page de vente de « ${productName} »`;
    const webSources: { title: string; uri: string }[] = [];

    // Launch real web image search in parallel with bounded Gemini Google Search grounding for maximum speed
    const initialWebPhotosPromise = searchRealWebProductImages(baseQueries, productName, category);

    if (ai) {
      try {
        const searchResponse = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Recherche sur internet à quoi ressemble exactement le produit e-commerce suivant : "${productName}" (Catégorie : ${category || 'E-commerce'}).
Réponds UNIQUEMENT au format JSON compact sans markdown :
{"englishQueries":["requête photo précise en anglais 1","requête photo générique en anglais 2","mot clé objet principal en anglais"],"visualSummary":"courte description visuelle vendeuse en français (1 phrase)"}`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              tools: [{ googleSearch: {} }],
            },
          }),
          4200
        );

        const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        for (const chunk of chunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            webSources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        }

        const rawText = (searchResponse.text || '').trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.englishQueries)) {
            const refined = parsed.englishQueries.filter((q: unknown) => typeof q === 'string' && q.trim().length > 0);
            if (refined.length > 0) englishQueries = refined;
          }
          if (typeof parsed.visualSummary === 'string' && parsed.visualSummary.trim()) {
            visualSummary = parsed.visualSummary.trim();
          }
        }
      } catch (err: any) {
        console.warn('[Server] Google Search grounding fast-path fallback for product-images:', err?.message);
      }
    }

    const webPhotos =
      englishQueries[0] !== baseQueries[0]
        ? await searchRealWebProductImages(englishQueries, productName, category)
        : await initialWebPhotosPromise;

    // Generate bespoke SVG Studio Sales Posters (instant, crisp, COD conversion-ready)
    const studioPosters = buildStudioSalesPosters(productName, category || 'Qualité Certifiée', price, storeName);

    const combinedImages = [...webPhotos, ...studioPosters].slice(0, 6);

    const payload = {
      images: combinedImages,
      searchQueriesUsed: englishQueries.slice(0, 3),
      webSources: webSources.slice(0, 4),
      visualSummary,
    };

    setCached(cacheKey, payload);
    return res.json({ success: true, data: payload });
  } catch (error: any) {
    console.error('[Server] Error in /api/ai/product-images:', error);
    return res.status(500).json({ error: 'Erreur lors de la recherche et génération d’images produit.' });
  }
});

// ==========================================
// API ROUTE 4: Dynamic Product Content Translation (10 Languages)
// ==========================================
app.post('/api/ai/translate', async (req: Request, res: Response) => {
  try {
    const { title, description, targetLanguage, targetLanguageName } = req.body;
    if (!title && !description) {
      return res.status(400).json({ error: 'Texte requis.' });
    }

    const cacheKey = `tr:${targetLanguage}:${(title || '').slice(0, 60)}:${(description || '').slice(0, 80)}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Traduis fidèlement et de manière commerciale cette fiche produit e-commerce vers la langue "${targetLanguageName || targetLanguage}" (code: ${targetLanguage}).
Titre: ${title || ''}
Description: ${description || ''}`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  translatedTitle: { type: Type.STRING },
                  translatedDescription: { type: Type.STRING },
                },
                required: ['translatedTitle', 'translatedDescription'],
              },
            },
          }),
          4000
        );
        const parsed = JSON.parse(response.text || '{}');
        setCached(cacheKey, parsed);
        return res.json({ success: true, data: parsed });
      } catch (err: any) {
        console.warn('[Server] Translation fallback:', err?.message);
      }
    }

    return res.json({
      success: true,
      data: {
        translatedTitle: title,
        translatedDescription: description,
      },
      fallback: true,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur de traduction.' });
  }
});

// ==========================================
// API ROUTE 5: AI Abandoned Cart Recovery
// ==========================================
app.post('/api/ai/abandoned-cart-recovery', async (req: Request, res: Response) => {
  try {
    const { customerName, storeName, items, totalAmount, city, incentive } = req.body;

    const itemsSummary = Array.isArray(items)
      ? items.map((i: any) => `${i.quantity || 1}x ${i.productName || i.name} (${i.price || 0} FCFA)`).join(', ')
      : 'vos articles sélectionnés';

    const systemPrompt = `Tu es un spécialiste de la relation client et de la relance des paniers abandonnés en e-commerce pour le Bénin.
Tu rédiges des messages WhatsApp et Email courtois, chaleureux, ultra-personnalisés et persuasifs pour convaincre un client de finaliser sa commande avec paiement à la livraison (Cash on Delivery).`;

    const userPrompt = `Relance pour le client :
- Nom : ${customerName || 'Cher client'}
- Boutique : ${storeName || 'BéninMarket'}
- Articles abandonnés : ${itemsSummary}
- Montant total : ${totalAmount ? `${totalAmount} FCFA` : 'Non précisé'}
- Ville : ${city || 'Cotonou / Bénin'}
- Incitation choisie : ${incentive || 'rappel amical avec garantie de stock réservé'}
Rappelle bien que le paiement s'effectue 100% à la livraison au livreur après réception du colis.`;

    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  whatsappMessage: { type: Type.STRING },
                  emailSubject: { type: Type.STRING },
                  emailBody: { type: Type.STRING },
                  suggestedDiscountPromoCode: { type: Type.STRING },
                },
                required: ['whatsappMessage', 'emailSubject', 'emailBody', 'suggestedDiscountPromoCode'],
              },
            },
          }),
          4500
        );

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed });
      } catch (geminiError: any) {
        console.warn('[Server] Gemini call failed for abandoned-cart-recovery, using tailored fallback:', geminiError?.message);
      }
    }

    const fallback = generateFallbackCartRecovery(customerName, storeName, itemsSummary, totalAmount, incentive);
    return res.json({ success: true, data: fallback, fallback: true });
  } catch (error: any) {
    console.error('[Server] Error in /api/ai/abandoned-cart-recovery:', error);
    return res.status(500).json({ error: 'Erreur lors de la génération de la relance de panier.' });
  }
});

// ==========================================
// API ROUTE 6: AI Marketplace Visitor Assistant
// ==========================================
app.post('/api/ai/visitor-assistant', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'La question est obligatoire.' });
    }

    const systemPrompt = `Tu es "Assistant BéninMarket IA", le conseiller d'achat officiel et rapide de BéninMarket.
1. PAIEMENT SÉCURISÉ 100% À LA LIVRAISON (Cash on Delivery) : Aucun paiement par carte bancaire exigé. Le client paye en espèces ou Mobile Money au livreur après inspection du colis.
2. LIVRAISON PARTOUT AU BÉNIN : Cotonou, Abomey-Calavi (4 à 24h), Porto-Novo, Parakou, Ouidah, Bohicon, Natitingou (24 à 48h).
3. PLATEFORME MULTILINGUE (10 langues) & INSTALLABLE en 1 clic sur téléphone et ordinateur.
Sois chaleureux, persuasif, concis et structuré.`;

    if (ai) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: question,
            config: {
              systemInstruction: systemPrompt,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          }),
          4500
        );

        const text = response.text || '';
        return res.json({ success: true, answer: text });
      } catch (geminiError: any) {
        console.warn('[Server] Gemini call failed for visitor-assistant, using tailored answer generator:', geminiError?.message);
      }
    }

    const answer = generateFallbackVisitorAnswer(question);
    return res.json({ success: true, answer, fallback: true });
  } catch (error: any) {
    console.error('[Server] Error in /api/ai/visitor-assistant:', error);
    return res.status(500).json({ error: "Erreur lors du traitement de la requête de l'assistant." });
  }
});

// ==========================================
// API ROUTE 7: Email & WhatsApp Dispatch Simulation
// ==========================================
app.post('/api/notifications/dispatch', (req: Request, res: Response) => {
  const { type, orderId, recipientEmail, recipientPhone, amount } = req.body;

  console.log(`[Notification Dispatch] Type: ${type} | Order: ${orderId} | To: ${recipientEmail} / ${recipientPhone} | Montant: ${amount} FCFA`);

  return res.json({
    success: true,
    dispatchedAt: new Date().toISOString(),
    type,
    recipientEmail,
    recipientPhone,
    message:
      type === 'bon_de_commande'
        ? `Le Bon de Commande officiel n° ${orderId} a été envoyé à ${recipientEmail}.`
        : `Le Reçu de Paiement acquitté pour la commande n° ${orderId} (${amount} FCFA) a été envoyé par Email à ${recipientEmail} et préparé pour WhatsApp (${recipientPhone}).`,
  });
});

// --- WEB IMAGE RESEARCH & STUDIO POSTER HELPERS ---
function buildSmartSearchQueries(productName: string, category?: string): string[] {
  const lower = `${productName} ${category || ''}`.toLowerCase();
  const dict: [string[], string][] = [
    [['montre', 'watch', 'smartwatch', 'chronographe'], 'luxury wristwatch smartwatch product'],
    [['écouteur', 'earbud', 'airpod', 'casque', 'audio', 'bluetooth'], 'wireless earbuds headphones product'],
    [['téléphone', 'iphone', 'samsung', 'smartphone', 'android', 'tecno', 'infinix'], 'modern smartphone mobile phone'],
    [['ordinateur', 'pc', 'laptop', 'macbook'], 'modern laptop computer'],
    [['robe', 'wax', 'blazer', 'veste', 'chemise', 'boubou', 'tenue', 'vêtement'], 'african fashion blazer dress clothing'],
    [['sac', 'cuir', 'cabas', 'maroquinerie', 'valise'], 'leather handbag bag luxury'],
    [['chaussure', 'sandale', 'basket', 'sneaker', 'mocassin', 'talon'], 'stylish leather shoes sneakers'],
    [['karité', 'beurre', 'crème', 'huile', 'savon', 'cosmétique', 'beauté', 'parfum'], 'shea butter natural skincare jar cosmetic'],
    [['miel', 'épice', 'alimentation', 'café', 'jus', 'ananas'], 'organic honey jar gourmet food'],
    [['mixeur', 'blender', 'cuisine', 'électroménager', 'ventilateur', 'lampe', 'déco'], 'modern home kitchen appliance'],
    [['bébé', 'enfant', 'jouet'], 'baby care kids clothing'],
  ];

  const matched: string[] = [];
  for (const [keywords, engQuery] of dict) {
    if (keywords.some((k) => lower.includes(k))) {
      matched.push(engQuery);
    }
  }
  const cleanedName = productName
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');
  return [cleanedName, ...matched, 'ecommerce product photography'].slice(0, 3);
}

async function fetchWithTimeout(url: string, timeoutMs = 3500): Promise<globalThis.Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BeninMarketEcommerce/1.0 (https://beninmarket.bj)' },
    });
  } finally {
    clearTimeout(id);
  }
}

async function searchOpenverseImages(query: string): Promise<{ id: string; url: string; title: string; source: string; style: 'web_photo' }[]> {
  try {
    const apiUrl = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=4`;
    const resp = await fetchWithTimeout(apiUrl, 3500);
    if (!resp.ok) return [];
    const json: any = await resp.json();
    if (!Array.isArray(json?.results)) return [];
    return json.results
      .filter((item: any) => typeof item?.url === 'string' && item.url.startsWith('http'))
      .slice(0, 3)
      .map((item: any, idx: number) => ({
        id: `ov-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        url: item.thumbnail || item.url,
        title: item.title || query,
        source: `Recherche Web (${item.source || 'Openverse'})`,
        style: 'web_photo' as const,
      }));
  } catch {
    return [];
  }
}

async function searchWikimediaImages(query: string): Promise<{ id: string; url: string; title: string; source: string; style: 'web_photo' }[]> {
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      `${query} filetype:bitmap`
    )}&gsrlimit=4&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const resp = await fetchWithTimeout(wikiUrl, 3500);
    if (!resp.ok) return [];
    const json: any = await resp.json();
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    const results: { id: string; url: string; title: string; source: string; style: 'web_photo' }[] = [];
    for (const page of pages as any[]) {
      const thumbUrl = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
      if (typeof thumbUrl === 'string' && thumbUrl.startsWith('http') && !thumbUrl.endsWith('.svg')) {
        results.push({
          id: `wiki-${page.pageid || Math.random().toString(36).slice(2, 7)}`,
          url: thumbUrl,
          title: String(page.title || query).replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
          source: 'Recherche Web (Wikimedia Commons)',
          style: 'web_photo',
        });
      }
    }
    return results.slice(0, 3);
  } catch {
    return [];
  }
}

async function searchRealWebProductImages(queries: string[], productName: string, category?: string) {
  const primaryQuery = queries[0] || productName;
  const secondaryQuery = queries[1] || primaryQuery;

  const [ov1, wiki1, ov2] = await Promise.all([
    searchOpenverseImages(primaryQuery),
    searchWikimediaImages(primaryQuery),
    secondaryQuery !== primaryQuery ? searchOpenverseImages(secondaryQuery) : Promise.resolve([]),
  ]);

  const seen = new Set<string>();
  const collected: { id: string; url: string; title: string; source: string; style: 'web_photo' }[] = [];
  for (const item of [...ov1, ...wiki1, ...ov2]) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      collected.push(item);
    }
  }

  // Ensure curated HD category photographs are always available if external web search returns < 4 photos
  const curatedFallbacks = getCuratedCategoryPhotos(productName, category);
  for (const fb of curatedFallbacks) {
    if (collected.length >= 4) break;
    if (!seen.has(fb.url)) {
      seen.add(fb.url);
      collected.push(fb);
    }
  }

  return collected.slice(0, 4);
}

function getCuratedCategoryPhotos(productName: string, category?: string) {
  const text = `${productName} ${category || ''}`.toLowerCase();
  if (text.includes('montre') || text.includes('watch')) {
    return [
      { id: 'cur-w1', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', title: `${productName} — Vue Studio`, source: 'Catalogue HD Web', style: 'web_photo' as const },
      { id: 'cur-w2', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80', title: `${productName} — Détail Cadran`, source: 'Catalogue HD Web', style: 'web_photo' as const },
    ];
  }
  if (text.includes('téléphone') || text.includes('écouteur') || text.includes('électronique') || text.includes('audio')) {
    return [
      { id: 'cur-e1', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80', title: `${productName} — Édition Pro`, source: 'Catalogue HD Web', style: 'web_photo' as const },
      { id: 'cur-e2', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', title: `${productName} — Design Haute Précision`, source: 'Catalogue HD Web', style: 'web_photo' as const },
    ];
  }
  if (text.includes('karité') || text.includes('beauté') || text.includes('cosmétique') || text.includes('savon') || text.includes('huile')) {
    return [
      { id: 'cur-b1', url: 'https://images.unsplash.com/photo-1608248597359-59754f9a08e6?auto=format&fit=crop&w=800&q=80', title: `${productName} — Soin Pur & Naturel`, source: 'Catalogue HD Web', style: 'web_photo' as const },
      { id: 'cur-b2', url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80', title: `${productName} — Présentation Flacon`, source: 'Catalogue HD Web', style: 'web_photo' as const },
    ];
  }
  if (text.includes('sac') || text.includes('chaussure') || text.includes('sandale') || text.includes('cuir')) {
    return [
      { id: 'cur-s1', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80', title: `${productName} — Finition Cuir`, source: 'Catalogue HD Web', style: 'web_photo' as const },
      { id: 'cur-s2', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', title: `${productName} — Profil Dynamique`, source: 'Catalogue HD Web', style: 'web_photo' as const },
    ];
  }
  return [
    { id: 'cur-g1', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80', title: `${productName} — Sélection Premium`, source: 'Catalogue HD Web', style: 'web_photo' as const },
    { id: 'cur-g2', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', title: `${productName} — Vue Page de Vente`, source: 'Catalogue HD Web', style: 'web_photo' as const },
  ];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildStudioSalesPosters(productName: string, category: string, price?: number, storeName?: string) {
  const safeTitle = escapeXml(productName.slice(0, 38));
  const safeSub = escapeXml(productName.length > 38 ? productName.slice(38, 74) : category);
  const safeCat = escapeXml(category.slice(0, 32).toUpperCase());
  const safeStore = escapeXml((storeName || 'BéninMarket Certifié').slice(0, 30));
  const priceLabel = price ? `${Number(price).toLocaleString('fr-FR')} FCFA` : 'OFFRE SPÉCIALE';

  // Poster 1: Luxury Dark & Gold Sales Page Banner
  const svgGold = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="55%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#fbbf24"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg1)"/>
    <circle cx="680" cy="110" r="180" fill="#f59e0b" opacity="0.12"/>
    <circle cx="110" cy="520" r="210" fill="#10b981" opacity="0.10"/>
    <rect x="48" y="44" width="704" height="512" rx="28" fill="none" stroke="#f59e0b" stroke-opacity="0.35" stroke-width="2"/>
    <rect x="80" y="82" width="290" height="38" rx="19" fill="#f59e0b" fill-opacity="0.2" stroke="#fbbf24" stroke-width="1"/>
    <text x="225" y="107" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#fde68a">${safeCat}</text>
    <text x="80" y="210" font-family="Arial, sans-serif" font-size="40" font-weight="900" fill="#ffffff">${safeTitle}</text>
    <text x="80" y="260" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#cbd5e1">${safeSub}</text>
    <rect x="80" y="310" width="340" height="84" rx="18" fill="url(#gold)"/>
    <text x="104" y="342" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#451a03">TARIF PAGE DE VENTE</text>
    <text x="104" y="378" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#0f172a">${escapeXml(priceLabel)}</text>
    <rect x="80" y="430" width="640" height="64" rx="16" fill="#064e3b" fill-opacity="0.85" stroke="#10b981" stroke-width="1.5"/>
    <text x="400" y="468" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ecfdf5">✓ PAIEMENT 100% À LA LIVRAISON — ZÉRO RISQUE</text>
    <text x="80" y="530" font-family="Arial, sans-serif" font-size="15" fill="#94a3b8">Boutique officielle : ${safeStore} · Livraison rapide 24h-48h</text>
  </svg>`;

  // Poster 2: Clean Emerald Studio Conversion Card
  const svgEmerald = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fffbeb"/>
        <stop offset="100%" stop-color="#ecfdf5"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg2)"/>
    <rect x="36" y="36" width="728" height="528" rx="30" fill="#ffffff" stroke="#fde68a" stroke-width="4"/>
    <rect x="76" y="76" width="250" height="40" rx="12" fill="#059669"/>
    <text x="201" y="102" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#ffffff">QUALITÉ VÉRIFIÉE</text>
    <text x="76" y="195" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#0f172a">${safeTitle}</text>
    <text x="76" y="242" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#475569">${safeSub}</text>
    <text x="76" y="315" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#047857">✔ Inspectez votre colis avant de payer</text>
    <text x="76" y="355" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#047857">✔ Livraison express à domicile au Bénin</text>
    <text x="76" y="395" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#047857">✔ Garantie satisfaction ${safeStore}</text>
    <rect x="76" y="440" width="648" height="82" rx="18" fill="#0f172a"/>
    <text x="110" y="492" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#fbbf24">${escapeXml(priceLabel)}</text>
    <text x="690" y="490" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">COMMANDER →</text>
  </svg>`;

  return [
    {
      id: `poster-gold-${Date.now()}`,
      url: `data:image/svg+xml;utf8,${encodeURIComponent(svgGold)}`,
      title: `Affiche Page de Vente Premium — ${productName}`,
      source: 'Studio IA BéninMarket',
      style: 'studio_poster' as const,
    },
    {
      id: `poster-emerald-${Date.now() + 1}`,
      url: `data:image/svg+xml;utf8,${encodeURIComponent(svgEmerald)}`,
      title: `Visuel Argumentaire COD — ${productName}`,
      source: 'Studio IA BéninMarket',
      style: 'studio_poster' as const,
    },
  ];
}

// --- HELPER FALLBACKS (Guaranteed zero downtime & ultra-fast) ---
function generateFallbackSalesCopy(name: string, category?: string, price?: number, benefits?: string) {
  const priceDisplay = price ? `${Number(price).toLocaleString('fr-FR')} FCFA` : 'notre tarif promotionnel';
  const catLabel = category || 'Sélection Premium';
  const customBenefit = benefits?.trim()
    ? `✨ Atout exclusif : ${benefits.trim()}`
    : `✨ Finitions haut de gamme sélectionnées pour durer des années`;

  return {
    salesTitle: `🔥 ${name} — Qualité Authentique & Garantie Satisfaction (Paiement à la Livraison)`,
    hook: `Ne faites plus aucun compromis sur la qualité ! Découvrez pourquoi « ${name} » est devenu l'article préféré des clients exigeants dans le rayon ${catLabel}.`,
    urgencyBadge: `⚡ Forte demande : Stock limité en expédition immédiate 24h`,
    persuasiveDescription: `Vous méritez un produit fiable, élégant et exactement conforme à vos attentes. Avec « ${name} », chaque détail a été pensé pour vous offrir une expérience irréprochable dès la première prise en main.\n\nContrairement aux articles ordinaires qui s'usent vite, ce modèle se distingue par sa robustesse, son confort d'utilisation immédiat et son rendu exceptionnel. Que ce soit pour vous faire plaisir ou pour offrir un cadeau mémorable, c'est l'investissement sûr au meilleur rapport qualité-prix (${priceDisplay}).\n\nCommandez aujourd'hui l'esprit 100% tranquille : vous ne payez strictement rien en ligne ! Notre livreur vous apporte votre colis chez vous ou au bureau, vous ouvrez et vérifiez votre article, puis vous réglez uniquement si vous êtes conquis.`,
    bulletPoints: [
      customBenefit,
      `🏆 Qualité vérifiée pièce par pièce avant chaque départ en livraison`,
      `🚚 Expédition express en 4h-24h à Cotonou/Calavi et 24h-48h dans tout le Bénin`,
      `💵 0 FCFA d'avance : Paiement 100% à la réception en espèces ou Mobile Money`,
    ],
    whyBuyReasons: [
      `Inspection libre du produit devant le livreur avant tout paiement`,
      `Service client réactif sur WhatsApp et suivi de commande en direct`,
      `Bon de commande et reçu officiel acquitté fournis`,
    ],
    codGuaranteeArgument: `🛡️ GARANTIE ZÉRO RISQUE : Gardez votre argent jusqu'à l'arrivée du livreur ! Vous inspectez « ${name} » entre vos mains avant de régler les ${priceDisplay}.`,
    callToAction: `Commandez maintenant en 30 secondes — Payez uniquement à la livraison !`,
    faq: [
      {
        question: `Puis-je vérifier l'article avant de payer le livreur ?`,
        answer: `Oui, absolument ! Vous contrôlez la conformité et la qualité de votre colis à votre porte avant de régler.`,
      },
      {
        question: `En combien de temps vais-je recevoir ma commande ?`,
        answer: `Sous 4h à 24h à Cotonou et Abomey-Calavi, et en 24h à 48h à Porto-Novo, Parakou, Ouidah, Bohicon et les autres villes.`,
      },
    ],
    suggestedTestimonials: [
      {
        author: 'Clarisse A.',
        city: 'Cotonou',
        rating: 5,
        comment: `Exactement comme sur les photos ! Reçu le jour même et payé en espèces après vérification. Je recommande vivement.`,
      },
      {
        author: 'Ulrich K.',
        city: 'Abomey-Calavi',
        rating: 5,
        comment: `Très belle qualité pour ${name}. Le paiement à la livraison met vraiment en confiance.`,
      },
    ],
  };
}

function generateFallbackCartRecovery(customerName: string, storeName: string, itemsSummary: string, totalAmount: number, incentive?: string) {
  const client = customerName || 'Cher client';
  const total = totalAmount ? `${Number(totalAmount).toLocaleString('fr-FR')} FCFA` : '';

  let bonusText = '';
  if (incentive === 'free_delivery') {
    bonusText = `🎁 Bonne nouvelle : nous vous offrons la LIVRAISON GRATUITE si vous confirmez aujourd'hui !`;
  } else if (incentive === 'small_discount') {
    bonusText = `🏷️ Bénéficiez d'une réduction spéciale de 10% avec le code promo : BENIN10`;
  } else {
    bonusText = `⚠️ Attention, notre stock sur ces articles est très limité et plusieurs commandes sont en cours.`;
  }

  const whatsappMessage = `Bonjour ${client} 👋

C'est ${storeName || 'BéninMarket'} ! Nous avons remarqué que vous n'avez pas finalisé votre panier pour :
📦 *${itemsSummary}* ${total ? `(Total: ${total})` : ''}

${bonusText}

💡 Rappel important : Vous ne prenez aucun risque ! Chez nous, vous payez *100% à la réception* après vérification de votre colis.

👉 Souhaitez-vous que nous validions l'expédition pour vous livrer aujourd'hui ou demain ? Répondez simplement "OUI" !`;

  const emailSubject = `📦 ${client}, vos articles vous attendent chez ${storeName || 'BéninMarket'} (Paiement à la livraison)`;
  const emailBody = `Bonjour ${client},

Vous avez récemment sélectionné des articles sur notre boutique :
- ${itemsSummary}

${bonusText}

Rappel sécurité : Aucun paiement par carte bancaire n'est requis. Le paiement s'effectue en mains propres au livreur lors de la remise du colis.`;

  return {
    whatsappMessage,
    emailSubject,
    emailBody,
    suggestedDiscountPromoCode: 'BENIN10',
  };
}

function generateFallbackVisitorAnswer(q: string): string {
  const clean = q.toLowerCase();

  if (clean.includes('payer') || clean.includes('paiement') || clean.includes('carte') || clean.includes('cod') || clean.includes('espèces')) {
    return `💵 **Paiement 100% Sécurisé à la Livraison (Cash on Delivery)**\n\nSur BéninMarket, aucune carte bancaire n'est requise :\n1. Passez commande en 30 secondes.\n2. Notre livreur vous apporte le colis chez vous.\n3. **Vous vérifiez votre article.**\n4. Vous payez en espèces ou Mobile Money directement au livreur !`;
  }

  if (clean.includes('délai') || clean.includes('livraison') || clean.includes('cotonou') || clean.includes('calavi')) {
    return `🚚 **Livraison Rapide partout au Bénin**\n\n- **Cotonou & Abomey-Calavi** : 4h à 24h ouvrées.\n- **Porto-Novo, Ouidah, Bohicon, Parakou, Natitingou** : 24h à 48h.\n\nLe livreur vous appelle toujours avant son passage.`;
  }

  if (clean.includes('installer') || clean.includes('application') || clean.includes('téléphone') || clean.includes('ordinateur')) {
    return `📲 **Installer BéninMarket sur Téléphone & Ordinateur**\n\nCliquez simplement sur le bouton **« Installer »** en haut du site pour installer directement l'application sur Android, iPhone, Windows ou Mac !`;
  }

  if (clean.includes('langue') || clean.includes('tradui') || clean.includes('english') || clean.includes('español')) {
    return `🌍 **Plateforme disponible en 10 langues**\n\nUtilisez le sélecteur de langue 🌐 dans la barre supérieure pour traduire instantanément BéninMarket en Français, Anglais, Espagnol, Portugais, Arabe, Chinois, Allemand, Italien, Yoruba ou Fon !`;
  }

  return `👋 **Bonjour ! Je suis l'Assistant BéninMarket IA.**\n\nJe peux vous aider concernant :\n- 💵 Le paiement 100% à la livraison (0 FCFA en ligne)\n- 🚚 Les délais de livraison dans votre ville\n- 🌍 La traduction en 10 langues\n- 📲 L'installation directe de l'application sur téléphone et ordinateur\n\nQue recherchez-vous aujourd'hui ?`;
}

// ==========================================
// STATIC FILES & VITE MIDDLEWARE SETUP
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    app.get('/manifest.webmanifest', (_req: Request, res: Response) => {
      res.type('application/manifest+json').send(
        JSON.stringify({
          id: '/',
          name: 'BéninMarket — Marketplace Multivendeurs',
          short_name: 'BéninMarket',
          description:
            'Plateforme e-commerce multivendeurs avec boutiques indépendantes et paiement 100% à la livraison (Cash on Delivery).',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'any',
          theme_color: '#d97706',
          background_color: '#0f172a',
          lang: 'fr-FR',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        })
      );
    });

    app.get('/sw.js', (_req: Request, res: Response) => {
      res
        .type('application/javascript')
        .set('Cache-Control', 'no-store')
        .send(
          `self.addEventListener('install', () => self.skipWaiting());\nself.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));\nself.addEventListener('fetch', () => {});\n`
        );
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 BéninMarket Server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal bootstrap error:', err);
});
