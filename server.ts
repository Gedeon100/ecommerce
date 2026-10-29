import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json());

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

// ==========================================
// API ROUTE 1: AI Sales Copy / Page Generator
// ==========================================
app.post('/api/ai/sales-copy', async (req: Request, res: Response) => {
  try {
    const { productName, category, price, keyBenefits, targetAudience, storeName } = req.body;

    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: 'Le nom du produit est obligatoire.' });
    }

    const systemPrompt = `Tu es un expert en e-commerce et copywriting marketing pour l'Afrique de l'Ouest, spécialement pour le Bénin et les ventes avec paiement à la livraison (Cash on Delivery).
Ton rôle est de créer une page de vente / fiche produit irrésistible, ultra-persuasive et rassurante en français.
Le produit est vendu sur BéninMarket où le client règle en espèces ou par Mobile Money UNIQUEMENT à la réception après avoir inspecté le colis.

Tu dois répondre UNIQUEMENT par un objet JSON valide avec la structure suivante :
{
  "salesTitle": "Titre commercial accrocheur avec promesse forte",
  "hook": "Phrase d'accroche captivante (1-2 phrases) qui touche la douleur ou le désir du client",
  "persuasiveDescription": "Description complète et captivante (3 à 4 paragraphes percutants, storytelling, bénéfices concrets, qualité)",
  "bulletPoints": [
    "✅ Bénéfice clé 1 avec emoji",
    "✅ Bénéfice clé 2 avec emoji",
    "✅ Bénéfice clé 3 avec emoji",
    "✅ Bénéfice clé 4 avec emoji"
  ],
  "codGuaranteeArgument": "Argument choc de garantie Cash on Delivery (ex: Zéro risque pour vous : inspectez le produit chez vous avant de payer le livreur)",
  "faq": [
    { "question": "Question fréquente 1", "answer": "Réponse rassurante 1" },
    { "question": "Question fréquente 2", "answer": "Réponse rassurante 2" }
  ]
}`;

    const userPrompt = `Rédige la page de vente pour :
- Nom du produit : ${productName}
- Catégorie : ${category || 'Général'}
- Prix : ${price ? `${price} FCFA` : 'Prix attractif'}
- Boutique : ${storeName || 'Boutique certifiée'}
- Points forts / Bénéfices mentionnés par le vendeur : ${keyBenefits || 'Qualité supérieure, durable, très apprécié des clients'}
- Clientèle cible : ${targetAudience || 'Particuliers, familles et professionnels au Bénin'}

Fais ressortir l'urgence, la rareté du stock et la réassurance totale du Paiement à la Livraison.`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed });
      } catch (geminiError: any) {
        console.warn('[Server] Gemini call failed for sales-copy, using tailored local generator:', geminiError?.message);
      }
    }

    // High quality tailored fallback when GEMINI_API_KEY is not available
    const fallback = generateFallbackSalesCopy(productName, category, price, keyBenefits);
    return res.json({ success: true, data: fallback, fallback: true });
  } catch (error: any) {
    console.error('[Server] Error in /api/ai/sales-copy:', error);
    return res.status(500).json({ error: 'Erreur lors de la génération de la page de vente.' });
  }
});

