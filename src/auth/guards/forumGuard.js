const { Inscription, Course, ForumThread, ForumReply } = require('../../models');

module.exports = {
    /**
     * Verifica que el usuario tenga acceso al foro del curso
     * (inscripcion activa o profesor del curso)
     */
    checkForumAccess(idSource = 'params', idKey = 'courseId') {
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
                    ctx.body = { error: 'You must have an active enrollment to access this forum' };
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
     * Verifica acceso al foro via threadId (obtiene courseId del thread)
     */
    checkForumAccessByThread() {
        return async (ctx, next) => {
            const threadId = ctx.params.id || ctx.params.threadId;
            
            const thread = await ForumThread.findByPk(threadId, {
                include: [{ model: Course, as: 'course' }]
            });

            if (!thread) {
                ctx.status = 404;
                ctx.body = { error: 'Thread not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;
            const course = thread.course;

            // Profesor del curso tiene acceso
            if (userRole === 'professor' && course.professor_id === userId) {
                ctx.state.thread = thread;
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
                    ctx.body = { error: 'You must have an active enrollment to access this forum' };
                    return;
                }

                ctx.state.thread = thread;
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
     * Verifica que el usuario sea el autor del hilo O profesor del curso
     */
    checkThreadOwnerOrProfessor() {
        return async (ctx, next) => {
            const threadId = ctx.params.id;
            
            const thread = await ForumThread.findByPk(threadId, {
                include: [{ model: Course, as: 'course' }]
            });

            if (!thread) {
                ctx.status = 404;
                ctx.body = { error: 'Thread not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const course = thread.course;

            // Es el autor del hilo
            if (thread.userId === userId) {
                ctx.state.thread = thread;
                ctx.state.course = course;
                await next();
                return;
            }

            // Es el profesor del curso
            if (course.professor_id === userId) {
                ctx.state.thread = thread;
                ctx.state.course = course;
                ctx.state.isProfessor = true;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Only the thread author or course professor can perform this action' };
        };
    },

    /**
     * Verifica que el usuario sea profesor del curso (para pin/lock)
     */
    checkProfessorOnly() {
        return async (ctx, next) => {
            const threadId = ctx.params.id;
            
            const thread = await ForumThread.findByPk(threadId, {
                include: [{ model: Course, as: 'course' }]
            });

            if (!thread) {
                ctx.status = 404;
                ctx.body = { error: 'Thread not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const course = thread.course;

            if (course.professor_id !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Only the course professor can perform this action' };
                return;
            }

            ctx.state.thread = thread;
            ctx.state.course = course;
            ctx.state.isProfessor = true;
            await next();
        };
    },

    /**
     * Verifica que el hilo no este bloqueado (excepto profesor)
     */
    checkThreadNotLocked() {
        return async (ctx, next) => {
            const thread = ctx.state.thread;
            const isProfessor = ctx.state.isProfessor;

            if (thread.isLocked && !isProfessor) {
                ctx.status = 403;
                ctx.body = { error: 'This thread is locked. No new replies allowed' };
                return;
            }

            await next();
        };
    },

    /**
     * Verifica que el usuario sea el autor de la respuesta
     */
    checkReplyOwner() {
        return async (ctx, next) => {
            const replyId = ctx.params.id;
            
            const reply = await ForumReply.findByPk(replyId, {
                include: [{ 
                    model: ForumThread, 
                    as: 'thread',
                    include: [{ model: Course, as: 'course' }]
                }]
            });

            if (!reply) {
                ctx.status = 404;
                ctx.body = { error: 'Reply not found' };
                return;
            }

            const userId = ctx.state.user.id;

            if (reply.userId !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Only the reply author can perform this action' };
                return;
            }

            ctx.state.reply = reply;
            ctx.state.thread = reply.thread;
            ctx.state.course = reply.thread.course;
            await next();
        };
    },

    /**
     * Verifica que el usuario sea autor de la respuesta O profesor del curso
     */
    checkReplyOwnerOrProfessor() {
        return async (ctx, next) => {
            const replyId = ctx.params.id;
            
            const reply = await ForumReply.findByPk(replyId, {
                include: [{ 
                    model: ForumThread, 
                    as: 'thread',
                    include: [{ model: Course, as: 'course' }]
                }]
            });

            if (!reply) {
                ctx.status = 404;
                ctx.body = { error: 'Reply not found' };
                return;
            }

            const userId = ctx.state.user.id;
            const course = reply.thread.course;

            // Es el autor de la respuesta
            if (reply.userId === userId) {
                ctx.state.reply = reply;
                ctx.state.thread = reply.thread;
                ctx.state.course = course;
                await next();
                return;
            }

            // Es el profesor del curso
            if (course.professor_id === userId) {
                ctx.state.reply = reply;
                ctx.state.thread = reply.thread;
                ctx.state.course = course;
                ctx.state.isProfessor = true;
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Only the reply author or course professor can perform this action' };
        };
    }
};

