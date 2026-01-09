/**
 * ============================================================================
 * FICHIER : models/connection.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier établit la connexion entre l'application et la base de données
 * MongoDB. Il est importé une seule fois et la connexion reste ouverte.
 * 
 * RÔLE :
 * - Charger la chaîne de connexion depuis les variables d'environnement
 * - Établir la connexion à MongoDB via Mongoose
 * - Afficher le statut de connexion dans la console
 * 
 * LOGIQUE :
 * La connexion est établie au démarrage de l'application.
 * Mongoose gère automatiquement la reconnexion si nécessaire.
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Mongoose : ODM (Object Document Mapper) pour MongoDB
 * - Variables d'environnement (.env) : Sécurisation des credentials
 * 
 * PRÉREQUIS :
 * - Un fichier .env avec la variable CONNEXION_STRING
 * - MongoDB Atlas ou une instance locale MongoDB
 * 
 * ============================================================================
 */


// ============================================================================
// 1. IMPORT DE MONGOOSE
// ============================================================================

/**
 * Mongoose est un ODM (Object Document Mapper) pour MongoDB.
 * 
 * Il permet de :
 * - Définir des schémas de données (models/)
 * - Faire des requêtes avec une syntaxe JavaScript propre
 * - Gérer les relations entre documents
 * - Valider les données avant insertion
 */
const mongoose = require('mongoose');


// ============================================================================
// 2. RÉCUPÉRATION DE LA CHAÎNE DE CONNEXION
// ============================================================================

/**
 * La chaîne de connexion est stockée dans le fichier .env
 * Format typique MongoDB Atlas :
 * mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
 * 
 * SÉCURITÉ :
 * - Ne jamais commiter le fichier .env (ajouté dans .gitignore)
 * - Utiliser des variables d'environnement en production
 */
const connectionString = process.env.CONNEXION_STRING;


// ============================================================================
// 3. CONNEXION À MONGODB
// ============================================================================

/**
 * mongoose.connect() établit la connexion à la base de données
 * 
 * PARAMÈTRES :
 * - connectionString : URL de connexion MongoDB
 * - Options de configuration :
 *   - connectTimeoutMS: 2000 → Timeout de 2 secondes si pas de réponse
 * 
 * COMPORTEMENT :
 * - Retourne une Promise
 * - .then() → Connexion réussie
 * - .catch() → Erreur de connexion (credentials, réseau, etc.)
 * 
 * NOTE :
 * Cette connexion reste ouverte pendant toute la durée de vie de l'application.
 * Mongoose gère automatiquement le pool de connexions.
 */
mongoose
	.connect(connectionString, {connectTimeoutMS: 2000})
	.then(() => console.log('Connected'))         // Message de succès
	.catch((error) => console.error(error));      // Affiche l'erreur si échec
