const Router = require('koa-router');
const profileController = require('../controllers/profileController');
const auth = require('../auth/auth')
const router = new Router({ prefix: '/profile' });

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         description: No autorizado - Token inválido o ausente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al obtener perfil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/',auth.jwtAuth(), auth.checkRole(), profileController.getProfile);

module.exports = router;