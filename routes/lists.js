var express = require('express');
var router = express.Router();
const List = require('../models/list')
const User = require('../models/user')
const Product = require('../models/product');

/* GET Lists. */
router.get('/:idUser', function (req, res) {
  const idUser = req.params.idUser
  List.find({ idUser: idUser })
    .populate('idProduct')
    .then(result => {
      res.json({ result: true, listsUser: result })
    })
});
/* Post newList. */
router.post('/newLists/:token/', function (req, res) {
  const token = req.params.token;
  const name = req.body.name;

  // $in verifie dans un tableau dans le cas de user il contient un tableau de token 
  User.findOne({ token: { $in: [token] } }).then(user => {

    if (!user) {
      return res.json({ result: false, response: 'User not connected !' })
    }

    List.find({ idUser: user._id, name: name })
      .then(found => {
        console.log("user", found)
        if (found.length < 1) {
          const newList = new List({
            name: name,
            idUser: user._id,
            idProduct: [],
            done: false,
          });
          newList.save().then(list => {
            User.findByIdAndUpdate(user._id, { $push: { lists: list._id } }).then(() => {
              return res.json({ result: true, newList: list })
            })
          })
        } else {
          return res.json({ result: false, response: "Name already used !" })
        }
      })
  })
});
/* Post listDone. */
router.post('/listDone/:idList', async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.idList })
    console.log(list)
    if (!list) {
      return res.json({ result: false, response: 'List not found !' })
    }
    const nouveauStatut = !list.done;
    const updateResult = await List.updateOne(
      { _id: list._id },
      { done: nouveauStatut }
    );
    return res.json({
      result: true,
      done: nouveauStatut,
      updateDB: updateResult
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, response: 'Server error' });
  }
});
/* Post addToLists. */
router.post('/addToLists/:token/:idProduct/:idList', async (req, res) => {
  const { token, idProduct, idList } = req.params;

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.json({ result: false, response: 'User not connected !' });
    }

    const product = await Product.findById(idProduct);
    if (!product) {
      return res.json({ result: false, response: 'Product not found !' });
    }

    // Vérifie si la liste appartient à l'utilisateur
    if (!user.lists.includes(idList)) {
      return res.json({ result: false, response: 'List not found or not belonging to user!' });
    }

    const list = await List.findById(idList);
    if (!list) {
      return res.json({ result: false, response: 'List not found !' });
    }

    // Vérifie si le produit est déjà dans la liste
    const productInList = list.idProduct.includes(product._id);

    let update
    if (!productInList) {
      update = await List.findByIdAndUpdate(
        idList,
        { $push: { idProduct: product._id } },
      );
    } else {
      update = await List.findByIdAndUpdate(
        idList,
        { $pull: { idProduct: product._id } },
      );
    }

    return res.json({ result: true, updated: update });

  } catch (error) {
    console.error(error);
    res.json({ result: false, error: "Internal server error" });
  }
});
/* Post removeList. */
router.delete('/removeList/:idList/:idUser', (req, res) => {
  const {idList,idUser} = req.params
  List.deleteOne({ _id: idList }).then(() => {
    User.findByIdAndUpdate(
      idUser,
      { $pull: { lists: idList } },
    );
    res.json({ result: true, list: "Supprimé !" });
  })
})


module.exports = router;
