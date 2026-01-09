/**
 * ============================================================================
 * FICHIER : routes/lists.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier gère les listes de favoris/wishlist des utilisateurs.
 * Chaque utilisateur peut créer plusieurs listes et y ajouter des produits.
 * 
 * RÔLE :
 * - GET /lists/:token → Récupérer toutes les listes d'un utilisateur
 * - POST /lists/newLists/:token → Créer une nouvelle liste
 * - POST /lists/listDone/:idList → Marquer une liste comme terminée/archivée
 * - POST /lists/addToLists/:token/:idProduct/:idList → Ajouter/Retirer un produit
 * - DELETE /lists/removeList/:idList → Supprimer une liste
 * 
 * LOGIQUE MÉTIER :
 * - Les listes sont liées à un utilisateur via son token
 * - Un produit peut être ajouté ou retiré d'une liste (toggle)
 * - Les produits sont "populés" pour afficher leurs détails complets
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Express Router : Organisation des routes
 * - Mongoose : ODM MongoDB avec populate() pour les jointures
 * - Async/Await : Gestion asynchrone des requêtes BDD
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
 * Modèles Mongoose :
 * - List : Structure d'une liste (nom, utilisateur, produits, statut)
 * - User : Structure d'un utilisateur (pour trouver l'ID via token)
 * - Product : Structure d'un produit (pour populate)
 */
const List = require('../models/list');
const User = require('../models/user');
const Product = require('../models/product');


// ============================================================================
// 2. ROUTE GET /lists/:token (RÉCUPÉRER LES LISTES)
// ============================================================================

/**
 * Récupère toutes les listes d'un utilisateur avec leurs produits
 * 
 * PARAMÈTRES URL :
 * - :token → Token d'authentification de l'utilisateur
 * 
 * LOGIQUE :
 * 1. Trouver l'utilisateur via son token
 * 2. Récupérer toutes ses listes avec populate() sur les produits
 * 3. Calculer prix moyen et note moyenne pour chaque produit
 * 4. Retourner les listes formatées
 * 
 * RÉPONSE :
 * {
 *   result: true,
 *   listsUser: [{ _id, name, idUser, products: [{id, name, priceMoy, noteMoy, ...}] }]
 * }
 */
router.get('/:token', function (req, res) {

	// Récupération du token depuis l'URL
	const token = req.params.token;

	// ─────────────────────────────────────────────────────────────────────────
	// ÉTAPE 1 : Trouver l'utilisateur via son token
	// ─────────────────────────────────────────────────────────────────────────
	/**
	 * $in : Opérateur MongoDB qui vérifie si une valeur est dans un tableau
	 * Utile car le token est stocké comme tableau dans le schéma User
	 */
	User.findOne({token: {$in: [token]}}).then((user) => {

		const idUser = user._id;

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 2 : Récupérer les listes avec populate()
		// ─────────────────────────────────────────────────────────────────────
		/**
		 * populate('idProduct') :
		 * - Remplace les ObjectId par les documents complets
		 * - Permet d'avoir directement les infos des produits
		 * - Équivalent d'un JOIN en SQL
		 */
		List.find({idUser})
			.populate('idProduct')
			.then((lists) => {

				// ─────────────────────────────────────────────────────────
				// ÉTAPE 3 : Formatage des données pour le frontend
				// ─────────────────────────────────────────────────────────
				const formattedLists = lists.map((list) => {
					return {
						_id: list._id,
						name: list.name,
						idUser: list.idUser,

						// Transformation des produits avec calcul des moyennes
						products: list.idProduct.map((product) => {

							// ─────────────────────────────────────────────
							// Calcul du prix moyen
							// ─────────────────────────────────────────────
							/**
							 * reduce() : Parcourt le tableau et accumule les prix
							 * On divise par le nombre de vendeurs pour la moyenne
							 */
							const priceMoy =
								product.sellers && product.sellers.length
									? product.sellers.reduce((sum, s) => sum + s.price, 0) / product.sellers.length
									: 0;

							// ─────────────────────────────────────────────
							// Calcul de la note moyenne
							// ─────────────────────────────────────────────
							/**
							 * flatMap() : Aplatit les tableaux imbriqués
							 * Chaque vendeur a plusieurs avis → on récupère toutes les notes
							 */
							const allNotes = product.sellers 
								? product.sellers.flatMap((s) => s.avis.map((a) => a.note)) 
								: [];

							const noteMoy = allNotes.length 
								? allNotes.reduce((sum, n) => sum + n, 0) / allNotes.length 
								: 0;

							// ─────────────────────────────────────────────
							// Objet produit formaté
							// ─────────────────────────────────────────────
							return {
								id: product._id,
								name: product.name,
								desc: product.desc,
								picture: product.picture,
								priceMoy: priceMoy.toFixed(2),   // 2 décimales
								noteMoy: noteMoy.toFixed(2),     // 2 décimales
							};
						}),
					};
				});

				// ─────────────────────────────────────────────────────────
				// ÉTAPE 4 : Envoi de la réponse
				// ─────────────────────────────────────────────────────────
				res.json({result: true, listsUser: formattedLists});
			})
			.catch((error) => {
				console.error(error);
				res.status(500).json({result: false, error});
			});
	});
});


