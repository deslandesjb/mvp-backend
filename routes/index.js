/**
 * ============================================================================
 * FICHIER : routes/index.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier gère la route racine "/" de l'API.
 * Dans ce projet, la route racine n'est pas utilisée car le frontend
 * est servi séparément (Next.js sur un autre port).
 * 
 * RÔLE :
 * - Servir de point d'entrée par défaut pour l'API
 * - Peut être utilisé pour une page de documentation ou un healthcheck
 * 
 * TECHNOLOGIES UTILISÉES :
 * - Express Router : Module Express pour organiser les routes en fichiers séparés
 * 
 * ============================================================================
 */


// ============================================================================
// 1. IMPORTS
// ============================================================================

/**
 * express : Framework Node.js
 * Router : Permet de créer un routeur modulaire et montable
 */
var express = require('express');
var router = express.Router();


// ============================================================================
// 2. ROUTES
// ============================================================================

/**
 * Aucune route définie ici pour l'instant.
 * 
 * Exemples d'utilisation possibles :
 * 
 * router.get('/', (req, res) => {
 *   res.json({ message: 'Bienvenue sur l\'API AtlasLoot' });
 * });
 * 
 * // Healthcheck pour vérifier que l'API fonctionne
 * router.get('/health', (req, res) => {
 *   res.json({ status: 'OK', timestamp: new Date() });
 * });
 */


// ============================================================================
// 3. EXPORT DU ROUTER
// ============================================================================

/**
 * On exporte le routeur pour qu'il soit monté dans app.js
 * via : app.use('/', indexRouter)
 */
module.exports = router;
