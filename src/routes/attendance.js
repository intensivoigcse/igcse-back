const Router = require('koa-router');
const attendanceController = require('../controllers/attendanceController');
const auth = require('../auth/auth');
const attendanceGuard = require('../auth/guards/attendanceGuard');

const router = new Router({ prefix: '/attendance' });

/**
 * @swagger
 * components:
 *   schemas:
 *     AttendanceSession:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         courseId:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         sessionDate:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           format: time
 *         endTime:
 *           type: string
 *           format: time
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AttendanceRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         sessionId:
 *           type: integer
 *         userId:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [present, absent, late, excused]
 *         notes:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *     AttendanceJustification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         recordId:
 *           type: integer
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         professorNotes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /attendance/course/{courseId}/sessions:
 *   get:
 *     summary: Listar todas las sesiones de un curso
 *     tags: [Asistencia]
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
 *         description: Lista de sesiones con conteo de asistencia
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/AttendanceSession'
 *                   - type: object
 *                     properties:
 *                       _count:
 *                         type: object
 *                         properties:
 *                           present:
 *                             type: integer
 *                           absent:
 *                             type: integer
 *                           late:
 *                             type: integer
 *                           excused:
 *                             type: integer
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Curso no encontrado
 */
router.get('/course/:courseId/sessions',
    auth.jwtAuth(),
    attendanceGuard.checkCourseAccess('params', 'courseId'),
    attendanceController.getSessionsByCourse
);

/**
 * @swagger
 * /attendance/session:
 *   post:
 *     summary: Crear nueva sesion de asistencia
 *     tags: [Asistencia]
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
 *               - sessionDate
 *             properties:
 *               courseId:
 *                 type: integer
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *               sessionDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 format: time
 *               endTime:
 *                 type: string
 *                 format: time
 *     responses:
 *       201:
 *         description: Sesion creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceSession'
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: Solo el profesor puede crear sesiones
 */
router.post('/session',
    auth.jwtAuth(),
    attendanceGuard.checkProfessorOfCourse('body', 'courseId'),
    attendanceController.createSession
);

/**
 * @swagger
 * /attendance/session/{sessionId}:
 *   get:
 *     summary: Obtener asistencia completa de una sesion
 *     tags: [Asistencia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sesion
 *     responses:
 *       200:
 *         description: Sesion con todos los registros de asistencia
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/AttendanceSession'
 *                 - type: object
 *                   properties:
 *                     records:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AttendanceRecord'
 *       403:
 *         description: Solo el profesor puede ver el detalle
 *       404:
 *         description: Sesion no encontrada
 */
router.get('/session/:sessionId',
    auth.jwtAuth(),
    attendanceGuard.checkSessionProfessor(),
    attendanceController.getSessionDetail
);

/**
 * @swagger
 * /attendance/session/{sessionId}/bulk:
 *   post:
 *     summary: Guardar/actualizar asistencia masiva
 *     tags: [Asistencia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sesion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - records
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - userId
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [present, absent, late, excused]
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Asistencia actualizada
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: Solo el profesor puede marcar asistencia
 *       404:
 *         description: Sesion no encontrada
 */
router.post('/session/:sessionId/bulk',
    auth.jwtAuth(),
    attendanceGuard.checkSessionProfessor(),
    attendanceController.bulkUpdateAttendance
);

/**
 * @swagger
 * /attendance/record/{id}:
 *   patch:
 *     summary: Actualizar un registro de asistencia
 *     tags: [Asistencia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, excused]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registro actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceRecord'
 *       400:
 *         description: Error de validacion
 *       403:
 *         description: Solo el profesor puede actualizar
 *       404:
 *         description: Registro no encontrado
 */
router.patch('/record/:id',
    auth.jwtAuth(),
    attendanceGuard.checkRecordProfessor(),
    attendanceController.updateRecord
);

/**
 * @swagger
 * /attendance/record/{recordId}/justification:
 *   post:
 *     summary: Estudiante envia justificacion
 *     tags: [Asistencia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de asistencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Justificacion creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceJustification'
 *       400:
 *         description: Solo se puede justificar ausencia o tardanza
 *       403:
 *         description: Solo el estudiante dueno puede justificar
 *       404:
 *         description: Registro no encontrado
 */
router.post('/record/:recordId/justification',
    auth.jwtAuth(),
    attendanceGuard.checkRecordOwner(),
    attendanceController.createJustification
);

/**
 * @swagger
 * /attendance/justification/{id}:
 *   patch:
 *     summary: Profesor revisa justificacion
 *     tags: [Asistencia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la justificacion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               professorNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Justificacion revisada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceJustification'
 *       400:
 *         description: Status debe ser approved o rejected
 *       403:
 *         description: Solo el profesor puede revisar
 *       404:
 *         description: Justificacion no encontrada
 */
router.patch('/justification/:id',
    auth.jwtAuth(),
    attendanceGuard.checkJustificationProfessor(),
    attendanceController.reviewJustification
);

/**
 * @swagger
 * /attendance/course/{courseId}/stats:
 *   get:
 *     summary: Estadisticas de asistencia del curso
 *     tags: [Asistencia]
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
 *         description: Estadisticas del curso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSessions:
 *                   type: integer
 *                 averageAttendance:
 *                   type: number
 *                 studentStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       present:
 *                         type: integer
 *                       absent:
 *                         type: integer
 *                       late:
 *                         type: integer
 *                       excused:
 *                         type: integer
 *                       attendanceRate:
 *                         type: number
 *       403:
 *         description: Solo el profesor puede ver estadisticas
 *       404:
 *         description: Curso no encontrado
 */
router.get('/course/:courseId/stats',
    auth.jwtAuth(),
    attendanceGuard.checkProfessorOfCourse('params', 'courseId'),
    attendanceController.getCourseStats
);

/**
 * @swagger
 * /attendance/my/{courseId}:
 *   get:
 *     summary: Estadisticas de asistencia del estudiante
 *     tags: [Asistencia]
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
 *         description: Asistencia del estudiante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       justification:
 *                         $ref: '#/components/schemas/AttendanceJustification'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     present:
 *                       type: integer
 *                     absent:
 *                       type: integer
 *                     late:
 *                       type: integer
 *                     excused:
 *                       type: integer
 *                     attendanceRate:
 *                       type: number
 *       403:
 *         description: Requiere inscripcion activa
 *       404:
 *         description: Curso no encontrado
 */
router.get('/my/:courseId',
    auth.jwtAuth(),
    attendanceGuard.checkCourseAccess('params', 'courseId'),
    attendanceController.getMyAttendance
);

module.exports = router;

