const { Submission, Assignment, User} = require('../models');
const submissionUtils = require('../controllers/utils/submissionUtils');




module.exports = {
    async create(ctx) {
        try {
            const userId = ctx.state.user.id; 
            
            const { 
                assignmentId, 
            } = ctx.request.body;

            if (!assignmentId) {
                ctx.status = 400;
                ctx.body = { error: 'Assignment ID is required to create a submission.' };
                return;
            }

            const newSubmission = await Submission.create({
                userId, 
                assignmentId, 
                submissionDate: Date.now() 
            });
            
            ctx.status = 201;
            ctx.body = newSubmission;

        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: 'Failed to create submission', details: err.message };
        }
    },

    async uploadSubmissions(ctx) {
        try {
            const userId = ctx.state.user.id;
            const { assignmentId } = ctx.request.body;
            const files = ctx.request.files;

            if (!files || files.length === 0) {
                ctx.status = 400;
                ctx.body = { error: 'No files uploaded.' };
                return;
            }

            const assignment = await Assignment.findByPk(assignmentId);
            if (!assignment) {
                ctx.status = 404;
                ctx.body = { error: 'Assignment not found.' };
                return;
            }

            if (assignment.due_date < Date.now()) {
                ctx.status = 400;
                ctx.body = { error: 'Assignment is due.' };
                return;
            }

            const submission = await Submission.create({
                userId,
                assignmentId,
                submissionDate: Date.now()
            });

            const courseId = assignment.course_id;
            const folder = await submissionUtils.getOrCreateSubmissionFolder(courseId, userId);

            const documents = await submissionUtils.uploadSubmissionFiles(
                files,
                courseId,
                submission.id,
                folder.id
            );

            ctx.status = 201;
            ctx.body = { submission, documents };

        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: 'Failed to upload submission', details: err.message };
        }
    },


    async getAll(ctx) {
        try {
            const submissions = await Submission.findAll({
                include: [
                    { model: User, as: 'student'},
                    { model: Assignment, as: 'assignment' }
                ]
            });
            ctx.body = submissions;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching submissions' };
        }
    },

    async getById(ctx) {
        try {
            const submission = await Submission.findByPk(ctx.params.id, {
                include: [
                    { model: User, as: 'student' },
                    { model: Assignment, as: 'assignment' }
                ]
            });
            if (!submission) {
                ctx.status = 404;
                ctx.body = { error: 'Submission not found' };
                return;
            }

            const documents = await submissionUtils.getSubmissionDocuments(submission.id);
            ctx.body = { submission, documents };

        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching submission' };
        }
    },

    async update(ctx) {
        try {
            const { id } = ctx.params;
            const {score, comments} = ctx.request.body;
            const updateBody = {
                score,
                comments
            };   
            if (updateBody.score !== undefined && updateBody.score !== null) {
                
                const submission = await Submission.findByPk(id);

                if (!submission) {
                    ctx.status = 404;
                    ctx.body = { error: 'Submission not found' };
                    return;
                }

                const assignment = await Assignment.findByPk(submission.assignmentId);

                if (!assignment) {
                    ctx.status = 400;
                    ctx.body = { error: 'Invalid operation: Assignment not found for this submission.' };
                    return;
                }

                const maxScore = assignment.maxScore;

                if (updateBody.score > maxScore) {
                    ctx.status = 400;
                    ctx.body = { error: `Score (${updateBody.score}) cannot be greater than the maximum score for the assignment (${maxScore}).` };
                    return;
                }
            }
            
            const [updated] = await Submission.update(updateBody, {
                where: { id },
            });

            if (updated === 0) {
                ctx.status = 404;
                ctx.body = { error: 'Submission not found or no changes made' };
                return;
            }

            const updatedSubmission = await Submission.findByPk(id);

            const documents = await submissionUtils.getSubmissionDocuments(updatedSubmission.id);

            ctx.body = { submission: updatedSubmission, documents };

        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: 'Failed to update submission', details: err.message };
        }
    },

    async remove(ctx) {
        try {
            const { id } = ctx.params;
            const deleted = await Submission.destroy({
                where: { submissionId: id },
            });

            if (deleted === 0) {
                ctx.status = 404;
                ctx.body = { error: 'Submission not found' };
                return;
            }

            ctx.status = 204;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error deleting submission' };
        }
    },

    async getByAssignmentId(ctx) {
        try {
            const { assignmentId } = ctx.params;
            const submissions = await Submission.findAll({
                where: { assignmentId },
            });


            ctx.body = await submissionUtils.getSubmissionsDocuments(submissions);


        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching submissions by assignment' };
        }
    },

    async getByUserId(ctx) {
        try {
            const { userId } = ctx.params;
            const submissions = await Submission.findAll({
                where: { userId },
                include: [
                    { model: Assignment, as: 'assignment', attributes: ['assignment_id', 'title', 'course_id'] }
                ]
            });
            ctx.body = await submissionUtils.getSubmissionsDocuments(submissions);



        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching submissions by user' };
        }
    },

    async getByAssignmentAndUser(ctx) {
        try {
            const { assignmentId, userId } = ctx.params;
            const submission = await Submission.findAll({
                where: { assignmentId, userId }
            });
            
            if (!submission) {
                ctx.status = 404;
                ctx.body = { error: 'Submission not found for this assignment and user' };
                return;
            }

            ctx.body = await submissionUtils.getSubmissionsDocuments(submission);
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching specific submission' };
        }
    },
};