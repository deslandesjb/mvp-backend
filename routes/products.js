// module.exports = router;
// ======================================================
// 1. INITIALISATION DU ROUTER
// ======================================================

// Express sert à créer des routes HTTP (GET, POST, etc.)
var express = require('express');

// Router permet de regrouper toutes les routes "produits"
var router = express.Router();

// Modèle Product = structure des produits dans MongoDB
const Product = require('../models/product');

// ======================================================
// 2. ROUTE GET /products
// Objectif :
// - récupérer tous les produits
// - calculer prix moyen et note moyenne
// - renvoyer des données propres pour la home / listing
// ======================================================
router.get('/', (req, res) => {
	// ÉTAPE 1 — Récupération brute des produits depuis MongoDB
	Product.find().then((dataProducts) => {
		// Sécurité : aucun produit trouvé
		if (!dataProducts) {
			res.status(404).json({ result: false, error: "Couldn't find products" });
			return;
		}

		// ÉTAPE 2 — Transformation des données
		// Mongo renvoie trop d'infos → on simplifie
		const productsReworked = dataProducts.map((p) => {
			let allNotes = []; // Toutes les notes du produit
			let allPrices = []; // Tous les prix du produit

			// ÉTAPE 2.1 — Parcours des vendeurs
			for (let seller of p.sellers) {
				allPrices.push(seller.price);

				// ÉTAPE 2.2 — Parcours des avis de chaque vendeur
				for (let avis of seller.avis) {
					allNotes.push(avis.note);
				}
			}

			// ÉTAPE 3 — Calcul de la note moyenne
			const noteMoy = allNotes.reduce((total, note) => total + note, 0) / allNotes.length;

			// ÉTAPE 4 — Calcul du prix moyen
			const priceMoy = allPrices.reduce((total, price) => total + price, 0) / allPrices.length;

			// ÉTAPE 5 — Objet final envoyé au frontend
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

		// ÉTAPE 6 — Tri : meilleurs produits en premier
		productsReworked.sort((a, b) => b.noteMoy - a.noteMoy);

		// ÉTAPE 7 — Réponse finale
		res.status(200).json({ result: true, products: productsReworked });
	});
});

// ======================================================
// 3. ROUTE GET /products/categories
// Objectif :
// - récupérer toutes les catégories
// - supprimer les doublons
// ======================================================
router.get('/categories', (req, res) => {
	Product.find().then((dataCats) => {
		if (!dataCats) {
			res.status(404).json({ result: false, error: "Couldn't find products" });
			return;
		}

		// ÉTAPE 1 — Tableau vide pour stocker les catégories uniques
		const categories = [];

		// ÉTAPE 2 — Parcours des produits
		dataCats.forEach((product) => {
			// On ajoute la catégorie seulement si elle n’existe pas déjà
			if (!categories.includes(product.categorie)) {
				categories.push(product.categorie);
			}
		});

		// ÉTAPE 3 — Réponse
		res.status(200).json({ result: true, categories });
	});
});

router.get('/brands', (req, res) => {
	Product.find().then((dataBrands) => {
		if (!dataBrands) {
			res.status(404).json({ result: false, error: "Couldn't find products" });
			return;
		}

		// ÉTAPE 1 — Tableau vide pour stocker les brands uniques
		const brands = [];

		// ÉTAPE 2 — Parcours des produits
		dataBrands.forEach((product) => {
			// On ajoute la brands seulement si elle n’existe pas déjà
			if (!brands.includes(product.brand)) {
				brands.push(product.brand);
			}
		});

		// ÉTAPE 3 — Réponse
		res.status(200).json({ result: true, brands });
	});
});

// ======================================================
// 5. ROUTE GET /products/id/:idProduct
// Objectif :
// - récupérer UN produit (page détail)
// ======================================================
router.get('/id/:idProduct', (req, res) => {
	const { idProduct } = req.params;

	if (!idProduct) {
		res.status(406).json({ result: false, error: 'Missing product ID' });
		return;
	}

	// ÉTAPE 1 — Recherche par ID
	Product.findById(idProduct).then((product) => {
		if (!product) {
			res.status(404).json({ result: false, error: 'Product not found' });
			return;
		}

		let allNotes = [];
		let allPrices = [];

		// ÉTAPE 2 — Calcul moyennes
		for (let seller of product.sellers) {
			allPrices.push(seller.price);
			for (let avis of seller.avis) {
				allNotes.push(avis.note);
			}
		}

		const noteMoy = allNotes.reduce((t, n) => t + n, 0) / allNotes.length;

		const priceMoy = allPrices.reduce((t, p) => t + p, 0) / allPrices.length;

		// ÉTAPE 3 — Produit détaillé
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

// ======================================================
// 6. ROUTE POST /products/search
// Objectif :
// - recherche avancée
// - filtres multiples
// - tri dynamique
// ======================================================
router.post('/search', (req, res) => {
	// ÉTAPE 1 — Données envoyées par le frontend
	const { search, categories, brands, sellers, minPrice, maxPrice, sortBy, desc } = req.body;

	let query = {}; // Requête MongoDB dynamique

	// ÉTAPE 2 — Recherche textuelle globale
	if (search) {
		const regex = new RegExp(search, 'i');
		query.$or = [{ name: regex }, { brand: regex }, { categorie: regex }, { sellers: regex }, { desc: regex }];
	}

	// ÉTAPE 3 — Filtres MongoDB
	if (categories?.length) {
		query.categorie = { $in: categories.map((c) => new RegExp(c, 'i')) };
	}

	if (brands?.length) {
		query.brand = { $in: brands.map((b) => new RegExp(b, 'i')) };
	}

	if (sellers?.length) {
		query['sellers.name'] = { $in: sellers.map((s) => new RegExp(s, 'i')) };
	}
	if (desc?.length) {
		query.desc = { $in: desc.map((d) => new RegExp(d, 'i')) };
	}
	// ÉTAPE 4 — Exécution de la requête
	Product.find(query).then((results) => {
		if (!results || results.length === 0) {
			res.status(200).json({ result: true, products: [] });
			return;
		}

		// ÉTAPE 5 — Calcul des moyennes
		let productsReworked = results.map((p) => {
			let allNotes = [];
			let allPrices = [];

			for (let seller of p.sellers) {
				allPrices.push(seller.price);
				for (let avis of seller.avis) {
					allNotes.push(avis.note);
				}
			}

			const noteMoy = allNotes.reduce((t, n) => t + n, 0) / allNotes.length || 0;

			const priceMoy = allPrices.reduce((t, p) => t + p, 0) / allPrices.length || 0;

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

		// ÉTAPE 6 — Filtres prix (JS)
		if (minPrice) productsReworked = productsReworked.filter((p) => p.priceMoy >= minPrice);
		if (maxPrice) productsReworked = productsReworked.filter((p) => p.priceMoy <= maxPrice);

		// ÉTAPE 7 — Tri final
		if (sortBy === 'price_asc') {
			productsReworked.sort((a, b) => a.priceMoy - b.priceMoy);
		} else if (sortBy === 'price_desc') {
			productsReworked.sort((a, b) => b.priceMoy - a.priceMoy);
		} else {
			productsReworked.sort((a, b) => b.noteMoy - a.noteMoy);
		}

		// ÉTAPE 8 — Réponse finale
		res.status(200).json({ result: true, products: productsReworked });
	});
});

// ======================================================
// EXPORT DU ROUTER
// ======================================================
module.exports = router;
