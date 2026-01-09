/**
 * ============================================================================
 * FICHIER : app.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier est le point d'entrée principal du backend Express.js.
 * Il configure et initialise l'application serveur qui gère l'API REST
 * pour le comparateur de prix "AtlasLoot".
 * 
 * RÔLE :
 * - Charger les variables d'environnement (connexion BDD, etc.)
 * - Configurer les middlewares (CORS, JSON, logs, etc.)
 * - Connecter les différentes routes de l'API
 * - Exporter l'application pour être lancée par le serveur (bin/www)
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Express.js : Framework Node.js pour créer des API REST
 * - dotenv : Gestion des variables d'environnement (.env)
 * - cors : Autoriser les requêtes cross-origin (frontend <-> backend)
 * - morgan : Logger des requêtes HTTP dans la console
 * - cookie-parser : Parser les cookies des requêtes
 * 
 * ============================================================================
 */


// ============================================================================
// 1. CHARGEMENT DES VARIABLES D'ENVIRONNEMENT
// ============================================================================

/**
 * dotenv charge les variables définies dans le fichier .env
 * Exemple : CONNEXION_STRING pour la connexion MongoDB
 * Ces variables sont accessibles via process.env.NOM_VARIABLE
 */
require('dotenv').config();


// ============================================================================
// 2. IMPORTS DES MODULES NODE.JS
// ============================================================================

/**
 * express : Framework principal pour créer le serveur et les routes
 */
var express = require('express');

/**
 * path : Module natif Node.js pour manipuler les chemins de fichiers
 * Utilisé ici pour servir les fichiers statiques (public/)
 */
var path = require('path');

/**
 * cookie-parser : Middleware pour lire les cookies envoyés par le client
 */
var cookieParser = require('cookie-parser');

/**
 * morgan : Middleware de logging qui affiche les requêtes HTTP dans la console
 * Exemple : GET /products 200 15ms
 */
var logger = require('morgan');


// ============================================================================
// 3. IMPORTS DES ROUTES (ENDPOINTS DE L'API)
// ============================================================================

/**
 * Chaque fichier de route gère un groupe d'endpoints spécifique :
 * 
 * - indexRouter   → Route racine "/"
 * - usersRouter   → Authentification (signup, signin)
 * - productsRouter → Gestion des produits (liste, recherche, détail)
 * - listsRouter   → Gestion des listes/favoris utilisateur
 * - addSkuRouter  → Génération de SKU pour les produits
 */
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');
var listsRouter = require('./routes/lists');
var addSkuRouter = require('./routes/addSku');


// ============================================================================
// 4. CRÉATION DE L'APPLICATION EXPRESS
// ============================================================================

/**
 * express() crée une instance de l'application Express
 * Cette instance est configurée avec des middlewares puis exportée
 */
var app = express();


// ============================================================================
// 5. CONFIGURATION DES MIDDLEWARES
// ============================================================================

/**
 * CORS (Cross-Origin Resource Sharing)
 * ─────────────────────────────────────
 * Permet au frontend (ex: localhost:3001) de communiquer avec le backend
 * (ex: localhost:3000) même s'ils sont sur des ports différents.
 * Sans CORS, le navigateur bloquerait les requêtes cross-origin.
 */
const cors = require('cors');
app.use(cors());

/**
 * Morgan Logger
 * ─────────────
 * Mode 'dev' : affiche les logs colorés et concis dans la console
 * Utile pour débugger les requêtes entrantes
 */
app.use(logger('dev'));

/**
 * Body Parsers
 * ────────────
 * express.json() : Parse les corps de requête JSON (Content-Type: application/json)
 * express.urlencoded() : Parse les données de formulaires (Content-Type: application/x-www-form-urlencoded)
 */
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/**
 * Cookie Parser
 * ─────────────
 * Permet de lire les cookies envoyés dans les headers des requêtes
 */
app.use(cookieParser());

/**
 * Fichiers Statiques
 * ──────────────────
 * Sert les fichiers du dossier 'public/' directement
 * Exemple : localhost:3000/index.html servira public/index.html
 */
app.use(express.static(path.join(__dirname, 'public')));


// ============================================================================
// 6. MONTAGE DES ROUTES SUR L'APPLICATION
// ============================================================================

/**
 * Chaque app.use() monte un routeur sur un préfixe d'URL :
 * 
 * app.use('/users', usersRouter) signifie que :
 * - POST /users/signup → Gérée par usersRouter
 * - POST /users/signin → Gérée par usersRouter
 * 
 * Structure des endpoints :
 * ─────────────────────────
 * /              → Page d'accueil (index)
 * /users/*       → Authentification (signup, signin, allUsers)
 * /products/*    → Produits (liste, catégories, recherche, détail)
 * /lists/*       → Listes utilisateur (favoris, wishlist)
 * /addSku        → Utilitaire pour générer des SKU
 */
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/lists', listsRouter);
app.use('/addSku', addSkuRouter);


// ============================================================================
// 7. EXPORT DE L'APPLICATION
// ============================================================================

/**
 * L'application configurée est exportée pour être utilisée par bin/www
 * Le fichier www démarre le serveur HTTP sur le port configuré (3000)
 */
module.exports = app;
