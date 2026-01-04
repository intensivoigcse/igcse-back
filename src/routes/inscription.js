const Router = require('koa-router');
const inscriptionController = require('../controllers/inscriptionController');
const auth = require('../auth/auth');
const ownershipGuard = require('../auth/guards/ownershipGuard');
const userRoles = require('../enums/userRoles');

const router = new Router({ prefix: '/inscriptions' });

router.get('/courses', auth.jwtAuth(), inscriptionController.getSessionUserInscriptions);

/**
 * @swagger
 * /inscriptions/course/{courseId}/students:
 *   get:
 *     summary: Obtener estudiantes inscritos en un curso específico
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Lista de estudiantes inscritos activamente en el curso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courseId:
 *                   type: string
 *                 totalStudents:
 *                   type: integer
 *                 inscriptions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inscription'
 *       404:
 *         description: Curso no encontrado
 *       500:
 *         description: Error al obtener estudiantes
 */
router.get('/course/:courseId/students', auth.jwtAuth(), inscriptionController.getCourseStudents);
/**
 * @swagger
 * /inscriptions:
 *   get:
 *     summary: Obtener todas las inscripciones
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de inscripciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inscription'
 *       500:
 *         description: Error al obtener inscripciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', inscriptionController.getAll);

/**
 * @swagger
 * /inscriptions/{id}:
 *   get:
 *     summary: Obtener una inscripción por ID
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la inscripción
 *     responses:
 *       200:
 *         description: Inscripción encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inscription'
 *       404:
 *         description: Inscripción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al obtener inscripción
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', inscriptionController.getById);

/**
 * @swagger
 * /inscriptions:
 *   post:
 *     summary: Crear una nueva inscripción
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - courseId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               courseId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Inscripción creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inscription'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado - Se requiere rol de estudiante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', auth.jwtAuth(), auth.checkRole(userRoles.student), inscriptionController.create);

/**
 * @swagger
 * /inscriptions/{id}:
 *   patch:
 *     summary: Actualizar una inscripción
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la inscripción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enrollment_status:
 *                 type: string
 *                 enum: [pending, active, dropped, expired]
 *                 example: active
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-01-01T00:00:00Z'
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-12-31T23:59:59Z'
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed]
 *                 example: paid
 *               paymentAmount:
 *                 type: integer
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Inscripción actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inscription'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado - Solo el propietario puede actualizar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Inscripción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', auth.jwtAuth(), ownershipGuard.checkInscriptionOwnership(), inscriptionController.update);

/**
 * @swagger
 * /inscriptions/{id}:
 *   delete:
 *     summary: Eliminar una inscripción
 *     tags: [Inscripciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la inscripción
 *     responses:
 *       204:
 *         description: Inscripción eliminada exitosamente
 *       401:
 *         description: No autorizado - Solo el propietario puede eliminar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Inscripción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al eliminar inscripción
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', auth.jwtAuth(), ownershipGuard.checkInscriptionOwnership(), inscriptionController.remove);



module.exports = router;