/**
 * ============================================================================
 * FICHIER : models/product.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier définit le schéma et le modèle Mongoose pour les produits.
 * C'est le cœur du comparateur de prix : chaque produit a plusieurs vendeurs.
 * 
 * RÔLE :
 * - Définir la structure complète d'un produit
 * - Gérer les sous-documents (images, vendeurs, avis)
 * - Permettre la comparaison de prix entre vendeurs
 * 
 * STRUCTURE D'UN PRODUIT :
 * {
 *   name: "iPhone 15 Pro",
 *   desc: "Smartphone Apple 256Go",
 *   brand: "Apple",
 *   categorie: "Smartphone",
 *   picture: [{ title: "Vue face", url: "https://..." }],
 *   sellers: [
 *     {
 *       seller: "Amazon",
 *       price: 1199,
 *       url: "https://amazon.fr/...",
 *       avis: [{ content: "Super produit", note: 5 }]
 *     },
 *     {
 *       seller: "Fnac",
 *       price: 1249,
 *       url: "https://fnac.com/...",
 *       avis: [{ content: "Excellent", note: 4 }]
 *     }
 *   ]
 * }
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Mongoose Schema : Définition de la structure
 * - Sous-documents (Sub-docs) : Structures imbriquées
 * 
 * ============================================================================
 */


// ============================================================================
// 1. IMPORT DE MONGOOSE
// ============================================================================

/**
 * Mongoose est l'ODM qui fait le lien entre Node.js et MongoDB.
 */
const mongoose = require('mongoose');


// ============================================================================
// 2. DÉFINITION DES SOUS-SCHÉMAS (SUB-DOCUMENTS)
// ============================================================================

/**
 * Les sous-schémas permettent de structurer les données imbriquées.
 * Ils ne créent PAS de collection séparée, ils sont inclus dans le document parent.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SCHÉMA PICTURE : Structure d'une image produit
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Chaque produit peut avoir plusieurs images.
 * 
 * CHAMPS :
 * - title : Titre/description de l'image (ex: "Vue de face")
 * - url : URL complète de l'image
 */
const pictureSchema = mongoose.Schema({
	title: String,
	url: String,
});


// ─────────────────────────────────────────────────────────────────────────────
// SCHÉMA AVIS : Structure d'un avis client
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Les avis sont liés à un vendeur spécifique.
 * Un avis Amazon est différent d'un avis Fnac.
 * 
 * CHAMPS :
 * - content : Texte de l'avis client
 * - note : Note sur 5 (1 à 5 étoiles)
 */
const avisSchema = mongoose.Schema({
	content: String,
	note: Number,
});


// ─────────────────────────────────────────────────────────────────────────────
// SCHÉMA SELLERS : Structure d'un vendeur
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Chaque vendeur propose le produit à un prix différent.
 * C'est ici que se fait la comparaison de prix.
 * 
 * CHAMPS :
 * - seller : Nom du vendeur (Amazon, Fnac, Darty)
 * - avis : Tableau d'avis clients pour CE vendeur
 * - url : Lien direct vers la page produit chez le vendeur
 * - price : Prix actuel chez ce vendeur
 */
const sellersSchema = mongoose.Schema({
	seller: String,
	avis: [avisSchema],      // Tableau de sous-documents avis
	url: String,
	price: Number,
});


// ============================================================================
// 3. DÉFINITION DU SCHÉMA PRODUIT PRINCIPAL
// ============================================================================

/**
 * Le schéma principal du produit contient les infos générales
 * et les sous-documents pour les images et vendeurs.
 * 
 * CHAMPS :
 * - name : Nom complet du produit
 * - desc : Description détaillée
 * - picture : Tableau d'images
 * - brand : Marque du produit
 * - categorie : Catégorie (Smartphone, TV, Casque, etc.)
 * - sellers : Tableau de vendeurs avec leurs prix et avis
 */
const productSchema = mongoose.Schema({

	// Nom du produit (affiché en titre)
	name: String,

	// Description détaillée
	desc: String,

	// Images du produit (tableau de sous-documents)
	picture: [pictureSchema],

	// Marque (Apple, Samsung, Sony, etc.)
	brand: String,

	// Catégorie pour le filtrage
	categorie: String,

	// Vendeurs avec leurs prix et avis (tableau de sous-documents)
	// C'est ici que se fait la magie du comparateur !
	sellers: [sellersSchema],

});


// ============================================================================
// 4. CRÉATION ET EXPORT DU MODÈLE
// ============================================================================

/**
 * mongoose.model() crée un modèle à partir du schéma.
 * 
 * PARAMÈTRES :
 * - 'products' : Nom de la collection MongoDB
 * - productSchema : Le schéma défini ci-dessus
 * 
 * OPÉRATIONS COURANTES :
 * - Product.find() → Tous les produits
 * - Product.find({categorie: "Smartphone"}) → Filtrer par catégorie
 * - Product.findById(id) → Un produit par ID
 * - Product.find({$or: [{name: /iphone/i}, {brand: /apple/i}]}) → Recherche
 */
const Product = mongoose.model('products', productSchema);


/**
 * Export du modèle pour utilisation dans les routes
 * Utilisation : const Product = require('./models/product');
 */
module.exports = Product;
