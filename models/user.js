/**
 * ============================================================================
 * FICHIER : models/user.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier définit le schéma et le modèle Mongoose pour les utilisateurs.
 * Il représente la structure des documents dans la collection 'users' de MongoDB.
 * 
 * RÔLE :
 * - Définir la structure des données utilisateur
 * - Créer une référence vers les listes de l'utilisateur
 * - Permettre les opérations CRUD sur les utilisateurs
 * 
 * STRUCTURE DE L'UTILISATEUR :
 * {
 *   mail: "user@email.com",
 *   firstname: "Jean",
 *   lastname: "Dupont",
 *   password: "hash_bcrypt",
 *   token: ["abc123..."],
 *   lists: [ObjectId("liste1"), ObjectId("liste2")]
 * }
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Mongoose Schema : Définition de la structure
 * - ObjectId : Références vers d'autres collections (relations)
 * 
 * ============================================================================
 */


// ============================================================================
// 1. IMPORT DE MONGOOSE
// ============================================================================

/**
 * Mongoose est l'ODM qui fait le lien entre Node.js et MongoDB.
 * Il permet de définir des schémas stricts pour nos données.
 */
const mongoose = require('mongoose');


// ============================================================================
// 2. DÉFINITION DU SCHÉMA UTILISATEUR
// ============================================================================

/**
 * mongoose.Schema() définit la structure d'un document MongoDB.
 * 
 * Chaque champ a un type et peut avoir des options :
 * - String : Chaîne de caractères
 * - [String] : Tableau de chaînes
 * - [{type: ObjectId, ref: 'collection'}] : Relation vers une autre collection
 * 
 * CHAMPS :
 * - mail : Email de l'utilisateur (unique, utilisé pour login)
 * - firstname : Prénom
 * - lastname : Nom de famille
 * - password : Mot de passe HASHÉ (jamais en clair !)
 * - token : Tableau de tokens d'authentification
 * - lists : Tableau de références vers les listes de l'utilisateur
 */
const userSchema = mongoose.Schema({

	// Email de l'utilisateur (identifiant principal)
	mail: String,

	// Prénom
	firstname: String,

	// Nom de famille
	lastname: String,

	// Mot de passe hashé avec bcrypt
	// ATTENTION : Ne JAMAIS stocker en clair !
	password: String,

	// Token(s) d'authentification
	// Tableau pour permettre plusieurs sessions simultanées
	token: [String],

	// Références vers les listes (favoris, wishlist, etc.)
	// C'est une RELATION : on stocke les IDs des listes, pas les listes elles-mêmes
	// Le 'ref' permet d'utiliser populate() pour récupérer les données complètes
	lists: [{type: mongoose.Schema.Types.ObjectId, ref: 'lists'}],

});


// ============================================================================
// 3. CRÉATION ET EXPORT DU MODÈLE
// ============================================================================

/**
 * mongoose.model() crée un modèle à partir du schéma.
 * 
 * PARAMÈTRES :
 * - 'users' : Nom de la collection MongoDB (au pluriel par convention)
 * - userSchema : Le schéma défini ci-dessus
 * 
 * Le modèle permet d'effectuer des opérations CRUD :
 * - User.find() → Lire des utilisateurs
 * - User.findOne() → Trouver un utilisateur
 * - new User().save() → Créer un utilisateur
 * - User.updateOne() → Modifier un utilisateur
 * - User.deleteOne() → Supprimer un utilisateur
 */
const User = mongoose.model('users', userSchema);


/**
 * Export du modèle pour utilisation dans les routes
 * Utilisation : const User = require('./models/user');
 */
module.exports = User;