// ============================================================================
// 3. ROUTE POST /lists/newLists/:token (CRÉER UNE LISTE)
// ============================================================================

/**
 * Crée une nouvelle liste pour un utilisateur
 * 
 * PARAMÈTRES URL :
 * - :token → Token d'authentification
 * 
 * BODY REQUIS :
 * {
 *   name: "Ma nouvelle liste"
 * }
 * 
 * LOGIQUE :
 * 1. Vérifier que l'utilisateur est connecté
 * 2. Vérifier que le nom de liste n'existe pas déjà
 * 3. Créer la liste en BDD
 * 4. Associer la liste à l'utilisateur
 */
router.post('/newLists/:token/', function (req, res) {

	const token = req.params.token;
	const name = req.body.name;

	// ─────────────────────────────────────────────────────────────────────────
	// ÉTAPE 1 : Vérifier que l'utilisateur existe
	// ─────────────────────────────────────────────────────────────────────────
	User.findOne({token: {$in: [token]}}).then((user) => {

		if (!user) {
			return res.json({result: false, response: 'User not connected !'});
		}

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 2 : Vérifier l'unicité du nom de liste
		// ─────────────────────────────────────────────────────────────────────
		List.find({idUser: user._id, name: name}).then((found) => {

			console.log('user', found);

			// Si aucune liste avec ce nom n'existe → on crée
			if (found.length < 1) {

				// ─────────────────────────────────────────────────────────────
				// ÉTAPE 3 : Création de la nouvelle liste
				// ─────────────────────────────────────────────────────────────
				const newList = new List({
					name: name,
					idUser: user._id,
					idProduct: [],      // Liste vide au départ
					done: false,        // Non archivée
				});

				newList.save().then((list) => {

					// ─────────────────────────────────────────────────────────
					// ÉTAPE 4 : Ajout de la liste dans le tableau de l'user
					// ─────────────────────────────────────────────────────────
					/**
					 * findByIdAndUpdate avec $push :
					 * Ajoute l'ID de la liste au tableau 'lists' de l'utilisateur
					 */
					User.findByIdAndUpdate(user._id, {$push: {lists: list._id}}).then(() => {
						return res.json({result: true, newList: list});
					});
				});

			} else {
				// Le nom de liste existe déjà pour cet utilisateur
				return res.json({result: false, response: 'Name already used !'});
			}
		});
	});
});


// ============================================================================
// 4. ROUTE POST /lists/listDone/:idList (TOGGLE ARCHIVAGE)
// ============================================================================

/**
 * Bascule le statut "done" d'une liste (archivée ou non)
 * 
 * PARAMÈTRES URL :
 * - :idList → ID de la liste à modifier
 * 
 * LOGIQUE :
 * - Si done = false → devient true
 * - Si done = true → devient false
 * 
 * UTILISATION :
 * Permet à l'utilisateur d'archiver ses listes terminées
 */
router.post('/listDone/:idList', async (req, res) => {

	try {
		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 1 : Récupérer la liste actuelle
		// ─────────────────────────────────────────────────────────────────────
		const list = await List.findOne({_id: req.params.idList});

		console.log(list);

		if (!list) {
			return res.json({result: false, response: 'List not found !'});
		}

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 2 : Inverser le statut done
		// ─────────────────────────────────────────────────────────────────────
		const nouveauStatut = !list.done;

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 3 : Mettre à jour en BDD
		// ─────────────────────────────────────────────────────────────────────
		const updateResult = await List.updateOne({_id: list._id}, {done: nouveauStatut});

		return res.json({
			result: true,
			done: nouveauStatut,
			updateDB: updateResult,
		});

	} catch (err) {
		console.error(err);
		return res.status(500).json({result: false, response: 'Server error'});
	}
});


