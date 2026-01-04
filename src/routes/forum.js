const Router = require('koa-router');
const forumController = require('../controllers/forumController');
const auth = require('../auth/auth');
const forumGuard = require('../auth/guards/forumGuard');

const router = new Router({ prefix: '/forums' });

/**
 * @swagger
 * components:
 *   schemas:
 *     ForumThread:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         category:
 *           type: string
 *           enum: [Dudas, Recursos, Estudio, Proyectos, General]
 *         isPinned:
 *           type: boolean
 *         isLocked:
 *           type: boolean
 *         views:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *     ForumReply:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 */

/**
 * @swagger
 * /forums/course/{courseId}:
 *   get:
 *     summary: Obtener todos los hilos de un curso
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del curso
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Dudas, Recursos, Estudio, Proyectos, General]
 *         description: Filtrar por categoria
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar en titulo y contenido
 *     responses:
 *       200:
 *         description: Lista de hilos del curso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/ForumThread'
 *                   - type: object
 *                     properties:
 *                       _count:
 *                         type: object
 *                         properties:
 *                           replies:
 *                             type: integer
 *       403:
 *         description: No autorizado - Requiere inscripcion activa o ser profesor
 *       404:
 *         description: Curso no encontrado
 */
router.get('/course/:courseId', 
    auth.jwtAuth(), 
    forumGuard.checkForumAccess('params', 'courseId'),
    forumController.getThreadsByCourse
);

/**
 * @swagger
 * /forums/thread/{id}:
 *   get:
 *     summary: Obtener un hilo con todas sus respuestas
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hilo
 *     responses:
 *       200:
 *         description: Hilo con sus respuestas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ForumThread'
 *                 - type: object
 *                   properties:
 *                     replies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ForumReply'
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Hilo no encontrado
 */
router.get('/thread/:id', 
    auth.jwtAuth(), 
    forumGuard.checkForumAccessByThread(),
    forumController.getThreadById
);

/**
 * @swagger
 * /forums/thread:
 *   post:
 *     summary: Crear nuevo hilo
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - title
 *               - content
 *             properties:
 *               courseId:
 *                 type: integer
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Dudas, Recursos, Estudio, Proyectos, General]
 *     responses:
 *       201:
 *         description: Hilo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForumThread'
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: No autorizado
 */
router.post('/thread', 
    auth.jwtAuth(), 
    forumGuard.checkForumAccess('body', 'courseId'),
    forumController.createThread
);

/**
 * @swagger
 * /forums/thread/{id}:
 *   patch:
 *     summary: Editar hilo
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hilo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Dudas, Recursos, Estudio, Proyectos, General]
 *     responses:
 *       200:
 *         description: Hilo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForumThread'
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: No autorizado - Solo autor o profesor
 *       404:
 *         description: Hilo no encontrado
 */
router.patch('/thread/:id', 
    auth.jwtAuth(), 
    forumGuard.checkThreadOwnerOrProfessor(),
    forumController.updateThread
);

/**
 * @swagger
 * /forums/thread/{id}:
 *   delete:
 *     summary: Eliminar hilo y sus respuestas
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hilo
 *     responses:
 *       200:
 *         description: Hilo eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thread deleted
 *       403:
 *         description: No autorizado - Solo autor o profesor
 *       404:
 *         description: Hilo no encontrado
 */
router.delete('/thread/:id', 
    auth.jwtAuth(), 
    forumGuard.checkThreadOwnerOrProfessor(),
    forumController.deleteThread
);

/**
 * @swagger
 * /forums/thread/{id}/pin:
 *   patch:
 *     summary: Fijar o desfijar un hilo
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hilo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPinned
 *             properties:
 *               isPinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hilo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForumThread'
 *       400:
 *         description: isPinned debe ser boolean
 *       403:
 *         description: No autorizado - Solo profesor del curso
 *       404:
 *         description: Hilo no encontrado
 */
router.patch('/thread/:id/pin', 
    auth.jwtAuth(), 
    forumGuard.checkProfessorOnly(),
    forumController.pinThread
);

/**
 * @swagger
 * /forums/thread/{id}/lock:
 *   patch:
 *     summary: Bloquear o desbloquear un hilo
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hilo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isLocked
 *             properties:
 *               isLocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hilo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForumThread'
 *       400:
 *         description: isLocked debe ser boolean
 *       403:
 *         description: No autorizado - Solo profesor del curso
 *       404:
 *         description: Hilo no encontrado
 */
router.patch('/thread/:id/lock', 
    auth.jwtAuth(), 
    forumGuard.checkProfessorOnly(),
    forumController.lockThread
);

/**
 * @swagger
 * /forums/thread/{id}/reply:
 *   post:
 *     summary: Crear respuesta en un hilo
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del hilo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Respuesta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForumReply'
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: No autorizado o hilo bloqueado
 *       404:
 *         description: Hilo no encontrado
 */
router.post('/thread/:id/reply', 
    auth.jwtAuth(), 
    forumGuard.checkForumAccessByThread(),
    forumGuard.checkThreadNotLocked(),
    forumController.createReply
);

/**
 * @swagger
 * /forums/reply/{id}:
 *   patch:
 *     summary: Editar respuesta
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la respuesta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Respuesta actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForumReply'
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: No autorizado - Solo autor de la respuesta
 *       404:
 *         description: Respuesta no encontrada
 */
router.patch('/reply/:id', 
    auth.jwtAuth(), 
    forumGuard.checkReplyOwner(),
    forumController.updateReply
);

/**
 * @swagger
 * /forums/reply/{id}:
 *   delete:
 *     summary: Eliminar respuesta
 *     tags: [Foros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la respuesta
 *     responses:
 *       200:
 *         description: Respuesta eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reply deleted
 *       403:
 *         description: No autorizado - Solo autor o profesor
 *       404:
 *         description: Respuesta no encontrada
 */
router.delete('/reply/:id', 
    auth.jwtAuth(), 
    forumGuard.checkReplyOwnerOrProfessor(),
    forumController.deleteReply
);

module.exports = router;

