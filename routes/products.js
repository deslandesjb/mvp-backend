/**
 * ============================================================================
 * FICHIER : routes/products.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier est le cœur de l'API AtlasLoot. Il gère toutes les opérations
 * liées aux produits : listing, recherche, filtrage, et affichage détaillé.
 * C'est le comparateur de prix proprement dit.
 * 
 * RÔLE :
 * - GET /products → Liste tous les produits avec prix/note moyens
 * - GET /products/categories → Liste toutes les catégories uniques
 * - GET /products/:category → Produits filtrés par catégorie
 * - GET /products/id/:idProduct → Détail d'un produit spécifique
 * - POST /products/search → Recherche avancée avec filtres multiples
 * 
 * LOGIQUE MÉTIER :
 * - Chaque produit a plusieurs vendeurs (Amazon, Fnac, Darty)
 * - Chaque vendeur a un prix et des avis clients
 * - L'API calcule les moyennes pour faciliter la comparaison
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Express Router : Organisation des routes
 * - Mongoose : ODM MongoDB pour les requêtes
 * - RegExp : Recherche insensible à la casse
 * 
 * ============================================================================
 */


// ============================================================================
// 1. IMPORTS ET CONFIGURATION
// ============================================================================

/**
 * Express et Router pour créer les endpoints
 */
var express = require('express');
var router = express.Router();

/**
 * Modèle Product : Structure des produits en BDD
 * Contient : nom, description, images, marque, catégorie, vendeurs
 */
const Product = require('../models/product');


// ============================================================================
// 2. ROUTE GET /products (TOUS LES PRODUITS)
// ============================================================================

/**
 * Récupère tous les produits avec calcul des moyennes
 * 
 * UTILISATION :
 * Page d'accueil, listing général des produits
 * 
 * LOGIQUE :
 * 1. Récupérer tous les produits depuis MongoDB
 * 2. Pour chaque produit, calculer le prix moyen et la note moyenne
 * 3. Trier par meilleure note
 * 4. Retourner les données simplifiées pour le frontend
 * 
 * RÉPONSE :
 * {
 *   result: true,
 *   products: [{ id, name, desc, picture, brand, categorie, priceMoy, noteMoy }]
 * }
 */
router.get('/', (req, res) => {

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 1 : Récupération brute des produits depuis MongoDB
// ─────────────────────────────────────────────────────────────────────────
Product.find()

.then((dataProducts) => {

// Sécurité : vérifier que des produits existent
if (!dataProducts) {
res.status(404).json({ result: false, error: "Couldn't find products" });
return;
}

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 2 : Transformation des données
// ─────────────────────────────────────────────────────────────────
/**
 * map() : Transforme chaque produit MongoDB en objet simplifié
 * On ne garde que les infos utiles pour l'affichage
 */
const productsReworked = dataProducts.map((p) => {

let allNotes = [];   // Stocke toutes les notes du produit
let allPrices = [];  // Stocke tous les prix du produit

// ─────────────────────────────────────────────────────────────
// ÉTAPE 2.1 : Parcours des vendeurs
// ─────────────────────────────────────────────────────────────
/**
 * Structure d'un produit :
 * {
 *   name: "iPhone 15",
 *   sellers: [
 *     { seller: "Amazon", price: 999, avis: [{note: 4}, {note: 5}] },
 *     { seller: "Fnac", price: 1049, avis: [{note: 4}] }
 *   ]
 * }
 */
for (let seller of p.sellers) {
allPrices.push(seller.price);

// ─────────────────────────────────────────────────────────
// ÉTAPE 2.2 : Parcours des avis de chaque vendeur
// ─────────────────────────────────────────────────────────
for (let avis of seller.avis) {
allNotes.push(avis.note);
}
}

// ─────────────────────────────────────────────────────────────
// ÉTAPE 3 : Calcul de la note moyenne
// ─────────────────────────────────────────────────────────────
/**
 * reduce() : Additionne toutes les notes
 * Division par le nombre de notes pour la moyenne
 */
const noteMoy =
allNotes.reduce((total, note) => total + note, 0) / allNotes.length;

// ─────────────────────────────────────────────────────────────
// ÉTAPE 4 : Calcul du prix moyen
// ─────────────────────────────────────────────────────────────
const priceMoy =
allPrices.reduce((total, price) => total + price, 0) / allPrices.length;

// ─────────────────────────────────────────────────────────────
// ÉTAPE 5 : Objet final envoyé au frontend
// ─────────────────────────────────────────────────────────────
/**
 * toFixed(2) : Arrondit à 2 décimales
 * On ne renvoie pas les détails des vendeurs ici (optimisation)
 */
return {
id: p._id,
name: p.name,
desc: p.desc,
picture: p.picture,
brand: p.brand,
categorie: p.categorie,
priceMoy: priceMoy.toFixed(2),
noteMoy: noteMoy.toFixed(2),
};
});

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 6 : Tri par note (meilleurs produits en premier)
// ─────────────────────────────────────────────────────────────────
/**
 * sort() avec b - a : Tri décroissant
 * Les produits les mieux notés apparaissent en premier
 */
productsReworked.sort((a, b) => b.noteMoy - a.noteMoy);

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 7 : Réponse finale
// ─────────────────────────────────────────────────────────────────
res.status(200).json({ result: true, products: productsReworked });
});
});


