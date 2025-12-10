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
			// calc moyenne notes
			const productsReworked = dataProducts.map((p) => {
				// noteMoy
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

				let totalNote = 0;
				for (let note of allNotes) {
					// console.log(note);
					totalNote += note;
				}
				const noteMoy = totalNote / allNotes.length;

				let totalPrice = 0;
				for (let price of allPrices) {
					totalPrice += price;
				}
				const priceMoy = totalPrice / allPrices.length;

				return {
					name: p.name,
					desc: p.desc,
					brand: p.brand,
					categorie: p.categorie,
					priceMoy: priceMoy.toFixed(2),
					noteMoy: noteMoy.toFixed(2),
				};
			});
			// TODO calc moyenne notes Azeddine
			// for (let dataProduct of dataProducts) {
			// 	let allNotes = [];
			// 	let i = 0;
			// 	// for (let seller of dataProduct.sellers[i].seller) {
			// 	for (let i = 0; i < dataProduct.sellers.length; i++) {
			// 		i++;
			// 		console.log(seller.note);
			// 	}
			// 	console.log(allNotes);
			// }
			res.status(200).json({result: true, products: productsReworked});
		});
});

// Post each category products OLD
// router.post('/', (req, res) => {
// 	let {categorie} = req.body;
// 	categorie = new RegExp(categorie, 'i');
// 	if (!categorie) {
// 		res.status(406).json({result: false, error: 'One or many of the fields are missing'});
// 		return;
// 	}

// 	Product.find({categorie: categorie})
// 		// .sort({date: -1})
// 		.then((dataProducts) => {
// 			if (dataProducts.length <= 1) {
// 				res.status(404).json({result: false, error: `Couldn't find products`});
// 				return;
// 			}
// 			res.status(200).json({result: true, products: dataProducts});
// 			console.log(dataProducts.length);
// 		});
// });

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
			if (dataSearched.length <= 1) {
				res.status(404).json({result: false, error: `No products to show`});
				return;
			}

			res.status(200).json({result: true, products: dataSearched});
			console.log(dataSearched.length);
		});
});

// imp guigz
router.post('/', (req, res) => {
	const {firstname, username, password} = req.body;
	if (!firstname || !username || !password) {
		res.status(406).json({result: false, error: 'One or many of the fields are missing'});
		return;
	}

	User.findOne({username: username}).then((dataProducts) => {
		if (!dataProducts) {
			const hash = bcrypt.hashSync(password, 10);
			const newUser = new User({
				firstname,
				username,
				password: hash,
				token: uid2(32),
			});
			newUser.save().then((dataProducts) => {
				if (dataProducts) {
					const {username, token} = dataProducts;
					res.status(201).json({
						result: true,
						message: 'User created',
						userdataProducts: {username, token},
					});
				} else {
					res.status(500).json({
						result: false,
						error: 'Error while trying to connect you to the DB. Try later',
					});
				}
			});
		} else {
			res.status(401).json({result: false, error: 'Unauthorized to create an account'});
		}
	});
});

module.exports = router;
