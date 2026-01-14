const { Course, Inscription, AttendanceSession, AttendanceRecord, AttendanceJustification } = require('../../models');

module.exports = {
    /**
     * Verifica que el usuario sea profesor del curso o estudiante inscrito
     */
    checkCourseAccess(idSource = 'params', idKey = 'courseId') {
        return async (ctx, next) => {
            let courseId;

            if (idSource === 'params') {
                courseId = ctx.params[idKey];
            } else if (idSource === 'body') {
                courseId = ctx.request.body[idKey];
            }

            const course = await Course.findByPk(courseId);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;

            // Admin tiene acceso completo
            if (userRole === 'admin') {
                ctx.state.course = course;
                ctx.state.isProfessor = true;
                await next();
                return;
            }

            // Profesor del curso tiene acceso
            if (userRole === 'professor' && course.professor_id === userId) {
                ctx.state.course = course;
                ctx.state.isProfessor = true;
                await next();
                return;
            }

            // Estudiante con inscripcion activa tiene acceso
            if (userRole === 'student') {
                const inscription = await Inscription.findOne({
                    where: {
                        courseId: course.id,
                        userId: userId,
                        enrollment_status: 'active'
                    }
                });

                if (!inscription) {
                    ctx.status = 403;
                    ctx.body = { error: 'You must have an active enrollment to access attendance' };
                    return;
                }

                ctx.state.course = course;
                ctx.state.isProfessor = false;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Unauthorized' };
        };
    },

    /**
     * Verifica que el usuario sea profesor del curso (para crear/editar sesiones)
     */
    checkProfessorOfCourse(idSource = 'params', idKey = 'courseId') {
        return async (ctx, next) => {
            let courseId;

            if (idSource === 'params') {
                courseId = ctx.params[idKey];
            } else if (idSource === 'body') {
                courseId = ctx.request.body[idKey];
            }

            const course = await Course.findByPk(courseId);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;

            // Admin tiene acceso completo, o el profesor del curso
            if (userRole === 'admin' || course.professor_id === userId) {
                ctx.state.course = course;
                ctx.state.isProfessor = true;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Only the course professor or admin can perform this action' };
        };
    },

    /**
     * Verifica acceso a sesion y que sea profesor del curso
     */
    checkSessionProfessor() {
        return async (ctx, next) => {
            const sessionId = ctx.params.sessionId || ctx.params.id;

            const session = await AttendanceSession.findByPk(sessionId, {
                include: [{ model: Course, as: 'course' }]
            });

            if (!session) {
                ctx.status = 404;
                ctx.body = { error: 'Session not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;

            // Admin tiene acceso completo, o el profesor del curso
            if (userRole === 'admin' || session.course.professor_id === userId) {
                ctx.state.session = session;
                ctx.state.course = session.course;
                ctx.state.isProfessor = true;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Only the course professor or admin can perform this action' };
        };
    },

    /**
     * Verifica que el usuario sea profesor del curso del record
     */
    checkRecordProfessor() {
        return async (ctx, next) => {
            const recordId = ctx.params.id;

            const record = await AttendanceRecord.findByPk(recordId, {
                include: [{
                    model: AttendanceSession,
                    as: 'session',
                    include: [{ model: Course, as: 'course' }]
                }]
            });

            if (!record) {
                ctx.status = 404;
                ctx.body = { error: 'Attendance record not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;

            // Admin tiene acceso completo, o el profesor del curso
            if (userRole === 'admin' || record.session.course.professor_id === userId) {
                ctx.state.record = record;
                ctx.state.session = record.session;
                ctx.state.course = record.session.course;
                ctx.state.isProfessor = true;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Only the course professor or admin can perform this action' };
        };
    },

    /**
     * Verifica que el usuario sea dueno del record (estudiante)
     */
    checkRecordOwner() {
        return async (ctx, next) => {
            const recordId = ctx.params.recordId || ctx.params.id;

            const record = await AttendanceRecord.findByPk(recordId, {
                include: [{
                    model: AttendanceSession,
                    as: 'session',
                    include: [{ model: Course, as: 'course' }]
                }]
            });

            if (!record) {
                ctx.status = 404;
                ctx.body = { error: 'Attendance record not found' };
                return;
            }

            const userId = ctx.state.user.id;

            if (record.userId !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'You can only manage your own attendance records' };
                return;
            }

            ctx.state.record = record;
            ctx.state.session = record.session;
            ctx.state.course = record.session.course;
            await next();
        };
    },

    /**
     * Verifica que el usuario sea profesor del curso de la justificacion
     */
    checkJustificationProfessor() {
        return async (ctx, next) => {
            const justificationId = ctx.params.id;

            const justification = await AttendanceJustification.findByPk(justificationId, {
                include: [{
                    model: AttendanceRecord,
                    as: 'record',
                    include: [{
                        model: AttendanceSession,
                        as: 'session',
                        include: [{ model: Course, as: 'course' }]
                    }]
                }]
            });

            if (!justification) {
                ctx.status = 404;
                ctx.body = { error: 'Justification not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;

            // Admin tiene acceso completo, o el profesor del curso
            if (userRole === 'admin' || justification.record.session.course.professor_id === userId) {
                ctx.state.justification = justification;
                ctx.state.record = justification.record;
                ctx.state.session = justification.record.session;
                ctx.state.course = justification.record.session.course;
                ctx.state.isProfessor = true;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Only the course professor or admin can review justifications' };
        };
    }
};