// ============================================================================
// 3. ROUTE GET /products/categories (LISTE DES CATÉGORIES)
// ============================================================================

/**
 * Récupère toutes les catégories uniques des produits
 * 
 * UTILISATION :
 * Menu de navigation, filtres de recherche
 * 
 * LOGIQUE :
 * 1. Récupérer tous les produits
 * 2. Extraire les catégories sans doublons
 * 
 * RÉPONSE :
 * {
 *   result: true,
 *   categories: ["Smartphone", "TV", "Casque", ...]
 * }
 */
router.get('/categories', (req, res) => {

Product.find()

.then((dataCats) => {

if (!dataCats) {
res.status(404).json({ result: false, error: "Couldn't find products" });
return;
}

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 1 : Tableau vide pour stocker les catégories uniques
// ─────────────────────────────────────────────────────────────────
const categories = [];

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 2 : Parcours des produits
// ─────────────────────────────────────────────────────────────────
/**
 * forEach() : Parcourt chaque produit
 * includes() : Vérifie si la catégorie est déjà dans le tableau
 * 
 * Alternative moderne : [...new Set(dataCats.map(p => p.categorie))]
 */
dataCats.forEach((product) => {

// On ajoute la catégorie seulement si elle n'existe pas déjà
if (!categories.includes(product.categorie)) {
categories.push(product.categorie);
}
});

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 3 : Réponse
// ─────────────────────────────────────────────────────────────────
res.status(200).json({ result: true, categories });
});
});


// ============================================================================
// 4. ROUTE GET /products/:category (PRODUITS PAR CATÉGORIE)
// ============================================================================

/**
 * Récupère les produits d'une catégorie spécifique
 * 
 * PARAMÈTRES URL :
 * - :category → Nom de la catégorie (ex: "smartphone", "TV")
 * 
 * UTILISATION :
 * Filtrage par catégorie depuis le menu ou les liens
 * 
 * LOGIQUE :
 * 1. Récupérer la catégorie depuis l'URL
 * 2. Créer une RegExp insensible à la casse
 * 3. Filtrer les produits par catégorie
 * 4. Calculer les moyennes et trier
 */
router.get('/:category', (req, res) => {

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 1 : Lecture du paramètre dans l'URL
// ─────────────────────────────────────────────────────────────────────────
let { category } = req.params;

if (!category) {
res.status(406).json({ result: false, error: 'Missing category' });
return;
}

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 2 : Création d'une RegExp insensible à la casse
// ─────────────────────────────────────────────────────────────────────────
/**
 * new RegExp(category, 'i') :
 * - 'i' : flag "case insensitive"
 * - "tv" matchera "TV", "Tv", "tV", etc.
 */
category = new RegExp(category, 'i');

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 3 : Requête MongoDB avec filtre
// ─────────────────────────────────────────────────────────────────────────
Product.find({ categorie: category })

.then((dataProducts) => {

if (!dataProducts) {
res.status(404).json({ result: false, error: "Couldn't find products" });
return;
}

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 4 : Même logique de transformation que GET /
// ─────────────────────────────────────────────────────────────────
const productsReworked = dataProducts.map((p) => {

let allNotes = [];
let allPrices = [];

for (let seller of p.sellers) {
allPrices.push(seller.price);
for (let avis of seller.avis) {
allNotes.push(avis.note);
}
}

const noteMoy =
allNotes.reduce((t, n) => t + n, 0) / allNotes.length;

const priceMoy =
allPrices.reduce((t, p) => t + p, 0) / allPrices.length;

return {
id: p._id,
name: p.name,
desc: p.desc,
brand: p.brand,
categorie: p.categorie,
priceMoy: priceMoy.toFixed(2),
noteMoy: noteMoy.toFixed(2),
};
});

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 5 : Tri par note décroissante
// ─────────────────────────────────────────────────────────────────
productsReworked.sort((a, b) => b.noteMoy - a.noteMoy);

res.status(200).json({ result: true, products: productsReworked });
});
});


