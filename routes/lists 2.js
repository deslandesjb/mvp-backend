var express = require('express');
var router = express.Router();
const List = require('../models/list')
const User = require('../models/user')
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
      done: false,
    });

    newList.save()
  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, response: 'Server error' });
  }
});

router.post('/listDone/:idList', async (req, res) => {
  try {
    const user = await User.findOne({ token: token })
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

    const user = await User.findOne({ token: token })
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

    List.findOne({ _idProduct: product._id }).then(list())
    // utiliser elementmatch mongoose dans findOne pour trouver si il existe



  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, response: 'Server error' });
  }
});

module.exports = router;