// ============================================================================
// 5. ROUTE POST /lists/addToLists/:token/:idProduct/:idList (TOGGLE PRODUIT)
// ============================================================================

/**
 * Ajoute ou retire un produit d'une liste (fonctionnement toggle)
 * 
 * PARAMÈTRES URL :
 * - :token → Token d'authentification
 * - :idProduct → ID du produit à ajouter/retirer
 * - :idList → ID de la liste cible
 * 
 * LOGIQUE :
 * - Si le produit N'EST PAS dans la liste → on l'ajoute ($push)
 * - Si le produit EST dans la liste → on le retire ($pull)
 * 
 * Ce comportement "toggle" permet d'utiliser le même bouton pour ajouter/retirer
 */
router.post('/addToLists/:token/:idProduct/:idList', async (req, res) => {

	const {token, idProduct, idList} = req.params;

	try {
		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 1 : Vérifier que l'utilisateur est connecté
		// ─────────────────────────────────────────────────────────────────────
		const user = await User.findOne({token});

		if (!user) {
			return res.json({result: false, response: 'User not connected !'});
		}

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 2 : Vérifier que le produit existe
		// ─────────────────────────────────────────────────────────────────────
		const product = await Product.findById(idProduct);

		if (!product) {
			return res.json({result: false, response: 'Product not found !'});
		}

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 3 : Vérifier que la liste appartient à l'utilisateur
		// ─────────────────────────────────────────────────────────────────────
		/**
		 * includes() vérifie si idList est dans le tableau lists de l'user
		 * Sécurité : empêche de modifier les listes d'autres utilisateurs
		 */
		if (!user.lists.includes(idList)) {
			return res.json({result: false, response: 'List not found or not belonging to user!'});
		}

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 4 : Récupérer la liste
		// ─────────────────────────────────────────────────────────────────────
		const list = await List.findById(idList);

		if (!list) {
			return res.json({result: false, response: 'List not found !'});
		}

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 5 : Toggle - Ajouter ou Retirer le produit
		// ─────────────────────────────────────────────────────────────────────
		const productInList = list.idProduct.includes(product._id);

		let update;
		if (!productInList) {
			// Produit pas dans la liste → on l'ajoute avec $push
			update = await List.findByIdAndUpdate(idList, {$push: {idProduct: product._id}});
		} else {
			// Produit déjà dans la liste → on le retire avec $pull
			update = await List.findByIdAndUpdate(idList, {$pull: {idProduct: product._id}});
		}

		return res.json({result: true, updated: update});

	} catch (error) {
		console.error(error);
		res.json({result: false, error: 'Internal server error'});
	}
});


// ============================================================================
// 6. ROUTE DELETE /lists/removeList/:idList (SUPPRIMER UNE LISTE)
// ============================================================================

/**
 * Supprime définitivement une liste
 * 
 * PARAMÈTRES URL :
 * - :idList → ID de la liste à supprimer
 * 
 * LOGIQUE :
 * 1. Supprimer la liste de la collection 'lists'
 * 2. Retirer l'ID de la liste du tableau 'lists' de l'utilisateur
 */
router.delete('/removeList/:idList', (req, res) => {

	const {idList, idUser} = req.params;

	// ─────────────────────────────────────────────────────────────────────────
	// ÉTAPE 1 : Supprimer la liste de la collection
	// ─────────────────────────────────────────────────────────────────────────
	List.deleteOne({_id: idList}).then(() => {

		// ─────────────────────────────────────────────────────────────────────
		// ÉTAPE 2 : Nettoyer la référence dans l'utilisateur
		// ─────────────────────────────────────────────────────────────────────
		/**
		 * findOneAndUpdate avec $pull :
		 * - Trouve l'utilisateur qui a cette liste
		 * - Retire l'ID de son tableau 'lists'
		 */
		User.findOneAndUpdate(
			{lists: {$in: [idList]}},      // Trouve l'user qui a cette liste
			{$pull: {lists: idList}}        // Retire l'ID du tableau
		).then(() => {
			res.json({result: true, list: 'Supprimé !'});
		});

		// NOTE : Alternative avec idUser pour plus de sécurité :
		// User.findByIdAndUpdate(idUser, { $pull: { lists: idList } })
	});
});


// ============================================================================
// 7. EXPORT DU ROUTER
// ============================================================================

/**
 * On exporte le routeur pour qu'il soit monté dans app.js
 * via : app.use('/lists', listsRouter)
 */
module.exports = router;
