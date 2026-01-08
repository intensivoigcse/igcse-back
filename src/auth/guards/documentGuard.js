const { Course, Inscription, Document } = require('../../models');

module.exports = {
    /**
     * Verifica que el usuario tenga acceso a los materiales del curso
     * (admin, profesor del curso o estudiante inscrito)
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
                    ctx.body = { error: 'You must have an active enrollment to access materials' };
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
     * Verifica que el usuario pueda eliminar un documento
     * (admin o profesor del curso)
     */
    checkDocumentDeleteAccess() {
        return async (ctx, next) => {
            const documentId = ctx.params.id;

            const document = await Document.findByPk(documentId);

            if (!document) {
                ctx.status = 404;
                ctx.body = { error: 'Document not found' };
                return;
            }

            const course = await Course.findByPk(document.courseId);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;

            // Admin tiene acceso completo
            if (userRole === 'admin') {
                ctx.state.document = document;
                ctx.state.course = course;
                await next();
                return;
            }

            // Profesor del curso puede eliminar
            if (course.professor_id === userId) {
                ctx.state.document = document;
                ctx.state.course = course;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Only admin or course professor can delete materials' };
        };
    },

    /**
     * Verifica que el usuario pueda editar un documento
     * (admin o profesor del curso)
     */
    checkDocumentEditAccess() {
        return async (ctx, next) => {
            const documentId = ctx.params.id;

            const document = await Document.findByPk(documentId);

            if (!document) {
                ctx.status = 404;
                ctx.body = { error: 'Document not found' };
                return;
            }

            const course = await Course.findByPk(document.courseId);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;

            // Admin tiene acceso completo
            if (userRole === 'admin') {
                ctx.state.document = document;
                ctx.state.course = course;
                await next();
                return;
            }

            // Profesor del curso puede editar
            if (course.professor_id === userId) {
                ctx.state.document = document;
                ctx.state.course = course;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Only admin or course professor can edit materials' };
        };
    }
};

