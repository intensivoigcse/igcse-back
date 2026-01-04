const { Course, Inscription, Announcement } = require('../../models');

module.exports = {
    /**
     * Verifica que el usuario sea profesor del curso o estudiante inscrito activo
     * Para listar anuncios
     */
    checkCourseAccess(idSource = 'params', idKey = 'courseId') {
        return async (ctx, next) => {
            let courseId;

            if (idSource === 'params') {
                courseId = ctx.params[idKey];
            } else if (idSource === 'body') {
                courseId = ctx.request.body[idKey] || ctx.request.body['course_id'];
            }

            const course = await Course.findByPk(courseId);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;

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
                    ctx.body = { error: 'You must have an active enrollment to view announcements' };
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
     * Verifica que el usuario sea profesor del curso (para crear anuncios)
     */
    checkProfessorOfCourse(idSource = 'body', idKey = 'course_id') {
        return async (ctx, next) => {
            let courseId;

            if (idSource === 'params') {
                courseId = ctx.params[idKey];
            } else if (idSource === 'body') {
                courseId = ctx.request.body[idKey] || ctx.request.body['courseId'];
            }

            if (!courseId) {
                ctx.status = 400;
                ctx.body = { error: 'course_id is required' };
                return;
            }

            const course = await Course.findByPk(courseId);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            const userId = ctx.state.user.id;

            if (course.professor_id !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Only the course professor can create announcements' };
                return;
            }

            ctx.state.course = course;
            ctx.state.isProfessor = true;
            await next();
        };
    },

    /**
     * Verifica que el usuario sea el autor del anuncio
     */
    checkAnnouncementAuthor() {
        return async (ctx, next) => {
            const announcementId = ctx.params.id;

            const announcement = await Announcement.findByPk(announcementId, {
                include: [{ model: Course, as: 'course' }]
            });

            if (!announcement) {
                ctx.status = 404;
                ctx.body = { error: 'Announcement not found' };
                return;
            }

            const userId = ctx.state.user.id;

            if (announcement.authorId !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Only the announcement author can perform this action' };
                return;
            }

            ctx.state.announcement = announcement;
            ctx.state.course = announcement.course;
            ctx.state.isProfessor = true;
            await next();
        };
    }
};