// ==========================================
// API ROUTE 2: AI Abandoned Cart Recovery
// ==========================================
app.post('/api/ai/abandoned-cart-recovery', async (req: Request, res: Response) => {
  try {
    const { customerName, storeName, items, totalAmount, city, incentive } = req.body;

    const itemsSummary = Array.isArray(items)
      ? items.map((i: any) => `${i.quantity || 1}x ${i.productName || i.name} (${i.price || 0} FCFA)`).join(', ')
      : 'vos articles sélectionnés';

    const systemPrompt = `Tu es un spécialiste de la relation client et de la relance des paniers abandonnés en e-commerce pour le Bénin.
Tu rédiges des messages WhatsApp et Email courtois, chaleureux, ultra-personnalisés et persuasifs pour convaincre un client de finaliser sa commande avec paiement à la livraison (Cash on Delivery).
Le ton doit être respectueux ("Bonjour cher client / M./Mme", "Nous avons réservé vos articles"), non agressif, rassurant et motivant.

Réponds UNIQUEMENT par un objet JSON valide avec cette structure :
{
  "whatsappMessage": "Message prêt à l'envoi pour WhatsApp avec sauts de lignes et emojis chaleureux",
  "emailSubject": "Objet percutant pour l'email de relance",
  "emailBody": "Texte complet et élégant de l'email de relance",
  "suggestedDiscountPromoCode": "BENIN10 ou LIVRAISON229"
}`;

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
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

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
// API ROUTE 3: AI Marketplace Visitor Assistant
// ==========================================
app.post('/api/ai/visitor-assistant', async (req: Request, res: Response) => {
  try {
    const { question, history } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'La question est obligatoire.' });
    }

    const systemPrompt = `Tu es "Assistant BéninMarket IA", le conseiller d'achat officiel et assistant virtuel de la plateforme e-commerce BéninMarket.
BéninMarket est la marketplace leader au Bénin reliant des boutiques et créateurs béninois vérifiés à des milliers de clients.

Informations clés à toujours respecter et promouvoir :
1. PAIEMENT SÉCURISÉ 100% À LA LIVRAISON (Cash on Delivery) : Aucun paiement par carte bancaire exigé à la commande. Le client paye uniquement en espèces ou par Mobile Money (MTN MoMo / Moov Money) directement au livreur après avoir reçu et vérifié son colis.
2. ZONES DE LIVRAISON : Toutes les villes du Bénin (Cotonou, Abomey-Calavi, Porto-Novo, Parakou, Ouidah, Bohicon, Natitingou, etc.). Délais moyens : 4 à 24h à Cotonou/Calavi, 24 à 48h dans les autres villes.
3. BONS DE COMMANDE & REÇUS : Dès qu'une commande est validée, un Bon de Commande officiel est envoyé par email. Une fois la livraison terminée, le vendeur valide la livraison et le client reçoit automatiquement son Reçu de Paiement Acquitté officiel par Email et WhatsApp.
4. ESPACE ACHETEUR & ESPACE VENDEUR : Tout le monde peut commander sans tracas dans l'Espace Acheteur, et tout commerçant / artisan peut créer sa boutique gratuitement en quelques minutes dans l'Espace Vendeur.
5. SUIVI DE COMMANDE : Le client peut suivre l'état de son colis en temps réel avec son code de commande (ex: BM-2026-XXXX).

Réponds toujours en français, de manière chaleureuse, polie, claire et bienveillante avec des puces et emojis pertinents. Sois concis et propose toujours l'action suivante utile.`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: question,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.5,
          },
        });

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
// API ROUTE 4: Email & WhatsApp Dispatch Simulation
// ==========================================
app.post('/api/notifications/dispatch', (req: Request, res: Response) => {
  const { type, orderId, recipientEmail, recipientPhone, recipientName, amount } = req.body;

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

// --- HELPER FALLBACKS (Guaranteed zero downtime) ---
function generateFallbackSalesCopy(name: string, category?: string, price?: number, benefits?: string) {
  const priceDisplay = price ? `${Number(price).toLocaleString('fr-FR')} FCFA` : 'notre tarif exclusif';
  return {
    salesTitle: `✨ ${name} — L'Authentique Qualité Supérieure Recommandée au Bénin`,
    hook: `Vous cherchez ce qu'il se fait de mieux ? Découvrez ${name}, conçu pour vous apporter satisfaction, style et durabilité au quotidien.`,
    persuasiveDescription: `${name} est spécialement sélectionné par notre boutique pour répondre aux exigences des clients les plus avisés au Bénin.\n\nFabriqué avec des matériaux robustes et une finition soignée, cet article allie élégance, confort et efficacité remarquable. Fini les déceptions : vous investissez dans un produit durable qui tient toutes ses promesses dès la première utilisation.\n\nCommandez en toute tranquillité d'esprit grâce à notre formule Zéro Risque : vous ne payez qu'à la livraison une fois le produit entre vos mains.`,
    bulletPoints: [
      `🌟 Qualité certifiée et testée avant chaque expédition`,
      `📦 Emballage sécurisé et soigné pour préserver l'état neuf`,
      `🚚 Livraison rapide partout à Cotonou, Calavi, Porto-Novo et dans tout le Bénin`,
      `💵 Paiement 100% à la livraison (Cash on Delivery) en espèces ou Mobile Money`,
    ],
    codGuaranteeArgument: `🛡️ ZÉRO RISQUE : Vous ne déboursez rien en ligne ! Le livreur vous apporte votre colis à l'adresse de votre choix, vous vérifiez votre article et vous réglez ensuite directement les ${priceDisplay}.`,
    faq: [
      {
        question: `Comment puis-je être sûr(e) de recevoir le bon article ?`,
        answer: `Notre politique vous permet d'ouvrir et de contrôler le colis en présence du livreur avant tout règlement.`,
      },
      {
        question: `Quels sont les délais de livraison ?`,
        answer: `Livraison en 4h à 24h pour Cotonou et Abomey-Calavi, et sous 24h à 48h pour les autres localités du Bénin.`,
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

👉 Souhaitez-vous que nous validions l'expédition pour vous recevoir aujourd'hui ou demain ? Répondez simplement "OUI" ou indiquez-nous votre adresse de livraison. Merci !`;

  const emailSubject = `📦 ${client}, vos articles vous attendent chez ${storeName || 'BéninMarket'} (Paiement à la livraison)`;
  const emailBody = `Bonjour ${client},

Vous avez récemment sélectionné des articles sur notre boutique :
- ${itemsSummary}

Nous avons temporairement mis ces articles de côté à votre attention.

${bonusText}

Rappel sécurité : Aucun paiement par carte bancaire n'est requis. Le paiement s'effectue en mains propres au livreur lors de la remise du colis.

Rendez-vous sur BéninMarket ou répondez à ce message pour confirmer votre expédition.`;

  return {
    whatsappMessage,
    emailSubject,
    emailBody,
    suggestedDiscountPromoCode: 'BENIN10',
  };
}

function generateFallbackVisitorAnswer(q: string): string {
  const clean = q.toLowerCase();

  if (clean.includes('payer') || clean.includes('paiement') || clean.includes('carte') || clean.includes('cod') || clean.includes('argent') || clean.includes('espèces')) {
    return `💵 **Paiement 100% Sécurisé à la Livraison (Cash on Delivery)**\n\nSur BéninMarket, vous n'avez **aucun besoin de carte bancaire** ni de paiement en avance !\n\n1. Vous passez votre commande en renseignant votre adresse et numéro de téléphone.\n2. Le vendeur prépare votre colis et notre livreur vous l'apporte directement chez vous ou à votre bureau.\n3. **Vous vérifiez votre produit.**\n4. Vous payez en espèces ou via Mobile Money (MTN MoMo / Moov Money) directement au livreur.\n\nC'est la garantie Zéro Risque pour tous nos acheteurs !`;
  }

  if (clean.includes('délai') || clean.includes('livraison') || clean.includes('frais') || clean.includes('cotonou') || clean.includes('calavi') || clean.includes('parakou')) {
    return `🚚 **Délais et Modalités de Livraison au Bénin**\n\nNous livrons sur l'ensemble du territoire national :\n- **Cotonou & Abomey-Calavi** : Livraison express en 4h à 24h ouvrées (Tarif : 1 000 à 1 500 FCFA selon la zone, souvent offerte dès 25 000 FCFA d'achat).\n- **Porto-Novo, Ouidah, Bohicon** : Livraison en 24h à 36h.\n- **Parakou, Natitingou et le Nord** : Livraison sous 24h à 48h par nos relais colis sécurisés.\n\nLe livreur vous contacte toujours par appel téléphonique avant de passer.`;
  }

  if (clean.includes('vendeur') || clean.includes('boutique') || clean.includes('vendre') || clean.includes('ouvrir')) {
    return `🏪 **Comment ouvrir votre boutique et vendre sur BéninMarket ?**\n\nC'est très simple et gratuit :\n1. Cliquez sur le bouton **« Espace Vendeur »** dans le menu supérieur.\n2. Choisissez **« Créer ma boutique vendeuse »** et remplissez le formulaire (nom, WhatsApp, ville, description).\n3. Vous accédez immédiatement à votre tableau de bord indépendant pour ajouter vos produits, fixer vos tarifs, gérer vos stocks et suivre vos commandes.\n4. Vous profitez aussi de notre **IA de rédaction de pages de vente** et de notre **IA de relance des paniers abandonnés** !`;
  }

  if (clean.includes('suivre') || clean.includes('colis') || clean.includes('statut') || clean.includes('commande')) {
    return `📦 **Suivi de votre commande en direct**\n\nVous pouvez suivre l'état de votre colis à tout moment :\n- Cliquez sur **« Suivi Colis »** dans le menu ou utilisez votre code de commande (ex: BM-2026-XXXX).\n- Dès que votre commande est passée, vous recevez votre **Bon de Commande officiel par Email**.\n- Dès que le livreur a finalisé la livraison, vous recevez votre **Reçu de Paiement officiel acquitté par Email et WhatsApp** !`;
  }

  if (clean.includes('reçu') || clean.includes('facture') || clean.includes('bon')) {
    return `🧾 **Bons de Commande & Reçus de Paiement Officiels**\n\n- **Bon de Commande** : Généré immédiatement après validation de vos achats, avec récapitulatif détaillé, coordonnées et montant COD à régler.\n- **Reçu de Paiement Acquitté** : Dès que le vendeur valide la livraison effectuée, vous recevez votre reçu officiel avec tampon "PAYÉ EN CASH / ACQUITTÉ" par Email et sur votre WhatsApp. Vous pouvez également le télécharger et l'imprimer dans votre **Espace Acheteur** !`;
  }

  return `👋 **Bonjour ! Je suis l'Assistant BéninMarket IA.**\n\nJe peux vous renseigner instantanément sur :\n- 🚚 Les tarifs et délais de livraison à Cotonou et partout au Bénin\n- 💵 Le fonctionnement du paiement sécurisé à la livraison (Cash on Delivery)\n- 📄 Votre Bon de commande et Reçu de paiement acquitté\n- 🏪 L'ouverture d'une boutique dans l'**Espace Vendeur**\n- 🔍 Le suivi en direct de vos commandes\n\nPosez-moi votre question ou cliquez sur l'un des boutons du menu !`;
}

// ==========================================
// STATIC FILES & VITE MIDDLEWARE SETUP
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
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
