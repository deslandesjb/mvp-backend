var express = require('express');
var router = express.Router();
const List = require('../models/list')
const User = require('../models/user')
const Prduct = require('../models/product');
const Product = require('../models/product');

/* GET Lists. */
router.get('/lists/:idUser', function (req, res) {
  const idUser = req.params.idUser
  List.find({ idUser: idUser })
});


/* Post newList. */
router.post('/newLists/:token/', async (req, res) => {
  try {
    const token = req.params.token;
    const name = req.body.name;
    
    const user = await User.findOne({ token: token })
    if (!user) {
      return res.json({ result: false, response: 'User not connected !' })
    }
    
    const newList = new List({
      name: name,
      idUser: user._id,
      idProduct: [],
    });
    
    newList.save()
  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, response: 'Server error' });
  }
});

router.post('/addToLists/:token/:idProduct/:idList', async (req, res) => {
  try {
    const {token,idProduct,idList} = req.params;
    
    const user = await User.findOne({ token: token })
    if (!user) {
      return res.json({ result: false, response: 'User not connected !' })
    }
    const product = await Product.findOne({ _id: idProduct })
    if(!product){
      return res.json({ result: false, response: 'Product not found !' })
    }
    const list = await List.findOne({ _id: idList })
    if(!list){
      return res.json({ result: false, response: 'List not found !' })
    }

    List.findOne({_idProduct:product._id}).then(list())
    // utiliser elementmatch mongoose dans findOne pour trouver si il existe
    


  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, response: 'Server error' });
  }
});

module.exports = router;
