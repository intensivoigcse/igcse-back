const {Inscription, Course} = require('../../models');

module.exports = {
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

            if (userRole === 'professor' && course.professor_id !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Unauthorized' };
                return;
            }

            if (userRole === 'student'){

                const inscription = await Inscription.findOne({ where: { courseId: course.id, userId: userId } });
                if (!inscription) {
                    ctx.status = 403;
                    ctx.body = { error: 'Unauthorized' };
                    return;
             }
            }


            await next();
        };
    },
}