// ============================================================================
// 5. ROUTE GET /products/id/:idProduct (DÉTAIL D'UN PRODUIT)
// ============================================================================

/**
 * Récupère toutes les informations d'un produit spécifique
 * 
 * PARAMÈTRES URL :
 * - :idProduct → ID MongoDB du produit (ObjectId)
 * 
 * UTILISATION :
 * Page de détail produit, comparaison des vendeurs
 * 
 * DIFFÉRENCE AVEC GET / :
 * - Retourne les détails complets des vendeurs
 * - Permet d'afficher les prix de chaque revendeur
 * - Affiche tous les avis détaillés
 */
router.get('/id/:idProduct', (req, res) => {

const { idProduct } = req.params;

if (!idProduct) {
res.status(406).json({ result: false, error: 'Missing product ID' });
return;
}

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 1 : Recherche par ID MongoDB
// ─────────────────────────────────────────────────────────────────────────
/**
 * findById() : Méthode Mongoose pour chercher par _id
 * Plus simple que find({ _id: idProduct })
 */
Product.findById(idProduct)

.then((product) => {

if (!product) {
res.status(404).json({ result: false, error: 'Product not found' });
return;
}

let allNotes = [];
let allPrices = [];

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 2 : Calcul des moyennes
// ─────────────────────────────────────────────────────────────────
for (let seller of product.sellers) {
allPrices.push(seller.price);
for (let avis of seller.avis) {
allNotes.push(avis.note);
}
}

const noteMoy =
allNotes.reduce((t, n) => t + n, 0) / allNotes.length;

const priceMoy =
allPrices.reduce((t, p) => t + p, 0) / allPrices.length;

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 3 : Réponse avec toutes les infos (y compris sellers)
// ─────────────────────────────────────────────────────────────────
/**
 * Différence clé : on inclut 'sellers' pour afficher
 * les prix et avis de chaque revendeur sur la page détail
 */
res.status(200).json({
result: true,
product: {
id: product._id,
name: product.name,
desc: product.desc,
picture: product.picture,
brand: product.brand,
categorie: product.categorie,
sellers: product.sellers,
priceMoy: priceMoy.toFixed(2),
noteMoy: noteMoy.toFixed(2),
},
});
});
});


// ============================================================================
// 6. ROUTE POST /products/search (RECHERCHE AVANCÉE)
// ============================================================================

/**
 * Recherche avancée avec filtres multiples et tri dynamique
 * 
 * BODY (optionnel, tous les champs) :
 * {
 *   search: "iphone",              // Recherche textuelle globale
 *   categories: ["smartphone"],    // Filtrer par catégories
 *   brands: ["Apple", "Samsung"],  // Filtrer par marques
 *   sellers: ["Amazon", "Fnac"],   // Filtrer par vendeurs
 *   minPrice: 100,                 // Prix minimum
 *   maxPrice: 500,                 // Prix maximum
 *   sortBy: "price_asc",           // Tri (price_asc, price_desc, ou par défaut: note)
 *   desc: ["128Go"]                // Recherche dans la description
 * }
 * 
 * UTILISATION :
 * Barre de recherche, filtres avancés, page résultats
 * 
 * LOGIQUE :
 * 1. Construire une requête MongoDB dynamique
 * 2. Appliquer les filtres textuels (regex)
 * 3. Calculer les moyennes
 * 4. Filtrer par prix (côté JS car prix = calculé)
 * 5. Trier selon le critère choisi
 */
