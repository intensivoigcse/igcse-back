const { Assignment } = require('../../models');
const courseAccessGuard = require('./courseAccessGuard');

module.exports = {
    checkAssignmentAccess(idKey = 'id', idSource = 'params') {
        return async (ctx, next) => {

            let assignmentId;
            if (idSource === 'params') {
                assignmentId = ctx.params[idKey];
            }
            if (idSource === 'body') {
                assignmentId = ctx.request.body[idKey];
            }


            if (!assignmentId) {
                ctx.status = 400;
                ctx.body = { error: 'Assignment ID missing from parameters' };
                return;
            }

            const assignment = await Assignment.findByPk(assignmentId);
            if (!assignment) {
                ctx.status = 404;
                ctx.body = { error: 'Assignment not found' };
                return;
            }

            ctx.state.assignment = assignment;
            const courseId = assignment.course_id;
            ctx.params.courseId = courseId; 

            const courseGuard =  courseAccessGuard.checkCourseAccess('params', 'courseId');
            
            await courseGuard(ctx, next);
        };
    },
};