var express = require('express');
var router = express.Router();
const Product = require('../models/product');

// fonction calcul moyenne
const moyenne = (notes) => {
	let total = 0;
	for (let i = 0; i < notes.length; i++) {
		total += notes[i];
	}
	const moyenne = total / notes.length;
	return moyenne;
};

// ======================================================
// ROUTE GET /
// recupération tout les produits pour la Homepage
// ======================================================
router.get('/', (req, res) => {
	Product.find().then((dataProducts) => {
		// pas de produits
		if (!dataProducts) {
			res.status(404).json({ result: false, error: "Couldn't find any products" });
			return;
		}

		// calcul moyennes notes et prix :
		const productsReworked = dataProducts.map((p) => {
			// stock notes et prix dans un tableau
			let allNotes = [];
			let allPrices = [];

			for (let seller of p.sellers) {
				allPrices.push(seller.price);
				for (let avis of seller.avis) {
					allNotes.push(avis.note);
				}
			}

			// Calcul de la note + prix moyenne
			const noteMoy = moyenne(allNotes);
			const priceMoy = moyenne(allPrices);

			// result
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

		// Tri meilleur note a la plus basse
		productsReworked.sort((a, b) => b.noteMoy - a.noteMoy);

		res.status(200).json({ result: true, products: productsReworked });
	});
});

// ======================================================
// ROUTE GET /categories
// recupération catégories UNIQUES
// ======================================================
router.get('/categories', (req, res) => {
	Product.find().then((dataCats) => {
		// si pas de produits
		if (!dataCats) {
			res.status(404).json({ result: false, error: "Couldn't find products" });
			return;
		}
		// parcours tous les produits et stock categories uniques dans un tableau
		const categories = [];
		dataCats.forEach((product) => {
			// si existe pas deja dans tableau
			if (!categories.includes(product.categorie)) {
				categories.push(product.categorie);
			}
		});

		res.status(200).json({ result: true, categories });
	});
});

// ======================================================
// ROUTE GET /brands
// recupération brands UNIQUES
// ======================================================
router.get('/brands', (req, res) => {
	Product.find().then((dataBrands) => {
		// si pas de produits
		if (!dataBrands) {
			res.status(404).json({ result: false, error: "Couldn't find products" });
			return;
		}

		// parcours tous les produits et stock brands uniques dans un tableau
		const brands = [];
		dataBrands.forEach((product) => {
			// si existe pas deja dans tableau
			if (!brands.includes(product.brand)) {
				brands.push(product.brand);
			}
		});

		res.status(200).json({ result: true, brands });
	});
});

// ======================================================
// ROUTE GET /id/:idProduct
// pour page produit
// ======================================================
router.get('/id/:idProduct', (req, res) => {
	const { idProduct } = req.params;

	// si pas d'ID
	if (!idProduct) {
		res.status(406).json({ result: false, error: 'Missing product ID' });
		return;
	}

	// recherche produit par ID
	Product.findById(idProduct).then((product) => {
		// si pas de produit
		if (!product) {
			res.status(404).json({ result: false, error: 'Product not found' });
			return;
		}
		// stock toutes notes et prix pour le produit
		let allNotes = [];
		let allPrices = [];
		for (let seller of product.sellers) {
			allPrices.push(seller.price);
			for (let avis of seller.avis) {
				allNotes.push(avis.note);
			}
		}
		// calcul moyenne note et prix
		const noteMoy = moyenne(allNotes);
		const priceMoy = moyenne(allPrices);

		// resultat pour fiche produit
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
// ROUTE POST /search
// - recherche dans les champs nom desc brands categorie
// - filtres
// ======================================================
router.post('/search', (req, res) => {
	// filtres du front
	const { search, categories, brands, minPrice, maxPrice, sortBy } = req.body;

	// recup all products
	Product.find().then((data) => {
		let products = data.map((p) => {
			// stock notes et prix dans un tableau
			let allNotes = [];
			let allPrices = [];

			for (let seller of p.sellers) {
				allPrices.push(seller.price);
				for (let avis of seller.avis) {
					allNotes.push(avis.note);
				}
			}

			// Calcul de la note + prix moyenne
			const noteMoy = moyenne(allNotes);
			const priceMoy = moyenne(allPrices);

			return {
				id: p._id,
				name: p.name,
				desc: p.desc,
				picture: p.picture,
				brand: p.brand,
				categorie: p.categorie,
				sellers: p.sellers,
				priceMoy: priceMoy.toFixed(2),
				noteMoy: noteMoy.toFixed(2),
			};
		});

		// Filtre Recherche nom / desc / brand / cat
		if (search) {
			const searchLower = search.toLowerCase();
			products = products.filter(
				(product) =>
					product.name.toLowerCase().includes(searchLower) ||
					product.desc.toLowerCase().includes(searchLower) ||
					product.brand.toLowerCase().includes(searchLower) ||
					product.categorie.toLowerCase().includes(searchLower)
			);
		}

		// Filtre cat
		if (categories && categories.length > 0) {
			const categoriesLower = categories.map((cat) => cat.toLowerCase());
			products = products.filter(
				(product) => product.categorie && categoriesLower.includes(product.categorie.toLowerCase())
			);
		}

		// Filtre brand
		if (brands && brands.length > 0) {
			const brandsLower = brands.map((b) => b.toLowerCase());
			products = products.filter((product) => product.brand && brandsLower.includes(product.brand.toLowerCase()));
		}

		// Filtre Prix Min / Max
		if (minPrice) {
			products = products.filter((product) => product.priceMoy >= minPrice);
		}
		if (maxPrice) {
			products = products.filter((product) => product.priceMoy <= maxPrice);
		}

		// Tri meilleur note a la plus basse
		products.sort((a, b) => b.noteMoy - a.noteMoy);

		res.status(200).json({ result: true, products });
	});
});

// ======================================================
// EXPORT DU ROUTER
// ======================================================
module.exports = router;
