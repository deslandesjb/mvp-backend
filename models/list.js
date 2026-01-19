const mongoose = require('mongoose');

const listsSchema = mongoose.Schema({
	name: String,
	idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }, // Foreign key User
	idProduct: [{ type: mongoose.Schema.Types.ObjectId, ref: 'products' }], // Foreign key Product
	done: Boolean,
});

const List = mongoose.model('lists', listsSchema);
module.exports = List;
