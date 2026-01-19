const mongoose = require('mongoose');

// sous-doc
const pictureSchema = mongoose.Schema({
	title: String,
	url: String,
});
const avisSchema = mongoose.Schema({
	content: String,
	note: Number,
});
const sellersSchema = mongoose.Schema({
	seller: String,
	avis: [avisSchema],
	url: String,
	price: Number,
});

// Product Schema
const productSchema = mongoose.Schema({
	name: String,
	desc: String,
	picture: [pictureSchema], // sous-document
	brand: String,
	categorie: String,
	sellers: [sellersSchema], // sous-document
});

const Product = mongoose.model('products', productSchema);
module.exports = Product;
