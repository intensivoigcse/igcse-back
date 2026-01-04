const { 
    AttendanceSession, 
    AttendanceRecord, 
    AttendanceJustification, 
    User, 
    Inscription,
    Sequelize 
} = require('../models');

module.exports = {
    /**
     * GET /attendance/course/:courseId/sessions
     * Listar todas las sesiones de un curso
     */
    async getSessionsByCourse(ctx) {
        try {
            const { courseId } = ctx.params;

            const sessions = await AttendanceSession.findAll({
                where: { courseId },
                order: [['sessionDate', 'DESC']],
                attributes: {
                    include: [
                        [
                            Sequelize.literal('(SELECT COUNT(*) FROM "attendance_records" WHERE "attendance_records"."sessionId" = "AttendanceSession"."id" AND "attendance_records"."status" = \'present\')'),
                            'presentCount'
                        ],
                        [
                            Sequelize.literal('(SELECT COUNT(*) FROM "attendance_records" WHERE "attendance_records"."sessionId" = "AttendanceSession"."id" AND "attendance_records"."status" = \'absent\')'),
                            'absentCount'
                        ],
                        [
                            Sequelize.literal('(SELECT COUNT(*) FROM "attendance_records" WHERE "attendance_records"."sessionId" = "AttendanceSession"."id" AND "attendance_records"."status" = \'late\')'),
                            'lateCount'
                        ],
                        [
                            Sequelize.literal('(SELECT COUNT(*) FROM "attendance_records" WHERE "attendance_records"."sessionId" = "AttendanceSession"."id" AND "attendance_records"."status" = \'excused\')'),
                            'excusedCount'
                        ]
                    ]
                }
            });

            const formattedSessions = sessions.map(session => {
                const data = session.toJSON();
                return {
                    id: data.id,
                    courseId: data.courseId,
                    title: data.title,
                    description: data.description,
                    sessionDate: data.sessionDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    createdAt: data.createdAt,
                    _count: {
                        present: parseInt(data.presentCount) || 0,
                        absent: parseInt(data.absentCount) || 0,
                        late: parseInt(data.lateCount) || 0,
                        excused: parseInt(data.excusedCount) || 0
                    }
                };
            });

            ctx.body = formattedSessions;
        } catch (err) {
            console.error('Error fetching sessions:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching sessions' };
        }
    },

    /**
     * POST /attendance/session
     * Crear nueva sesion y auto-crear records para estudiantes activos
     */
    async createSession(ctx) {
        try {
            const { courseId, title, description, sessionDate, startTime, endTime } = ctx.request.body;

            // Validaciones
            if (!courseId) {
                ctx.status = 400;
                ctx.body = { error: 'courseId is required' };
                return;
            }

            if (!title || title.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Title is required' };
                return;
            }

            if (title.length > 200) {
                ctx.status = 400;
                ctx.body = { error: 'Title must be at most 200 characters' };
                return;
            }

            if (!sessionDate) {
                ctx.status = 400;
                ctx.body = { error: 'sessionDate is required' };
                return;
            }

            // Crear sesion
            const session = await AttendanceSession.create({
                courseId,
                title: title.trim(),
                description: description ? description.trim() : null,
                sessionDate,
                startTime: startTime || null,
                endTime: endTime || null
            });

            // Obtener estudiantes activos del curso
            const activeInscriptions = await Inscription.findAll({
                where: {
                    courseId,
                    enrollment_status: 'active'
                }
            });

            // Crear registros de asistencia para cada estudiante (status='absent' por defecto)
            const recordsData = activeInscriptions.map(inscription => ({
                sessionId: session.id,
                userId: inscription.userId,
                status: 'absent'
            }));

            if (recordsData.length > 0) {
                await AttendanceRecord.bulkCreate(recordsData);
            }

            // Devolver sesion creada con conteo
            const createdSession = await AttendanceSession.findByPk(session.id);

            ctx.status = 201;
            ctx.body = {
                ...createdSession.toJSON(),
                studentsCount: recordsData.length
            };
        } catch (err) {
            console.error('Error creating session:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * GET /attendance/session/:sessionId
     * Obtener asistencia completa de una sesion
     */
    async getSessionDetail(ctx) {
        try {
            const session = ctx.state.session;

            const records = await AttendanceRecord.findAll({
                where: { sessionId: session.id },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: AttendanceJustification,
                        as: 'justification'
                    }
                ],
                order: [[{ model: User, as: 'user' }, 'name', 'ASC']]
            });

            ctx.body = {
                id: session.id,
                courseId: session.courseId,
                title: session.title,
                description: session.description,
                sessionDate: session.sessionDate,
                startTime: session.startTime,
                endTime: session.endTime,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                records: records.map(record => ({
                    id: record.id,
                    userId: record.userId,
                    status: record.status,
                    notes: record.notes,
                    user: record.user,
                    justification: record.justification ? {
                        id: record.justification.id,
                        reason: record.justification.reason,
                        status: record.justification.status,
                        professorNotes: record.justification.professorNotes,
                        createdAt: record.justification.createdAt
                    } : null
                }))
            };
        } catch (err) {
            console.error('Error fetching session detail:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching session detail' };
        }
    },

    /**
     * POST /attendance/session/:sessionId/bulk
     * Guardar/actualizar asistencia masiva
     */
    async bulkUpdateAttendance(ctx) {
        try {
            const session = ctx.state.session;
            const { records } = ctx.request.body;

            if (!records || !Array.isArray(records)) {
                ctx.status = 400;
                ctx.body = { error: 'records array is required' };
                return;
            }

            const validStatuses = ['present', 'absent', 'late', 'excused'];
            const updatedRecords = [];

            for (const recordData of records) {
                const { userId, status, notes } = recordData;

                if (!userId) continue;

                if (status && !validStatuses.includes(status)) {
                    ctx.status = 400;
                    ctx.body = { error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` };
                    return;
                }

                const record = await AttendanceRecord.findOne({
                    where: {
                        sessionId: session.id,
                        userId
                    }
                });

                if (record) {
                    const updateData = {};
                    if (status) updateData.status = status;
                    if (notes !== undefined) updateData.notes = notes;

                    await record.update(updateData);
                    updatedRecords.push(record);
                }
            }

            // Obtener todos los registros actualizados
            const allRecords = await AttendanceRecord.findAll({
                where: { sessionId: session.id },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            ctx.body = {
                message: 'Attendance updated successfully',
                updatedCount: updatedRecords.length,
                records: allRecords
            };
        } catch (err) {
            console.error('Error bulk updating attendance:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * PATCH /attendance/record/:id
     * Actualizar un registro de asistencia
     */
    async updateRecord(ctx) {
        try {
            const record = ctx.state.record;
            const { status, notes } = ctx.request.body;

            const validStatuses = ['present', 'absent', 'late', 'excused'];

            if (status && !validStatuses.includes(status)) {
                ctx.status = 400;
                ctx.body = { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
                return;
            }

            const updateData = {};
            if (status) updateData.status = status;
            if (notes !== undefined) updateData.notes = notes;

            await record.update(updateData);

            const updatedRecord = await AttendanceRecord.findByPk(record.id, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: AttendanceJustification,
                        as: 'justification'
                    }
                ]
            });

            ctx.body = updatedRecord;
        } catch (err) {
            console.error('Error updating record:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * POST /attendance/record/:recordId/justification
     * Estudiante envia justificacion
     */
    async createJustification(ctx) {
        try {
            const record = ctx.state.record;
            const { reason } = ctx.request.body;

            // Validar que el status sea 'absent' o 'late'
            if (!['absent', 'late'].includes(record.status)) {
                ctx.status = 400;
                ctx.body = { error: 'Justifications can only be submitted for absent or late status' };
                return;
            }

            if (!reason || reason.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Reason is required' };
                return;
            }

            // Verificar si ya existe una justificacion
            const existingJustification = await AttendanceJustification.findOne({
                where: { recordId: record.id }
            });

            if (existingJustification) {
                ctx.status = 400;
                ctx.body = { error: 'A justification already exists for this record' };
                return;
            }

            const justification = await AttendanceJustification.create({
                recordId: record.id,
                reason: reason.trim(),
                status: 'pending'
            });

            ctx.status = 201;
            ctx.body = justification;
        } catch (err) {
            console.error('Error creating justification:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * PATCH /attendance/justification/:id
     * Profesor revisa justificacion
     */
    async reviewJustification(ctx) {
        try {
            const justification = ctx.state.justification;
            const record = ctx.state.record;
            const { status, professorNotes } = ctx.request.body;

            if (!status || !['approved', 'rejected'].includes(status)) {
                ctx.status = 400;
                ctx.body = { error: 'Status must be either approved or rejected' };
                return;
            }

            await justification.update({
                status,
                professorNotes: professorNotes || null
            });

            // Si se aprueba, cambiar el status del record a 'excused'
            if (status === 'approved') {
                await record.update({ status: 'excused' });
            }

            const updatedJustification = await AttendanceJustification.findByPk(justification.id, {
                include: [{
                    model: AttendanceRecord,
                    as: 'record',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }]
                }]
            });

            ctx.body = updatedJustification;
        } catch (err) {
            console.error('Error reviewing justification:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * GET /attendance/course/:courseId/stats
     * Estadisticas de asistencia del curso (para profesor)
     */
    async getCourseStats(ctx) {
        try {
            const { courseId } = ctx.params;

            // Total de sesiones
            const totalSessions = await AttendanceSession.count({
                where: { courseId }
            });

            if (totalSessions === 0) {
                ctx.body = {
                    totalSessions: 0,
                    averageAttendance: 0,
                    studentStats: []
                };
                return;
            }

            // Obtener estudiantes activos
            const activeInscriptions = await Inscription.findAll({
                where: {
                    courseId,
                    enrollment_status: 'active'
                },
                include: [{
                    model: User,
                    as: 'student',
                    attributes: ['id', 'name', 'email']
                }]
            });

            const studentStats = [];
            let totalPresent = 0;
            let totalRecords = 0;

            for (const inscription of activeInscriptions) {
                const records = await AttendanceRecord.findAll({
                    where: { userId: inscription.userId },
                    include: [{
                        model: AttendanceSession,
                        as: 'session',
                        where: { courseId }
                    }]
                });

                const stats = {
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0
                };

                records.forEach(record => {
                    stats[record.status]++;
                    totalRecords++;
                    if (record.status === 'present' || record.status === 'excused') {
                        totalPresent++;
                    }
                });

                const totalStudentRecords = stats.present + stats.absent + stats.late + stats.excused;
                const attendanceRate = totalStudentRecords > 0
                    ? Math.round(((stats.present + stats.excused) / totalStudentRecords) * 100)
                    : 0;

                studentStats.push({
                    userId: inscription.student.id,
                    name: inscription.student.name,
                    email: inscription.student.email,
                    present: stats.present,
                    absent: stats.absent,
                    late: stats.late,
                    excused: stats.excused,
                    attendanceRate
                });
            }

            const averageAttendance = totalRecords > 0
                ? Math.round((totalPresent / totalRecords) * 100)
                : 0;

            ctx.body = {
                totalSessions,
                averageAttendance,
                studentStats
            };
        } catch (err) {
            console.error('Error fetching course stats:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching course stats' };
        }
    },

    /**
     * GET /attendance/my/:courseId
     * Estadisticas de asistencia del estudiante
     */
    async getMyAttendance(ctx) {
        try {
            const { courseId } = ctx.params;
            const userId = ctx.state.user.id;

            const records = await AttendanceRecord.findAll({
                where: { userId },
                include: [
                    {
                        model: AttendanceSession,
                        as: 'session',
                        where: { courseId },
                        attributes: ['id', 'title', 'sessionDate']
                    },
                    {
                        model: AttendanceJustification,
                        as: 'justification'
                    }
                ],
                order: [[{ model: AttendanceSession, as: 'session' }, 'sessionDate', 'DESC']]
            });

            const stats = {
                present: 0,
                absent: 0,
                late: 0,
                excused: 0
            };

            const sessions = records.map(record => {
                stats[record.status]++;

                return {
                    sessionId: record.session.id,
                    title: record.session.title,
                    date: record.session.sessionDate,
                    status: record.status,
                    justification: record.justification ? {
                        id: record.justification.id,
                        reason: record.justification.reason,
                        status: record.justification.status,
                        professorNotes: record.justification.professorNotes
                    } : null
                };
            });

            const totalRecords = stats.present + stats.absent + stats.late + stats.excused;
            const attendanceRate = totalRecords > 0
                ? Math.round(((stats.present + stats.excused) / totalRecords) * 100)
                : 0;

            ctx.body = {
                sessions,
                stats: {
                    ...stats,
                    attendanceRate
                }
            };
        } catch (err) {
            console.error('Error fetching my attendance:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching attendance' };
        }
    }
};

