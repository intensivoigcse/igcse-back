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
            const inscription = await Inscription.findByPk(ctx.params.id);
            const course = await Course.findByPk(inscription.courseId);
            const professorId = course.professor_id;

            if (!inscription) {
                ctx.status = 404;
                ctx.body = { error: 'Inscription not found' };
                return;
            }

            if (inscription.userId !== userId && professorId !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Unauthorized' };
                return;
            }
            await next();
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