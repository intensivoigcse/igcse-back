const { Assignment } = require('../models');
module.exports = {
    async getAll(ctx) {
        try {  
            const assignments = await Assignment.findAll();
            ctx.body = assignments;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching assignments' }; 
        }
    },

    async getById(ctx) {
        try{
            const assignment = await Assignment.findByPk(ctx.params.id);
            if (!assignment) {
                ctx.status = 404;
                ctx.body = { error: 'Assignment not found' };
                return;
            }
            ctx.body = assignment;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching assignment' };
        }
    },

    async getByCourseId(ctx) {
        try{
            const { courseId } = ctx.params;
            const assignments = await Assignment.findAll({ where: { course_id: courseId } });
            ctx.body = assignments;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching assignments' };
        }
    },

    async create(ctx) {
        try{
            const {
                course_id, 
                title, 
                description, 
                due_date,
                maxScore 
            } = ctx.request.body;
            
            
            if (!course_id || isNaN(parseInt(course_id))) {
                ctx.status = 400;
                ctx.body = { error: 'Valid course_id is required' };
                return;
            }

            if (!title || title.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Title is required' };
                return;
            }

            if (!due_date || isNaN(new Date(due_date))) {
                ctx.status = 400;
                ctx.body = { error: 'Valid due_date is required' };
                return;
            }
            
            if (maxScore === undefined || isNaN(parseInt(maxScore)) || parseInt(maxScore) <= 0) {
                ctx.status = 400;
                ctx.body = { error: 'A valid maxScore (greater than 0) is required' };
                return;
            }


            const assignment = await Assignment.create({
                course_id, 
                title, 
                description, 
                due_date,
                maxScore 
            });
            
            ctx.status = 201;
            ctx.body = assignment;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { 
                title, 
                description, 
                due_date,
                maxScore, 
            } = ctx.request.body; 

            const assignment = await Assignment.findByPk(id);
            if (!assignment) {
                ctx.status = 404;
                ctx.body = { error: 'Assignment not found' };
                return;
            }

            const updateData = {};
            
            if (title !== undefined) {
                if (title.trim() === '') {
                    ctx.status = 400;
                    ctx.body = { error: 'Title cannot be empty' };
                    return;
                }
                updateData.title = title;
            }
            
            if (description !== undefined) updateData.description = description;
            
            if (due_date !== undefined) {
                if (isNaN(new Date(due_date))) {
                    ctx.status = 400;
                    ctx.body = { error: 'Invalid due_date format' };
                    return;
                }
                updateData.due_date = due_date;
            }

            if (maxScore !== undefined) {
                 const parsedMaxScore = parseInt(maxScore);
                 if (isNaN(parsedMaxScore) || parsedMaxScore <= 0) {
                    ctx.status = 400;
                    ctx.body = { error: 'Invalid maxScore format. Must be a number greater than 0.' };
                    return;
                 }
                 updateData.maxScore = parsedMaxScore;
            }

            await assignment.update(updateData);
            ctx.body = assignment;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async remove(ctx) {
        try {
            const { id } = ctx.params;
            const deletedCount = await Assignment.destroy({
                where: { assignment_id: id },
            });
            
            if (deletedCount === 0) {
                ctx.status = 404;
                ctx.body = { error: 'Assignment not found' };
                return;
            }

            ctx.status = 204; 
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error deleting assignment' };
        }
    }
};