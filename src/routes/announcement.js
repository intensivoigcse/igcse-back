const Router = require('koa-router');
const announcementController = require('../controllers/announcementController');
const auth = require('../auth/auth');
const announcementGuard = require('../auth/guards/announcementGuard');

const router = new Router({ prefix: '/announcements' });

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       properties:
 *         announcement_id:
 *           type: integer
 *         course_id:
 *           type: integer
 *         author_id:
 *           type: integer
 *         author_name:
 *           type: string
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [normal, important, urgent]
 *         is_pinned:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /announcements/course/{courseId}:
 *   get:
 *     summary: Listar anuncios de un curso
 *     tags: [Anuncios]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar en titulo y contenido
 *     responses:
 *       200:
 *         description: Lista de anuncios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 announcements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Announcement'
 *       403:
 *         description: No autorizado - Requiere ser profesor o estudiante inscrito
 *       404:
 *         description: Curso no encontrado
 */
router.get('/course/:courseId',
    auth.jwtAuth(),
    announcementGuard.checkCourseAccess('params', 'courseId'),
    announcementController.getAnnouncementsByCourse
);

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Crear anuncio
 *     tags: [Anuncios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course_id
 *               - title
 *               - content
 *             properties:
 *               course_id:
 *                 type: integer
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               content:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [normal, important, urgent]
 *                 default: normal
 *               is_pinned:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Anuncio creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 announcement:
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Datos invalidos
 *       403:
 *         description: Solo el profesor del curso puede crear anuncios
 *       404:
 *         description: Curso no encontrado
 */
router.post('/',
    auth.jwtAuth(),
    announcementGuard.checkProfessorOfCourse('body', 'course_id'),
    announcementController.createAnnouncement
);

/**
 * @swagger
 * /announcements/{id}:
 *   put:
 *     summary: Actualizar anuncio
 *     tags: [Anuncios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del anuncio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               content:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [normal, important, urgent]
 *               is_pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Anuncio actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 announcement:
 *                   $ref: '#/components/schemas/Announcement'
 *       400:
 *         description: Datos invalidos
 *       403:
 *         description: Solo el autor puede actualizar
 *       404:
 *         description: Anuncio no encontrado
 */
router.put('/:id',
    auth.jwtAuth(),
    announcementGuard.checkAnnouncementAuthor(),
    announcementController.updateAnnouncement
);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Eliminar anuncio
 *     tags: [Anuncios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del anuncio
 *     responses:
 *       200:
 *         description: Anuncio eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcement deleted successfully
 *       403:
 *         description: Solo el autor puede eliminar
 *       404:
 *         description: Anuncio no encontrado
 */
router.delete('/:id',
    auth.jwtAuth(),
    announcementGuard.checkAnnouncementAuthor(),
    announcementController.deleteAnnouncement
);

/**
 * @swagger
 * /announcements/{id}/pin:
 *   patch:
 *     summary: Toggle pin del anuncio
 *     tags: [Anuncios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del anuncio
 *     responses:
 *       200:
 *         description: Pin invertido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 announcement:
 *                   $ref: '#/components/schemas/Announcement'
 *       403:
 *         description: Solo el autor puede fijar/desfijar
 *       404:
 *         description: Anuncio no encontrado
 */
router.patch('/:id/pin',
    auth.jwtAuth(),
    announcementGuard.checkAnnouncementAuthor(),
    announcementController.togglePin
);

module.exports = router;

