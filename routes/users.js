/**
 * ============================================================================
 * FICHIER : routes/users.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier gère l'authentification des utilisateurs pour l'application
 * AtlasLoot. Il permet aux utilisateurs de créer un compte et de se connecter.
 * 
 * RÔLE :
 * - POST /users/signup → Créer un nouvel utilisateur avec mot de passe hashé
 * - POST /users/signin → Authentifier un utilisateur existant
 * - GET /users/allUsers → Récupérer tous les utilisateurs (admin/debug)
 * 
 * LOGIQUE MÉTIER :
 * - À l'inscription, une WishList par défaut est créée automatiquement
 * - Les mots de passe sont hashés avec bcrypt (sécurité)
 * - Un token unique est généré pour chaque utilisateur (authentification)
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Express Router : Organisation des routes
 * - Mongoose : ODM pour MongoDB (modèles User, List)
 * - bcrypt : Hashage sécurisé des mots de passe
 * - uid2 : Génération de tokens uniques
 * 
 * ============================================================================
 */


// ============================================================================
// 1. IMPORTS ET CONFIGURATION
// ============================================================================

/**
 * Express et Router pour créer les endpoints
 */
var express = require('express');
var router = express.Router();

/**
 * Connexion à la base de données MongoDB
 * Ce fichier établit la connexion via Mongoose
 */
require('../models/connection');

/**
 * checkBody : Fonction utilitaire pour valider les champs requis
 * Vérifie que tous les champs obligatoires sont présents et non vides
 */
const {checkBody} = require('../modules/checkBody');

/**
 * Modèles Mongoose :
 * - User : Structure d'un utilisateur (mail, nom, token, listes, etc.)
 * - List : Structure d'une liste de favoris (nom, produits, etc.)
 */
const User = require('../models/user');
const List = require('../models/list');

/**
 * uid2 : Génère des chaînes aléatoires uniques
 * Utilisé pour créer des tokens d'authentification
 * Exemple : uid2(32) → "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 */
const uid2 = require('uid2');

/**
 * bcrypt : Librairie de hashage de mots de passe
 * - hashSync() : Hash un mot de passe
 * - compareSync() : Compare un mot de passe avec son hash
 */
const bcrypt = require('bcrypt');


// ============================================================================
// 2. ROUTE GET /users/allUsers
// ============================================================================

/**
 * Récupère la liste de tous les utilisateurs
 * 
 * USAGE : Debug / Administration
 * ATTENTION : En production, cette route devrait être protégée !
 * 
 * RÉPONSE :
 * {
 *   result: true,
 *   Users: [{ mail, firstname, lastname, token, lists }, ...]
 * }
 */
router.get('/allUsers', (req, res) => {

	// Requête MongoDB : récupère tous les documents de la collection 'users'
	User.find().then((allUser) => {
		res.json({result: true, Users: allUser});
	});

});


// ============================================================================
// 3. ROUTE POST /users/signup (INSCRIPTION)
// ============================================================================

/**
 * Crée un nouveau compte utilisateur
 * 
 * BODY REQUIS :
 * {
 *   firstname: "Jean",
 *   lastname: "Dupont", 
 *   mail: "jean@email.com",
 *   password: "motdepasse123"
 * }
 * 
 * LOGIQUE :
 * 1. Valider que tous les champs sont présents
 * 2. Vérifier le format de l'email
 * 3. Vérifier que l'utilisateur n'existe pas déjà
 * 4. Hasher le mot de passe
 * 5. Créer l'utilisateur en BDD
 * 6. Créer une WishList par défaut
 * 7. Associer la liste à l'utilisateur
 * 8. Retourner le token pour connexion automatique
 */
