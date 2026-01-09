/**
 * ============================================================================
 * FICHIER : modules/checkBody.js
 * ============================================================================
 * 
 * CONTEXTE :
 * Ce fichier contient une fonction utilitaire de validation des données.
 * Elle est utilisée dans les routes pour vérifier les champs requis.
 * 
 * RÔLE :
 * - Valider que tous les champs obligatoires sont présents
 * - Vérifier que les champs ne sont pas vides
 * - Simplifier la validation dans les routes
 * 
 * UTILISATION :
 * const { checkBody } = require('./modules/checkBody');
 * 
 * if (!checkBody(req.body, ['email', 'password'])) {
 *   return res.json({ result: false, error: 'Missing fields' });
 * }
 * 
 * TECHNOLOGIES UTILISÉES :
 * - JavaScript natif (pas de dépendance)
 * 
 * ============================================================================
 */


// ============================================================================
// FONCTION checkBody
// ============================================================================

/**
 * Vérifie que tous les champs requis sont présents et non vides.
 * 
 * PARAMÈTRES :
 * - body : L'objet req.body contenant les données envoyées (objet)
 * - keys : Tableau des noms de champs obligatoires (array de strings)
 * 
 * RETOUR :
 * - true : Tous les champs sont présents et non vides
 * - false : Au moins un champ manque ou est vide
 * 
 * EXEMPLE :
 * checkBody({ email: "test@test.com", password: "" }, ['email', 'password'])
 * → Retourne false (password est vide)
 * 
 * checkBody({ email: "test@test.com", password: "123" }, ['email', 'password'])
 * → Retourne true
 */
function checkBody(body, keys) {

  // Variable qui track la validité (true par défaut)
  let isValid = true;

  // ─────────────────────────────────────────────────────────────────────────
  // Parcours de chaque champ requis
  // ─────────────────────────────────────────────────────────────────────────
  for (const field of keys) {

    /**
     * Vérification en deux temps :
     * 1. !body[field] → Le champ n'existe pas ou est falsy (null, undefined, false, 0)
     * 2. body[field] === '' → Le champ existe mais est une chaîne vide
     * 
     * Si l'une de ces conditions est vraie → champ invalide
     */
    if (!body[field] || body[field] === '') {
      isValid = false;
    }

  }

  // ─────────────────────────────────────────────────────────────────────────
  // Retour du résultat
  // ─────────────────────────────────────────────────────────────────────────
  return isValid;

}


// ============================================================================
// EXPORT DE LA FONCTION
// ============================================================================

/**
 * Export avec destructuring pour permettre :
 * const { checkBody } = require('./modules/checkBody');
 * 
 * Plutôt que :
 * const checkBody = require('./modules/checkBody').checkBody;
 */
module.exports = { checkBody };
