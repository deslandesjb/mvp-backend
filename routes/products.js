var express = require('express');
var router = express.Router();
const Product = require('../models/product');

// get all products
router.get('/', (req, res) => {
	Product.find()
		// .sort({date: -1})
		.then((dataProducts) => {
			if (!dataProducts) {
				res.status(404).json({result: false, error: `Couldn't find products`});
				return;
			}
			// new table w/ moyenne & notes
			const productsReworked = dataProducts.map((p) => {
				let allNotes = [];
				let allPrices = [];
				for (let sellers of p.sellers) {
					// console.log(sellers.price);
					allPrices.push(sellers.price);
					for (let avis of sellers.avis) {
						const note = avis.note;
						allNotes.push(note);
					}
				}

				// noteMoy Calc
				let totalNote = 0;
				for (let note of allNotes) {
					// console.log(note);
					totalNote += note;
				}
				const noteMoy = totalNote / allNotes.length;

				// priceMoy Calc
				let totalPrice = 0;
				for (let price of allPrices) {
					totalPrice += price;
				}
				const priceMoy = totalPrice / allPrices.length;

				return {
					id: p.id,
					name: p.name,
					desc: p.desc,
					picture: p.picture,
					brand: p.brand,
					categorie: p.categorie,
					priceMoy: priceMoy.toFixed(2),
					noteMoy: noteMoy.toFixed(2),
				};
			});
			res.status(200).json({result: true, products: productsReworked});
		});
});

// get unique categories
router.get('/categories', (req, res) => {
	Product.find()
		// .sort({date: -1})
		.then((dataCats) => {
			if (!dataCats) {
				res.status(404).json({result: false, error: `Couldn't find products`});
				return;
			}
			const arrayCat = [];
			dataCats.forEach((c) => {
				// if (!arrayCat.includes(c.categorie)) {
				if (!arrayCat.find((cat) => cat === c.categorie)) {
					arrayCat.push(c.categorie);
				}

				return arrayCat;
			});
			res.status(200).json({result: true, categories: arrayCat});
		});
});

// /post products by categories
router.post('/', (req, res) => {
	let {categorie} = req.body;
	categorie = new RegExp(categorie, 'i');
	if (!categorie) {
		res.status(406).json({result: false, error: 'One or many of the fields are missing'});
		return;
	}

	Product.find({categorie: categorie})
		// .sort({date: -1})
		.then((dataProducts) => {
			if (!dataProducts) {
				res.status(404).json({result: false, error: `Couldn't find products`});
				return;
			}
			// new table w/ moyenne & notes
			const productsReworked = dataProducts.map((p) => {
				let allNotes = [];
				let allPrices = [];
				for (let sellers of p.sellers) {
					// console.log(sellers.price);
					allPrices.push(sellers.price);
					for (let avis of sellers.avis) {
						const note = avis.note;
						allNotes.push(note);
					}
				}

				// noteMoy Calc
				let totalNote = 0;
				for (let note of allNotes) {
					// console.log(note);
					totalNote += note;
				}
				const noteMoy = totalNote / allNotes.length;

				// priceMoy Calc
				let totalPrice = 0;
				for (let price of allPrices) {
					totalPrice += price;
				}
				const priceMoy = totalPrice / allPrices.length;

				return {
					id: p.id,
					name: p.name,
					desc: p.desc,
					brand: p.brand,
					categorie: p.categorie,
					priceMoy: priceMoy.toFixed(2),
					noteMoy: noteMoy.toFixed(2),
				};
			});
			res.status(200).json({result: true, products: productsReworked});
		});
});

// post 1 products by ID (product page)
router.post('/id', (req, res) => {
	let {idProduct} = req.body;
	if (!idProduct) {
		res.status(406).json({result: false, error: 'One or many of the fields are missing'});
		return;
	}

	Product.findById(idProduct)
		// .sort({date: -1})
		.then((dataProduct) => {
			if (!dataProduct) {
				res.status(404).json({result: false, error: `Product not found`});
				return;
			}
			// new obj with moyenne & notes
			let allNotes = [];
			let allPrices = [];
			for (let seller of dataProduct.sellers) {
				// console.log(sellers.price);
				allPrices.push(seller.price);
				for (let avis of seller.avis) {
					const note = avis.note;
					allNotes.push(note);
				}
			}

			// noteMoy Calc
			let totalNote = 0;
			for (let note of allNotes) {
				// console.log(note);
				totalNote += note;
			}
			const noteMoy = totalNote / allNotes.length;

			// priceMoy Calc
			let totalPrice = 0;
			for (let price of allPrices) {
				totalPrice += price;
			}
			const priceMoy = totalPrice / allPrices.length;

			const productReworked = {
				id: dataProduct._id,
				name: dataProduct.name,
				desc: dataProduct.desc,
				brand: dataProduct.brand,
				categorie: dataProduct.categorie,
				sellers: dataProduct.sellers,
				priceMoy: priceMoy.toFixed(2),
				noteMoy: noteMoy.toFixed(2),
			};

			res.status(200).json({result: true, products: productReworked});
		});
});

// Post search
router.post('/search', (req, res) => {
	let {search} = req.body;
	search = new RegExp(search, 'i');
	if (!search) {
		res.status(406).json({result: false, error: 'One or many of the fields are missing'});
		return;
	}

	// $or check si l'un des element est dans ma propriété
	Product.find({$or: [{categorie: search}, {name: search}, {brand: search}]})
		// .sort({date: -1})
		.then((dataSearched) => {
			if (dataSearched.length > 0) {
				res.status(404).json({result: false, error: `No products to show`});
				return;
			}

			res.status(200).json({result: true, products: dataSearched});
			console.log(dataSearched.length);
		});
});

module.exports = router;
