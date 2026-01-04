const { Submission } = require('../../models');
const assignmentAccessGuard = require('./assignmentGuard');

module.exports = {
    checkSubmissionAccess(idKey = 'id', idSource = 'params') {
        return async (ctx, next) => {

            let submissionId;
            if (idSource === 'params') {
                submissionId = ctx.params[idKey];
            }
            if (idSource === 'body') {
                submissionId = ctx.request.body[idKey];
            }

            if (!submissionId) {
                ctx.status = 400;
                ctx.body = { error: 'Submission ID missing from parameters' };
                return;
            }

            const submission = await Submission.findByPk(submissionId);
            if (!submission) {
                ctx.status = 404;
                ctx.body = { error: 'Submission not found' };
                return;
            }

            const assignmentId = submission.assignmentId;
   
            ctx.params.assignmentId = assignmentId;

            ctx.state.submission = submission;

            const assignmentGuard = assignmentAccessGuard.checkAssignmentAccess('assignmentId', 'params');
            
            await assignmentGuard(ctx, next);
        };
    },
};