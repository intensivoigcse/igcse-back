const {Course, Inscription, Folder } = require('../../models');


module.exports = {

    checkCourseOwnership() {
        return async (ctx, next) => {

            const userId = ctx.state.user.id;


            const course = await Course.findByPk(ctx.params.id);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }
            
            if (course.professor_id !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Unauthorized' };
                return;
            }
            await next();
            
        
        };
    },


    checkInscriptionOwnership() {
        return async (ctx, next) => {
            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;
            const inscription = await Inscription.findByPk(ctx.params.id);

            if (!inscription) {
                ctx.status = 404;
                ctx.body = { error: 'Inscription not found' };
                return;
            }

            const course = await Course.findByPk(inscription.courseId);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            const professorId = course.professor_id;

            // Permitir si es admin, el dueño de la inscripción, o el profesor del curso
            if (userRole === 'admin' || inscription.userId === userId || professorId === userId) {
                await next();
                return;
            }

            ctx.status = 403;
            ctx.body = { error: 'Unauthorized' };
        };
    },

    checkFolderOwnership(){
        return async (ctx, next) => {
            const userId = ctx.state.user.id;
            const folder = await Folder.findByPk(ctx.params.id);
            const course = await Course.findByPk(folder.courseId);
            const professorId = course.professor_id;

            if (!folder) {
                ctx.status = 404;
                ctx.body = { error: 'Folder not found' };
                return;
            }

            if (professorId !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Unauthorized' };
                return;
            }
            await next()
        }
    }





}