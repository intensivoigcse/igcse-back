const { Announcement, User, Sequelize } = require('../models');
const { Op } = Sequelize;

const VALID_PRIORITIES = ['normal', 'important', 'urgent'];

/**
 * Formatea un anuncio para la respuesta API
 */
function formatAnnouncement(announcement) {
    const data = announcement.toJSON();
    return {
        announcement_id: data.id,
        course_id: data.courseId,
        author_id: data.authorId,
        author_name: data.author ? data.author.name : null,
        title: data.title,
        content: data.content,
        priority: data.priority,
        is_pinned: data.isPinned,
        created_at: data.created_at || data.createdAt,
        updated_at: data.updated_at || data.updatedAt
    };
}

module.exports = {
    /**
     * GET /announcements/course/:courseId
     * Listar anuncios de un curso
     */
    async getAnnouncementsByCourse(ctx) {
        try {
            const { courseId } = ctx.params;
            const { search } = ctx.query;

            const whereClause = { courseId };

            // Buscar en título o contenido
            if (search) {
                whereClause[Op.or] = [
                    { title: { [Op.like]: `%${search}%` } },
                    { content: { [Op.like]: `%${search}%` } }
                ];
            }

            const announcements = await Announcement.findAll({
                where: whereClause,
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email']
                }],
                order: [
                    [Sequelize.col('is_pinned'), 'DESC'],
                    [Sequelize.col('created_at'), 'DESC']
                ]
            });

            ctx.body = {
                announcements: announcements.map(formatAnnouncement)
            };
        } catch (err) {
            console.error('Error fetching announcements:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching announcements' };
        }
    },

    /**
     * POST /announcements
     * Crear anuncio
     */
    async createAnnouncement(ctx) {
        try {
            const { course_id, courseId, title, content, priority, is_pinned, isPinned } = ctx.request.body;
            const authorId = ctx.state.user.id;
            const finalCourseId = course_id || courseId;

            // Validaciones
            if (!title || title.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Title is required' };
                return;
            }

            if (title.length > 255) {
                ctx.status = 400;
                ctx.body = { error: 'Title must be at most 255 characters' };
                return;
            }

            if (!content || content.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Content is required' };
                return;
            }

            if (priority && !VALID_PRIORITIES.includes(priority)) {
                ctx.status = 400;
                ctx.body = { error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` };
                return;
            }

            const announcement = await Announcement.create({
                courseId: finalCourseId,
                authorId,
                title: title.trim(),
                content: content.trim(),
                priority: priority || 'normal',
                isPinned: is_pinned ?? isPinned ?? false
            });

            // Obtener con autor
            const createdAnnouncement = await Announcement.findByPk(announcement.id, {
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email']
                }]
            });

            ctx.status = 201;
            ctx.body = {
                announcement: formatAnnouncement(createdAnnouncement)
            };
        } catch (err) {
            console.error('Error creating announcement:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * PUT /announcements/:id
     * Actualizar anuncio
     */
    async updateAnnouncement(ctx) {
        try {
            const announcement = ctx.state.announcement;
            const { title, content, priority, is_pinned, isPinned } = ctx.request.body;

            // Validaciones
            if (title !== undefined) {
                if (title.trim() === '') {
                    ctx.status = 400;
                    ctx.body = { error: 'Title cannot be empty' };
                    return;
                }
                if (title.length > 255) {
                    ctx.status = 400;
                    ctx.body = { error: 'Title must be at most 255 characters' };
                    return;
                }
            }

            if (content !== undefined && content.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Content cannot be empty' };
                return;
            }

            if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
                ctx.status = 400;
                ctx.body = { error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` };
                return;
            }

            const updateData = {};
            if (title !== undefined) updateData.title = title.trim();
            if (content !== undefined) updateData.content = content.trim();
            if (priority !== undefined) updateData.priority = priority;
            if (is_pinned !== undefined) updateData.isPinned = is_pinned;
            if (isPinned !== undefined) updateData.isPinned = isPinned;

            await announcement.update(updateData);

            // Obtener actualizado con autor
            const updatedAnnouncement = await Announcement.findByPk(announcement.id, {
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email']
                }]
            });

            ctx.body = {
                announcement: formatAnnouncement(updatedAnnouncement)
            };
        } catch (err) {
            console.error('Error updating announcement:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * DELETE /announcements/:id
     * Eliminar anuncio
     */
    async deleteAnnouncement(ctx) {
        try {
            const announcement = ctx.state.announcement;

            await announcement.destroy();

            ctx.body = { message: 'Announcement deleted successfully' };
        } catch (err) {
            console.error('Error deleting announcement:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error deleting announcement' };
        }
    },

    /**
     * PATCH /announcements/:id/pin
     * Toggle pin
     */
    async togglePin(ctx) {
        try {
            const announcement = ctx.state.announcement;

            await announcement.update({ isPinned: !announcement.isPinned });

            // Obtener actualizado con autor
            const updatedAnnouncement = await Announcement.findByPk(announcement.id, {
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email']
                }]
            });

            ctx.body = {
                announcement: formatAnnouncement(updatedAnnouncement)
            };
        } catch (err) {
            console.error('Error toggling pin:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    }
};

