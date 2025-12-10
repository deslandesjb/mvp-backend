var express = require('express');
var router = express.Router();
const List = require('../models/list')
const User = require('../models/user')
const Product = require('../models/product');

/* GET Lists. */
router.get('/lists/:idUser', function (req, res) {
  const idUser = req.params.idUser
  List.find({ idUser: idUser })
    .then(result => {
      res.json({ result: result })
    })
});


/* Post newList. */
router.post('/newLists/:token/', async (req, res) => {
  try {
    const token = req.params.token;
    const name = req.body.name;

    // $in verifie dans un tableau dans le cas de user il contient un tableau de token 
    const user = await User.findOne({ token: { $in: [token] } })
    if (!user) {
      return res.json({ result: false, response: 'User not connected !' })
    }

    List.find({ idUser: user._id }, { name: name })
    .then(found=>{
      console.log("user",found)
    if (found.length = 0) {
      const newList = new List({
        name: name,
        idUser: user._id,
        idProduct: [],
        done: false,
      });
      newList.save().then(newList => {
        return res.json({ result: true, newList: newList })
      })
    } else {
      return res.json({ result: false, response: "Name already used !"})
    }
    })


  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, response: 'Server error' });
  }
});

router.post('/listDone/:idList', async (req, res) => {
  try {
    const user = await User.findOne({ token: { $in: [token] } })
    const list = await List.findOne({ _id: req.params.idList })
    if (!user) {
      return res.json({ result: false, response: 'User not connected !' })
    }
    if (!list) {
      return res.json({ result: false, response: 'List not found !' })
    }
    if (list.done === false) {

      List.updateOne(
        { _id: list._id },
        { Done: true }
      )

    } else {
      List.updateOne(
        { _id: list._id },
        { Done: false }
      )
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, response: 'Server error' });
  }
});

router.post('/addToLists/:token/:idProduct/:idList', async (req, res) => {
  try {
    const { token, idProduct, idList } = req.params;
    const user = await User.findOne({ token: { $in: [token] } })
    if (!user) {
      return res.json({ result: false, response: 'User not connected !' })
    }
    const product = await Product.findOne({ _id: idProduct })
    if (!product) {
      return res.json({ result: false, response: 'Product not found !' })
    }
    const list = await List.findOne({ _id: idList })
    if (!list) {
      return res.json({ result: false, response: 'List not found !' })
    }

    // List.findOne({ idProduct: product._id }).then(list())
    List.findOne({ resulte: { $elemMatch: { idProduct: product._id, } } }).then(list())
    // utiliser elementmatch mongoose dans findOne pour trouver si il existe



  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, response: 'Server error' });
  }
});

module.exports = router;
