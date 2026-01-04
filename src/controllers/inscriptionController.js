const { Inscription, Course, User } = require('../models');

module.exports = {
    async getAll(ctx) {
        try {
            const inscriptions = await Inscription.findAll({
                include: [
                    {
                        model: Course,
                        as: 'course',
                        attributes: ['id', 'title', 'description'],
                    },
                    {
                        model: User,
                        as: 'student',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
            });
            ctx.body = inscriptions;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching inscriptions' };
        }
    },

    async getById(ctx) {
        try {
            const { id } = ctx.params;
            const inscription = await Inscription.findByPk(id);

            if (!inscription) {
                ctx.status = 404;
                ctx.body = { error: 'Inscription not found' };
                return;
            }

            ctx.body = inscription;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching inscription' };
        }
    },

    async create(ctx) {
        try {
            const {
                userId,
                courseId,

            } = ctx.request.body;

            const inscription = await Inscription.create({
                userId,
                courseId
            });

            ctx.status = 201;
            ctx.body = inscription;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async update(ctx) {
        try {
            const { id } = ctx.params;
            const {
                enrollment_status,
                startDate,
                endDate,
                paymentStatus,
                paymentAmount,
            } = ctx.request.body;

            const inscription = await Inscription.findByPk(id);
            if (!inscription) {
                ctx.status = 404;
                ctx.body = { error: 'Inscription not found' };
                return;
            }

            await inscription.update({
                enrollment_status,
                startDate,
                endDate,
                paymentStatus,
                paymentAmount,
            });

            ctx.body = inscription;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async remove(ctx) {
        try {
            const { id } = ctx.params;
            const inscription = await Inscription.findByPk(id);
            if (!inscription) {
                ctx.status = 404;
                ctx.body = { error: 'Inscription not found' };
                return;
            }

            await inscription.destroy();
            ctx.status = 204;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error deleting inscription' };
        }
    },


    async getSessionUserInscriptions(ctx) {
        try {
            const userId = ctx.state.user.id;
            // Solo devolver inscripciones activas (estudiantes realmente inscritos)
            const inscriptions = await Inscription.findAll({
                where: { 
                    userId,
                    enrollment_status: 'active' // Solo inscripciones activas
                }, 
                include: [
                    {
                        model: Course,
                        as: 'course',
                        attributes: ['id', 'title', 'description'],
                    },
                ],
            });
            ctx.body = inscriptions;
        } catch (err) {
            console.log(err)
            ctx.status = 500;
            ctx.body = { error: 'Error fetching inscriptions' };
        }
    },

    async getCourseStudents(ctx) {
        try {
            const { courseId } = ctx.params;
            const userId = ctx.state.user.id;
            const userRole = ctx.state.user.role;
            
            // Verificar que el curso existe
            const course = await Course.findByPk(courseId);
            if (!course) {
                ctx.status = 404;
                ctx.body = { error: 'Course not found' };
                return;
            }

            // Verificar que el usuario es el profesor del curso (solo profesores pueden ver sus estudiantes)
            if (userRole === 'professor' && course.professor_id !== userId) {
                ctx.status = 403;
                ctx.body = { error: 'Forbidden: You can only view students from your own courses' };
                return;
            }

            // Obtener solo las inscripciones activas (estudiantes realmente inscritos)
            const inscriptions = await Inscription.findAll({
                where: { 
                    courseId: courseId,
                    enrollment_status: 'active' // Solo estudiantes activos
                },
                include: [
                    {
                        model: User,
                        as: 'student',
                        attributes: ['id', 'name', 'email'],
                    },
                ],
                order: [['createdAt', 'ASC']], // Ordenar por fecha de inscripción
            });

            ctx.body = { 
                courseId,
                totalStudents: inscriptions.length,
                inscriptions 
            };
        } catch (err) {
            console.error('Error fetching course students:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching course students' };
        }
    },
};
