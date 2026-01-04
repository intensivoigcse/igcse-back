const Router = require('koa-router');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const coursesRoutes = require('./routes/course');
const inscriptionRoutes = require('./routes/inscription');
const paymentRoutes = require('./routes/payment');
const folderRoutes = require('./routes/folder');
const documentRoutes = require('./routes/document');
const assignmentRoutes = require('./routes/assignment');
const submissionRoutes = require('./routes/submission');
const forumRoutes = require('./routes/forum');
const attendanceRoutes = require('./routes/attendance');
const announcementRoutes = require('./routes/announcement');
const router = new Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Endpoint raíz de la API
 *     tags: [General]
 *     security: []
 *     responses:
 *       200:
 *         description: Mensaje de bienvenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello World
 *                 swagger:
 *                   type: string
 *                   example: http://localhost:3000/api-docs
 */
router.get('/', (ctx) => {
    const baseUrl = `${ctx.protocol}://${ctx.host}`;
    ctx.body = { 
        message: 'Hello World',
        swagger: `${baseUrl}/api-docs`,
        version: '1.0.0'
    };
});
router.use(userRoutes.routes()).use(userRoutes.allowedMethods());
router.use(authRoutes.routes()).use(authRoutes.allowedMethods());
router.use(profileRoutes.routes()).use(profileRoutes.allowedMethods());
router.use(coursesRoutes.routes()).use(coursesRoutes.allowedMethods());
router.use(inscriptionRoutes.routes()).use(inscriptionRoutes.allowedMethods());
router.use(paymentRoutes.routes()).use(paymentRoutes.allowedMethods());
router.use(folderRoutes.routes()).use(folderRoutes.allowedMethods());
router.use(documentRoutes.routes()).use(documentRoutes.allowedMethods());
router.use(assignmentRoutes.routes()).use(assignmentRoutes.allowedMethods());
router.use(submissionRoutes.routes()).use(submissionRoutes.allowedMethods());
router.use(forumRoutes.routes()).use(forumRoutes.allowedMethods());
router.use(attendanceRoutes.routes()).use(attendanceRoutes.allowedMethods());
router.use(announcementRoutes.routes()).use(announcementRoutes.allowedMethods());
module.exports = router;