router.post('/signup', (req, res) => {

    // ─────────────────────────────────────────────────────────────────────
    // ÉTAPE 1 : Vérification des champs obligatoires
    // ─────────────────────────────────────────────────────────────────────
    if (!checkBody(req.body, ['firstname', 'lastname', 'password', 'mail'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        return;
    }

    // ─────────────────────────────────────────────────────────────────────
    // ÉTAPE 2 : Validation du format email avec RegEx
    // ─────────────────────────────────────────────────────────────────────
    /**
     * Cette expression régulière vérifie :
     * - Caractères alphanumériques avant @
     * - Un @ obligatoire
     * - Un domaine avec au moins un point
     * - Une extension de 2+ caractères
     */
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(req.body.mail)) {
        res.json({ result: false, error: 'Invalid email format' });
        return;
    }

    // ─────────────────────────────────────────────────────────────────────
    // ÉTAPE 3 : Vérification de l'unicité de l'email
    // ─────────────────────────────────────────────────────────────────────
    User.findOne({ mail: req.body.mail }).then((data) => {

        // Si aucun utilisateur trouvé avec cet email → on peut créer
        if (data === null) {

            // ─────────────────────────────────────────────────────────────
            // ÉTAPE 4 : Hashage du mot de passe
            // ─────────────────────────────────────────────────────────────
            /**
             * bcrypt.hashSync(password, saltRounds)
             * - Le sel (salt) de 10 rounds rend le hash unique et sécurisé
             * - Même mot de passe = hash différent à chaque fois
             */
            const hash = bcrypt.hashSync(req.body.password, 10);
            
            // ─────────────────────────────────────────────────────────────
            // ÉTAPE 5 : Création du nouvel utilisateur
            // ─────────────────────────────────────────────────────────────
            const newUser = new User({
                mail: req.body.mail,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                password: hash,                // Mot de passe hashé (jamais en clair !)
                token: uid2(32),               // Token unique de 32 caractères
                lists: [],                     // Tableau vide, sera rempli après
            });

            // ─────────────────────────────────────────────────────────────
            // ÉTAPE 6 : Sauvegarde de l'utilisateur en BDD
            // ─────────────────────────────────────────────────────────────
            newUser.save().then((newDoc) => {
                
                // ─────────────────────────────────────────────────────────
                // ÉTAPE 7 : Création de la WishList par défaut
                // ─────────────────────────────────────────────────────────
                /**
                 * Chaque nouvel utilisateur reçoit automatiquement
                 * une liste "WishList" pour sauvegarder ses favoris
                 */
                const defaultList = new List({
                    name: "WishList",
                    idUser: newDoc._id,        // Référence vers l'utilisateur
                    idProduct: [],             // Pas encore de produits
                    done: false                // Liste non archivée
                });

                defaultList.save().then((savedList) => {

                        // ─────────────────────────────────────────────────
                        // ÉTAPE 8 : Association de la liste à l'utilisateur
                        // ─────────────────────────────────────────────────
                        /**
                         * $push : Opérateur MongoDB pour ajouter un élément à un tableau
                         * On ajoute l'ID de la liste dans le tableau 'lists' de l'user
                         */
                        User.updateOne(
                            { _id: newDoc._id },
                            { $push: { lists: savedList._id } }
                        ).then(() => {

                            // ─────────────────────────────────────────────
                            // ÉTAPE 9 : Réponse finale avec le token
                            // ─────────────────────────────────────────────
                            /**
                             * Le frontend reçoit le token pour :
                             * - Stocker en localStorage/Redux
                             * - Authentifier les futures requêtes
                             */
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
                        // Erreur lors de la création de la liste par défaut
                        res.status(500).json({ result: false, error: "Failed to create default list" });
                    });

            }).catch((err) => {
                // Erreur lors de la sauvegarde de l'utilisateur
                res.status(500).json({ result: false, error: 'User save failed' });
            });

        } else {
            // L'email existe déjà en BDD
            res.json({ result: false, error: 'User already exists' });
        }
    });
});


// ============================================================================
// 4. ROUTE POST /users/signin (CONNEXION)
// ============================================================================

/**
 * Authentifie un utilisateur existant
 * 
 * BODY REQUIS :
 * {
 *   mail: "jean@email.com",
 *   password: "motdepasse123"
 * }
 * 
 * LOGIQUE :
 * 1. Valider les champs requis
 * 2. Rechercher l'utilisateur par email
 * 3. Comparer le mot de passe avec le hash en BDD
 * 4. Retourner le token si authentification réussie
 */
router.post('/signin', (req, res) => {

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 1 : Validation des champs obligatoires
  // ─────────────────────────────────────────────────────────────────────────
  if (!checkBody(req.body, ["mail","password"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAPE 2 : Recherche de l'utilisateur par email
  // ─────────────────────────────────────────────────────────────────────────
  User.findOne({ mail: req.body.mail }).then((user) => {

    // ─────────────────────────────────────────────────────────────────────
    // ÉTAPE 3 : Vérification du mot de passe
    // ─────────────────────────────────────────────────────────────────────
    /**
     * bcrypt.compareSync(password, hash)
     * Compare le mot de passe en clair avec le hash stocké
     * Retourne true si ils correspondent, false sinon
     */
    if (user && bcrypt.compareSync(req.body.password, user.password)) {

      // ─────────────────────────────────────────────────────────────────────
      // ÉTAPE 4 : Authentification réussie
      // ─────────────────────────────────────────────────────────────────────
      res.json({
        result: true,
        token: user.token,
        firstname: user.firstname,
        lastname: user.lastname,
        mail: user.mail
      });

    } else {
      // Utilisateur non trouvé OU mot de passe incorrect
      res.json({result: false, error: 'User not found or wrong password'});
    }
  });
});


// ============================================================================
// 5. EXPORT DU ROUTER
// ============================================================================

/**
 * On exporte le routeur pour qu'il soit monté dans app.js
 * via : app.use('/users', usersRouter)
 */
module.exports = router;
