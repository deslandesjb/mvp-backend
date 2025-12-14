var express = require('express');
var router = express.Router();

router.post('/', async (req, res) => {
	try {
		const response = await fetch(
			'https://raw.githubusercontent.com/Azeddine-EA/mvpApi/refs/heads/main/mvpApi.json'
		);

		const products = await response.json();

		function generateSku(length = 6) {
			const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
			let sku = '';
			for (let i = 0; i < length; i++) {
				sku += chars[Math.floor(Math.random() * chars.length)];
			}
			return sku;
		}

		const skuByName = {};

		const productsWithSku = products.map(product => {
			if (!skuByName[product.name]) {
				skuByName[product.name] = generateSku();
			}

			return {
				...product,
				sku: skuByName[product.name]
			};
		});

		res.status(200).json({
			result: true,
			products: productsWithSku
		});

	} catch (error) {
		console.error(error);
		res.status(500).json({
			result: false,
			error: 'Erreur lors de la récupération des produits'
		});
	}
});


module.exports = router;
