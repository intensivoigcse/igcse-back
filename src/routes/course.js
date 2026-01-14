const Router = require('koa-router');
const courseController = require('../controllers/courseController');
const auth = require('../auth/auth');
const ownershipGuard = require('../auth/guards/ownershipGuard');
const userRoles = require('../enums/userRoles');

const router = new Router({ prefix: '/course' });




router.get('/professor', auth.jwtAuth(), courseController.getSessionProfessorCourses);


router.get('/professor/:id', courseController.getByProfessorId);



/**
 * @swagger
 * /course:
 *   get:
 *     summary: Obtener todos los cursos
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cursos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       500:
 *         description: Error al obtener cursos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', courseController.getAll);

/**
 * @swagger
 * /course/{id}:
 *   get:
 *     summary: Obtener un curso por ID
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Curso encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al obtener curso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', courseController.getById);

/**
 * @swagger
 * /course:
 *   post:
 *     summary: Crear un nuevo curso
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Introducción a Node.js
 *               description:
 *                 type: string
 *                 example: Curso completo sobre Node.js y Express
 *     responses:
 *       201:
 *         description: Curso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado - Se requiere rol de profesor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Admin o profesor pueden crear cursos
router.post('/', auth.jwtAuth(), (ctx, next) => {
    const userRole = ctx.state.user.role;
    if (userRole === 'admin' || userRole === userRoles.professor) {
        return next();
    }
    ctx.status = 403;
    ctx.body = { error: 'Unauthorized - Admin or Professor role required' };
}, courseController.create);

/**
 * @swagger
 * /course/{id}:
 *   patch:
 *     summary: Actualizar un curso
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Introducción a Node.js Avanzado
 *               description:
 *                 type: string
 *                 example: Curso completo sobre Node.js y Express con conceptos avanzados
 *     responses:
 *       200:
 *         description: Curso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
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
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', auth.jwtAuth(), ownershipGuard.checkCourseOwnership(), courseController.update);

/**
 * @swagger
 * /course/{id}:
 *   delete:
 *     summary: Eliminar un curso
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *     responses:
 *       204:
 *         description: Curso eliminado exitosamente
 *       401:
 *         description: No autorizado - Solo el propietario puede eliminar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error al eliminar curso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', auth.jwtAuth(), ownershipGuard.checkCourseOwnership(), courseController.remove);

module.exports = router;