/**
 * ============================================================================
 * FICHIER : models/list.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier définit le schéma et le modèle Mongoose pour les listes de favoris.
 * Chaque utilisateur peut avoir plusieurs listes contenant des produits.
 * 
 * RÔLE :
 * - Définir la structure d'une liste de favoris
 * - Gérer les relations avec les utilisateurs et les produits
 * - Permettre l'archivage des listes (done)
 * 
 * STRUCTURE D'UNE LISTE :
 * {
 *   name: "Ma Wishlist",
 *   idUser: ObjectId("user123"),
 *   idProduct: [ObjectId("prod1"), ObjectId("prod2")],
 *   done: false
 * }
 * 
 * RELATIONS :
 * - Une liste appartient à UN utilisateur (idUser)
 * - Une liste contient PLUSIEURS produits (idProduct)
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Mongoose Schema : Définition de la structure
 * - ObjectId avec ref : Relations entre collections
 * 
 * ============================================================================
 */


// ============================================================================
// 1. IMPORT DE MONGOOSE
// ============================================================================

/**
 * Mongoose est l'ODM qui fait le lien entre Node.js et MongoDB.
 */
const mongoose = require('mongoose');


// ============================================================================
// 2. DÉFINITION DU SCHÉMA LISTE
// ============================================================================

/**
 * mongoose.Schema() définit la structure d'une liste de favoris.
 * 
 * CHAMPS :
 * - name : Nom de la liste (ex: "Wishlist", "À acheter", "Idées cadeaux")
 * - idUser : Référence vers l'utilisateur propriétaire
 * - idProduct : Tableau de références vers les produits
 * - done : Booléen pour archiver une liste terminée
 */
const listsSchema = mongoose.Schema({

    // Nom de la liste (affiché dans l'interface)
    name: String,

    // Référence vers l'utilisateur propriétaire
    // Permet de filtrer les listes par utilisateur : List.find({idUser: userId})
    idUser: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},

    // Tableau de références vers les produits de la liste
    // Le 'ref' permet d'utiliser populate() pour récupérer les détails des produits
    // Exemple : List.find().populate('idProduct') → récupère les produits complets
    idProduct: [{type: mongoose.Schema.Types.ObjectId, ref: 'products'}],

    // Statut d'archivage de la liste
    // true = liste terminée/archivée
    // false = liste active (par défaut)
    done: Boolean,

});


// ============================================================================
// 3. CRÉATION ET EXPORT DU MODÈLE
// ============================================================================

/**
 * mongoose.model() crée un modèle à partir du schéma.
 * 
 * PARAMÈTRES :
 * - 'lists' : Nom de la collection MongoDB
 * - listsSchema : Le schéma défini ci-dessus
 * 
 * OPÉRATIONS COURANTES :
 * - List.find({idUser}) → Toutes les listes d'un utilisateur
 * - List.findById(id).populate('idProduct') → Une liste avec ses produits
 * - new List().save() → Créer une nouvelle liste
 * - List.updateOne() → Modifier (ajouter/retirer produit, archiver)
 * - List.deleteOne() → Supprimer une liste
 */
const List = mongoose.model('lists', listsSchema);


/**
 * Export du modèle pour utilisation dans les routes
 * Utilisation : const List = require('./models/list');
 */
module.exports = List;
