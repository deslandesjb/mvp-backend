/**
 * ============================================================================
 * FICHIER : routes/addSku.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier est un utilitaire pour générer des SKU (Stock Keeping Unit)
 * pour les produits. Un SKU est un identifiant unique utilisé dans la
 * gestion des stocks et le suivi des produits.
 * 
 * RÔLE :
 * - POST /addSku → Récupérer les produits depuis une API externe
 * - Générer un SKU unique pour chaque produit
 * - Retourner les produits enrichis avec leurs SKU
 * 
 * LOGIQUE MÉTIER :
 * - Les produits avec le même nom reçoivent le même SKU
 * - Permet d'identifier les variantes d'un même produit
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Express Router : Organisation des routes
 * - Fetch API : Récupération de données depuis une API externe
 * - Génération aléatoire de chaînes pour les SKU
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


// ============================================================================
// 2. ROUTE POST /addSku (GÉNÉRER DES SKU)
// ============================================================================

/**
 * Récupère les produits depuis une API externe et leur ajoute des SKU
 * 
 * LOGIQUE :
 * 1. Fetch les produits depuis GitHub (API JSON)
 * 2. Générer un SKU unique pour chaque nom de produit
 * 3. Associer le même SKU aux produits avec le même nom
 * 4. Retourner les produits enrichis
 * 
 * UTILISATION :
 * Route utilitaire pour préparer les données avant import en BDD
 * 
 * RÉPONSE :
 * {
 *   result: true,
 *   products: [{ ...product, sku: "abc123" }, ...]
 * }
 */
router.post('/', async (req, res) => {

	try {
		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 1 : Récupération des produits depuis l'API externe
		// ─────────────────────────────────────────────────────────────────────
		/**
		 * fetch() : API native pour faire des requêtes HTTP
		 * On récupère un fichier JSON hébergé sur GitHub
		 */
		const response = await fetch(
			'https://raw.githubusercontent.com/Azeddine-EA/mvpApi/refs/heads/main/mvpApi.json'
		);

		// Conversion de la réponse en JSON
		const products = await response.json();


		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 2 : Fonction de génération de SKU
		// ─────────────────────────────────────────────────────────────────────
		/**
		 * generateSku() : Génère une chaîne aléatoire de N caractères
		 * 
		 * PARAMÈTRES :
		 * - length : Nombre de caractères (défaut: 6)
		 * 
		 * CARACTÈRES UTILISÉS :
		 * - Lettres minuscules (a-z)
		 * - Chiffres (0-9)
		 * 
		 * EXEMPLE : "a3b7k9"
		 */
		function generateSku(length = 6) {
			const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
			let sku = '';

			for (let i = 0; i < length; i++) {
				// Math.random() génère un nombre entre 0 et 1
				// On le multiplie par la longueur du tableau de caractères
				// Math.floor() arrondit vers le bas pour obtenir un index valide
				sku += chars[Math.floor(Math.random() * chars.length)];
			}

			return sku;
		}


		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 3 : Mapping nom → SKU (pour unicité par nom)
		// ─────────────────────────────────────────────────────────────────────
		/**
		 * skuByName : Objet qui stocke les SKU déjà générés par nom
		 * 
		 * Logique :
		 * - Si un produit a un nom déjà vu → on réutilise son SKU
		 * - Sinon → on génère un nouveau SKU
		 * 
		 * Cela permet aux variantes d'un même produit d'avoir le même SKU
		 */
		const skuByName = {};


		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 4 : Ajout des SKU aux produits
		// ─────────────────────────────────────────────────────────────────────
		/**
		 * map() : Transforme chaque produit en ajoutant un SKU
		 * 
		 * Spread operator (...product) :
		 * - Copie toutes les propriétés existantes du produit
		 * - Ajoute la nouvelle propriété 'sku'
		 */
		const productsWithSku = products.map(product => {

			// Si ce nom n'a pas encore de SKU → on en génère un
			if (!skuByName[product.name]) {
				skuByName[product.name] = generateSku();
			}

			// Retourne le produit enrichi avec son SKU
			return {
				...product,
				sku: skuByName[product.name]
			};
		});


		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 5 : Réponse avec les produits enrichis
		// ─────────────────────────────────────────────────────────────────────
		res.status(200).json({
			result: true,
			products: productsWithSku
		});

	} catch (error) {
		// ─────────────────────────────────────────────────────────────────────
		// GESTION DES ERREURS
		// ─────────────────────────────────────────────────────────────────────
		console.error(error);
		res.status(500).json({
			result: false,
			error: 'Erreur lors de la récupération des produits'
		});
	}
});


// ============================================================================
// 3. EXPORT DU ROUTER
// ============================================================================

/**
 * On exporte le routeur pour qu'il soit monté dans app.js
 * via : app.use('/addSku', addSkuRouter)
 */
module.exports = router;