router.post('/search', (req, res) => {

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 1 : Extraction des critères de recherche
// ─────────────────────────────────────────────────────────────────────────
const { search, categories, brands, sellers, minPrice, maxPrice, sortBy , desc} = req.body;

/**
 * query : Objet qui contiendra les critères MongoDB
 * On le construit dynamiquement selon les filtres actifs
 */
let query = {};

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 2 : Recherche textuelle globale
// ─────────────────────────────────────────────────────────────────────────
/**
 * $or : Opérateur MongoDB "OU logique"
 * La recherche matche si le texte est trouvé dans
 * AU MOINS UN des champs listés
 */
if (search) {
const regex = new RegExp(search, 'i');
query.$or = [
{ name: regex },
{ brand: regex },
{ categorie: regex },
{ sellers: regex },
{ desc: regex },
];
}

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 3 : Filtres par critères multiples
// ─────────────────────────────────────────────────────────────────────────
/**
 * $in : Opérateur MongoDB "est dans la liste"
 * Permet de filtrer par plusieurs valeurs à la fois
 * 
 * ?.length : Vérifie que le tableau existe ET n'est pas vide
 */

// Filtre par catégories
if (categories?.length) {
query.categorie = { $in: categories.map(c => new RegExp(c, 'i')) };
}

// Filtre par marques
if (brands?.length) {
query.brand = { $in: brands.map(b => new RegExp(b, 'i')) };
}

// Filtre par vendeurs (recherche dans le sous-document sellers)
if (sellers?.length) {
query['sellers.name'] = { $in: sellers.map(s => new RegExp(s, 'i')) };
}

// Filtre par description
    if(desc?.length){
query.desc = { $in: desc.map(d => new RegExp(d, 'i')) };
}

// ─────────────────────────────────────────────────────────────────────────
// ÉTAPE 4 : Exécution de la requête MongoDB
// ─────────────────────────────────────────────────────────────────────────
Product.find(query)

.then((results) => {

// Aucun résultat trouvé → tableau vide
if (!results || results.length === 0) {
res.status(200).json({ result: true, products: [] });
return;
}

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 5 : Calcul des moyennes pour chaque produit
// ─────────────────────────────────────────────────────────────────
let productsReworked = results.map((p) => {

let allNotes = [];
let allPrices = [];

for (let seller of p.sellers) {
allPrices.push(seller.price);
for (let avis of seller.avis) {
allNotes.push(avis.note);
}
}

// || 0 : Valeur par défaut si le tableau est vide
const noteMoy =
allNotes.reduce((t, n) => t + n, 0) / allNotes.length || 0;

const priceMoy =
allPrices.reduce((t, p) => t + p, 0) / allPrices.length || 0;

return {
id: p._id,
name: p.name,
desc: p.desc,
picture: p.picture,
brand: p.brand,
categorie: p.categorie,
priceMoy: Number(priceMoy.toFixed(2)),
noteMoy: Number(noteMoy.toFixed(2)),
};
});

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 6 : Filtres de prix (côté JavaScript)
// ─────────────────────────────────────────────────────────────────
/**
 * Pourquoi en JS et pas en MongoDB ?
 * Le prix moyen est CALCULÉ, il n'existe pas en BDD.
 * On doit donc filtrer après le calcul.
 */
if (minPrice) productsReworked = productsReworked.filter(p => p.priceMoy >= minPrice);
if (maxPrice) productsReworked = productsReworked.filter(p => p.priceMoy <= maxPrice);

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 7 : Tri selon le critère choisi
// ─────────────────────────────────────────────────────────────────
/**
 * Options de tri :
 * - price_asc : Moins cher en premier
 * - price_desc : Plus cher en premier
 * - défaut : Meilleures notes en premier
 */
if (sortBy === 'price_asc') {
productsReworked.sort((a, b) => a.priceMoy - b.priceMoy);
} else if (sortBy === 'price_desc') {
productsReworked.sort((a, b) => b.priceMoy - a.priceMoy);
} else {
productsReworked.sort((a, b) => b.noteMoy - a.noteMoy);
}

// ─────────────────────────────────────────────────────────────────
// ÉTAPE 8 : Réponse finale
// ─────────────────────────────────────────────────────────────────
res.status(200).json({ result: true, products: productsReworked });
});
});


// ============================================================================
// 7. EXPORT DU ROUTER
// ============================================================================

/**
 * On exporte le routeur pour qu'il soit monté dans app.js
 * via : app.use('/products', productsRouter)
 */
module.exports = router;
