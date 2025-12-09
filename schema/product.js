const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
	firstName: String,
	lastName: String,
	email: String,
	inscriptionDate: Date,
});

const Product = mongoose.model('products', productSchema);
module.exports = Product;
