var express = require('express');
var router = express.Router();

// Routes utilisateur :
// POST /signup -> crée un utilisateur (mot de passe hashé) + wishlist par défaut, renvoie un token
// POST /signin -> authentifie l'utilisateur et renvoie son token
require("../models/connection");
const { checkBody } = require("../modules/checkBody");
const User = require("../models/user");
const List = require("../models/list");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");


// POST /signup
// 1) Vérifie les champs requis et le format de l'email
// 2) Si l'email n'existe pas : hash du mot de passe, création du User
// 3) Création d'une liste par défaut (`WishList`) liée à l'_id du user
// 4) Renvoie `{ result: true, token }` en cas de succès, ou une erreur (400/500)
router.post('/signup', (req, res) => {
	if (!checkBody(req.body, ["firstname", "lastname", "password", "mail"])) {
	  res.json({ result: false, error: "Missing or empty fields" });
	   return;
	 }

	const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	if (!regex.test(req.body.mail)) {
		res.json({result: false, error: 'Invalid email format'});
		return;
	}

	User.findOne({mail: req.body.mail}).then((data) => {
		if (data === null) {
			const hash = bcrypt.hashSync(req.body.password, 10);
			const newUser = new User({
				mail: req.body.mail,
				firstname: req.body.firstname,
				lastname: req.body.lastname,
				password: hash,
				token: uid2(32),
				lists: [],
			});

			newUser.save().then((newDoc) => {
				const defaultList = new List({
					name: "WishList",
					idUser: newDoc._id,
					idProduct: [],
					done: false
				});

				defaultList.save()
					.then((savedList) => {
						User.updateOne({_id:newDoc._id},{$push:{list:savedList._id}}).then(()=>{
							res.json({newUser:newDoc})
						})
					})
					.catch((err) => {
						res.status(500).json({ result: false, error: "Failed to create default list" });
					});
			})
			.catch((err) => {
				res.status(500).json({ result: false, error: "User save failed" });
			});
		} else {
			res.json({ result: false, error: "User already exists" });
		}
	});
});

// POST /signin
// Vérifie `mail` et `password`, recherche l'utilisateur, compare le hash
// Si succès -> renvoie `{ result: true, token }`, sinon erreur
router.post('/signin', (req, res) => {
	if (!checkBody(req.body, ["mail","password"])) {
	 res.json({ result: false, error: "Missing or empty fields" });
	   return;
	 }

	User.findOne({mail: req.body.mail}).then((data) => {
		if (data && bcrypt.compareSync(req.body.password, data.password)) {
			res.json({result: true, token: data.token});
		} else {
			res.json({result: false, error: 'User not found or wrong password'});
		}
	});
});


module.exports = router;
