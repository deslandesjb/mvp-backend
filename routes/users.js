var express = require('express');
var router = express.Router();

// Routes utilisateur :
// POST /signup -> crée un utilisateur (mot de passe hashé) + wishlist par défaut, renvoie un token
// POST /signin -> authentifie l'utilisateur et renvoie son token
require('../models/connection');
const {checkBody} = require('../modules/checkBody');
const User = require('../models/user');
const List = require('../models/list');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

router.get('/allUsers', (req, res) => {
	User.find().then((allUser) => {
		res.json({result: true, Users: allUser});
	});
});

router.post('/signup', (req, res) => {
    // 1. Vérification des champs
    if (!checkBody(req.body, ['firstname', 'lastname', 'password', 'mail'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        return;
    }

    // 2. Vérification format email
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(req.body.mail)) {
        res.json({ result: false, error: 'Invalid email format' });
        return;
    }

    // 3. Vérification existence utilisateur
    User.findOne({ mail: req.body.mail }).then((data) => {
        if (data === null) {
            const hash = bcrypt.hashSync(req.body.password, 10);
            
            const newUser = new User({
                mail: req.body.mail,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                password: hash,
                token: uid2(32),
                lists: [], // On initialise le tableau vide
            });

            // 4. Sauvegarde du User
            newUser.save().then((newDoc) => {
                
                // 5. Création de la WishList par défaut
                const defaultList = new List({
                    name: "WishList",
                    idUser: newDoc._id,
                    idProduct: [],
                    done: false
                });

                defaultList.save().then((savedList) => {
                        // 6. Mise à jour du User pour ajouter l'ID de la liste
                        User.updateOne(
                            { _id: newDoc._id },
                            { $push: { lists: savedList._id } }
                        ).then(() => {
                            // 7. Envoi de la réponse finale (UNE SEULE FOIS)
                            res.json({
                                result: true,
                                token: newDoc.token,
                                firstname: newDoc.firstname,
                                lastname: newDoc.lastname,
                                mail: newDoc.mail
                            });
                        });
                    })
                    .catch((err) => {
                        // Erreur lors de la création de la liste
                        res.status(500).json({ result: false, error: "Failed to create default list" });
                    });

            }).catch((err) => {
                // Erreur lors de la sauvegarde du user
                res.status(500).json({ result: false, error: 'User save failed' });
            });

        } else {
            // Utilisateur existe déjà
            res.json({ result: false, error: 'User already exists' });
        }
    });
});


router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ["mail","password"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  User.findOne({ mail: req.body.mail }).then((user) => {
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.json({
        result: true,
        token: user.token,
        firstname: user.firstname,
        lastname: user.lastname,
        mail: user.mail
      });
    } else {
      res.json({result: false, error: 'User not found or wrong password'});
    }
  });
});



module.exports = router;
