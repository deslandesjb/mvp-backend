const mongoose = require('mongoose');

// sub-doc
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

const productSchema = mongoose.Schema({
	name: String,
	desc: String,
	picture: pictureSchema,
	brand: String,
	categorie: String,
	sellers: [sellersSchema],
});

const Product = mongoose.model('products', productSchema);
module.exports = Product;
