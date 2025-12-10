const mongoose = require('mongoose');

const listsSchema = mongoose.Schema({
    name: String,
    idUser:{type: mongoose.Schema.Types.ObjectId, ref:'users'},
    idProduct:[{type: mongoose.Schema.Types.ObjectId, ref:'products'}],
});

const List = mongoose.model('lists', listsSchema);
module.exports = List;
