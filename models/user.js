const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  mail : String,
  fistname : String,
  lastname : String,
  password : String,
  token : [String],
  lists: [{type: mongoose.Schema.Types.ObjectId, ref:'lists'}],
});

const User = mongoose.model('users', userSchema);

module.exports = User;