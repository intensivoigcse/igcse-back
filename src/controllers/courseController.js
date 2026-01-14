const { Course, User } = require('../models');
const auth = require('../auth/auth');
module.exports = {
    async getAll(ctx) {
        try {   
            // Solo devolver cursos publicados y activos (para catálogo público)
            const courses = await Course.findAll({
                where: {
                    status: 'published',
                    is_active: true
                }
            });
            ctx.body = courses;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching courses' }; 
        }
    },

    async getById(ctx) {
        try{
            const course = await Course.findByPk(ctx.params.id);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }
            ctx.body = course;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching course' };
        }
    },

    async create(ctx) {
        try{
            const {
                title, 
                description, 
                objectives, 
                requirements,
                category,
                level,
                tags,
                duration_hours,
                start_date,
                end_date,
                max_students,
                modality,
                schedule,
                image_url,
                status,
                professor_id: bodyProfessorId
            } = ctx.request.body;
            
            const userRole = ctx.state.user.role;
            // Admin puede especificar profesor, de lo contrario usa el usuario autenticado
            const professor_id = (userRole === 'admin' && bodyProfessorId) 
                ? bodyProfessorId 
                : auth.getUserIdFromToken(ctx);

            // Validations - CAMPOS OBLIGATORIOS
            if (!title || title.length < 5 || title.length > 100) {
                ctx.status = 400;
                ctx.body = { error: 'Title must be between 5 and 100 characters' };
                return;
            }

            if (!description || description.length < 50) {
                ctx.status = 400;
                ctx.body = { error: 'Description must be at least 50 characters' };
                return;
            }

            if (!category || category.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Category is required' };
                return;
            }

            if (!level || !['primero', 'segundo', 'tercero', 'cuarto_medio'].includes(level)) {
                ctx.status = 400;
                ctx.body = { error: 'Level is required and must be one of: primero, segundo, tercero, cuarto_medio' };
                return;
            }

            // Validaciones opcionales
            if (max_students !== undefined && max_students !== null && max_students <= 0) {
                ctx.status = 400;
                ctx.body = { error: 'Max students must be greater than 0' };
                return;
            }

            if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
                ctx.status = 400;
                ctx.body = { error: 'End date must be after start date' };
                return;
            }

            const course = await Course.create({
                title, 
                description, 
                professor_id,
                objectives, 
                requirements,
                category,
                level,
                tags: tags || [],
                duration_hours,
                start_date,
                end_date,
                max_students,
                modality: modality || 'online',
                schedule,
                image_url,
                status: status || 'draft',
                is_active: true
            });
            
            ctx.status = 201;
            ctx.body = course;
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
                objectives, 
                requirements,
                category,
                level,
                tags,
                duration_hours,
                start_date,
                end_date,
                max_students,
                modality,
                schedule,
                image_url,
                status,
                is_active
            } = ctx.request.body;

            const course = await Course.findByPk(id);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            // Validations
            if (title !== undefined && (title.length < 5 || title.length > 100)) {
                ctx.status = 400;
                ctx.body = { error: 'Title must be between 5 and 100 characters' };
                return;
            }

            if (description !== undefined && description.length < 50) {
                ctx.status = 400;
                ctx.body = { error: 'Description must be at least 50 characters' };
                return;
            }

            if (category !== undefined && category.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Category cannot be empty' };
                return;
            }

            if (level !== undefined && !['primero', 'segundo', 'tercero', 'cuarto_medio'].includes(level)) {
                ctx.status = 400;
                ctx.body = { error: 'Level must be one of: primero, segundo, tercero, cuarto_medio' };
                return;
            }

            if (max_students !== undefined && max_students !== null && max_students <= 0) {
                ctx.status = 400;
                ctx.body = { error: 'Max students must be greater than 0' };
                return;
            }

            const updateData = {};
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (objectives !== undefined) updateData.objectives = objectives;
            if (requirements !== undefined) updateData.requirements = requirements;
            if (category !== undefined) updateData.category = category;
            if (level !== undefined) updateData.level = level;
            if (tags !== undefined) updateData.tags = tags;
            if (duration_hours !== undefined) updateData.duration_hours = duration_hours;
            if (start_date !== undefined) updateData.start_date = start_date;
            if (end_date !== undefined) updateData.end_date = end_date;
            if (max_students !== undefined) updateData.max_students = max_students;
            if (modality !== undefined) updateData.modality = modality;
            if (schedule !== undefined) updateData.schedule = schedule;
            if (image_url !== undefined) updateData.image_url = image_url;
            if (status !== undefined) updateData.status = status;
            if (is_active !== undefined) updateData.is_active = is_active;

            await course.update(updateData);
            ctx.body = course;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async remove(ctx) {
        try {
            const { id } = ctx.params;
            const course = await Course.findByPk(id);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            await course.destroy();
            ctx.status = 204; 
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error deleting course' };
        }
    },

    async getSessionProfessorCourses(ctx){

        try{
            const user = ctx.state.user;
            if (!user || !user.id) {
                ctx.status = 401;
                ctx.body = { error: 'User not authenticated' };
                return;
            }
            
            const courses = await Course.findAll({ where: { professor_id: user.id } });
            console.log(`Found ${courses.length} courses for professor ${user.id}`);
            ctx.body = courses;
        } catch (err) {
            console.error('Error in getSessionProfessorCourses:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching courses' };
        }
        
    },

    async getByProfessorId(ctx){

        try{
            const userId = ctx.params.id
            const user = await User.findByPk(userId);
            if (!user) {
                ctx.status = 404;
                ctx.body = { error: 'User not found' };
                return;
            }

            const courses = await Course.findAll({ where: { professor_id: userId } });
            ctx.body = courses;
        } catch (err) {

            ctx.status = 500;
            ctx.body = { error: 'Error fetching courses' };
        }
    }


};
