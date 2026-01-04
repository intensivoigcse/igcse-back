const Router = require('koa-router');
const paymentController = require('../controllers/paymentController');
const auth = require('../auth/auth');

const router = new Router({ prefix: '/donations' });

/**
 * @swagger
 * /donations:
 *   post:
 *     summary: Crear una nueva donación
 *     description: Crea una donación y genera un link de pago de Mercado Pago para Chile (CLP)
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Monto en CLP (pesos chilenos)
 *                 example: 10000
 *               description:
 *                 type: string
 *                 description: Descripción de la donación
 *                 example: Donación para el proyecto
 *     responses:
 *       201:
 *         description: Donación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 amount:
 *                   type: integer
 *                   example: 10000
 *                 description:
 *                   type: string
 *                   example: Donación para el proyecto
 *                 status:
 *                   type: string
 *                   example: pending
 *                 init_point:
 *                   type: string
 *                   description: URL de pago para producción
 *                 sandbox_init_point:
 *                   type: string
 *                   description: URL de pago para pruebas
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', auth.jwtAuth(), paymentController.create);

/**
 * @swagger
 * /donations:
 *   get:
 *     summary: Obtener todas las donaciones del usuario autenticado
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de donaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', auth.jwtAuth(), paymentController.getAll);

/**
 * @swagger
 * /donations/{id}:
 *   get:
 *     summary: Obtener una donación por ID
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la donación
 *     responses:
 *       200:
 *         description: Donación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Donación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', auth.jwtAuth(), paymentController.getById);

/**
 * @swagger
 * /donations/{id}/verify:
 *   get:
 *     summary: Verificar el estado de una donación
 *     description: Verifica el estado actual del pago con Mercado Pago
 *     tags: [Donaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la donación
 *     responses:
 *       200:
 *         description: Estado de la donación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Donación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/verify', auth.jwtAuth(), paymentController.verify);

/**
 * @swagger
 * /donations/webhook:
 *   post:
 *     summary: Webhook de Mercado Pago
 *     description: Endpoint para recibir notificaciones de Mercado Pago sobre cambios en el estado de los pagos
 *     tags: [Donaciones]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: payment
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "123456789"
 *     responses:
 *       200:
 *         description: Webhook procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 */
router.post('/webhook', paymentController.webhook);

module.exports = router;

