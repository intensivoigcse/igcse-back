const { ForumThread, ForumReply, User, Sequelize } = require('../models');
const { Op } = Sequelize;

const VALID_CATEGORIES = ['Dudas', 'Recursos', 'Estudio', 'Proyectos', 'General'];

module.exports = {
    /**
     * GET /forums/course/:courseId
     * Obtener todos los hilos de un curso
     */
    async getThreadsByCourse(ctx) {
        try {
            const { courseId } = ctx.params;
            const { category, search } = ctx.query;

            const whereClause = { courseId };

            // Filtrar por categoria si se proporciona
            if (category && VALID_CATEGORIES.includes(category)) {
                whereClause.category = category;
            }

            // Buscar por texto en titulo o contenido
            if (search) {
                whereClause[Op.or] = [
                    { title: { [Op.like]: `%${search}%` } },
                    { content: { [Op.like]: `%${search}%` } }
                ];
            }

            const threads = await ForumThread.findAll({
                where: whereClause,
                include: [
                    { 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ],
                order: [
                    ['isPinned', 'DESC'],
                    ['createdAt', 'DESC']
                ],
                attributes: {
                    include: [
                        [
                            Sequelize.literal('(SELECT COUNT(*) FROM "forum_replies" WHERE "forum_replies"."threadId" = "ForumThread"."id")'),
                            'replyCount'
                        ]
                    ]
                }
            });

            // Formatear respuesta con _count
            const formattedThreads = threads.map(thread => {
                const threadData = thread.toJSON();
                return {
                    id: threadData.id,
                    title: threadData.title,
                    content: threadData.content,
                    category: threadData.category,
                    isPinned: threadData.isPinned,
                    isLocked: threadData.isLocked,
                    views: threadData.views,
                    createdAt: threadData.createdAt,
                    user: threadData.user,
                    _count: {
                        replies: parseInt(threadData.replyCount) || 0
                    }
                };
            });

            ctx.body = formattedThreads;
        } catch (err) {
            console.error('Error fetching threads:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching threads' };
        }
    },

    /**
     * GET /forums/thread/:id
     * Obtener un hilo con todas sus respuestas
     */
    async getThreadById(ctx) {
        try {
            const { id } = ctx.params;

            const thread = await ForumThread.findByPk(id, {
                include: [
                    { 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: ForumReply,
                        as: 'replies',
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['id', 'name', 'email']
                            }
                        ],
                        order: [['createdAt', 'ASC']]
                    }
                ]
            });

            if (!thread) {
                ctx.status = 404;
                ctx.body = { error: 'Thread not found' };
                return;
            }

            // Incrementar views
            await thread.increment('views');

            // Formatear respuesta
            const threadData = thread.toJSON();
            ctx.body = {
                id: threadData.id,
                title: threadData.title,
                content: threadData.content,
                category: threadData.category,
                isPinned: threadData.isPinned,
                isLocked: threadData.isLocked,
                views: threadData.views + 1, // Reflejar el incremento
                createdAt: threadData.createdAt,
                updatedAt: threadData.updatedAt,
                user: threadData.user,
                replies: threadData.replies.map(reply => ({
                    id: reply.id,
                    content: reply.content,
                    createdAt: reply.createdAt,
                    user: reply.user
                }))
            };
        } catch (err) {
            console.error('Error fetching thread:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error fetching thread' };
        }
    },

    /**
     * POST /forums/thread
     * Crear nuevo hilo
     */
    async createThread(ctx) {
        try {
            const { courseId, title, content, category } = ctx.request.body;
            const userId = ctx.state.user.id;

            // Validaciones
            if (!courseId) {
                ctx.status = 400;
                ctx.body = { error: 'courseId is required' };
                return;
            }

            if (!title || title.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Title is required' };
                return;
            }

            if (title.length > 200) {
                ctx.status = 400;
                ctx.body = { error: 'Title must be at most 200 characters' };
                return;
            }

            if (!content || content.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Content is required' };
                return;
            }

            if (category && !VALID_CATEGORIES.includes(category)) {
                ctx.status = 400;
                ctx.body = { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` };
                return;
            }

            const thread = await ForumThread.create({
                courseId,
                userId,
                title: title.trim(),
                content: content.trim(),
                category: category || 'General',
                isPinned: false,
                isLocked: false,
                views: 0
            });

            // Obtener el hilo con el usuario
            const createdThread = await ForumThread.findByPk(thread.id, {
                include: [
                    { 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            ctx.status = 201;
            ctx.body = createdThread;
        } catch (err) {
            console.error('Error creating thread:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * PATCH /forums/thread/:id
     * Editar hilo
     */
    async updateThread(ctx) {
        try {
            const thread = ctx.state.thread;
            const { title, content, category } = ctx.request.body;

            // Validaciones
            if (title !== undefined) {
                if (title.trim() === '') {
                    ctx.status = 400;
                    ctx.body = { error: 'Title cannot be empty' };
                    return;
                }
                if (title.length > 200) {
                    ctx.status = 400;
                    ctx.body = { error: 'Title must be at most 200 characters' };
                    return;
                }
            }

            if (content !== undefined && content.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Content cannot be empty' };
                return;
            }

            if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
                ctx.status = 400;
                ctx.body = { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` };
                return;
            }

            const updateData = {};
            if (title !== undefined) updateData.title = title.trim();
            if (content !== undefined) updateData.content = content.trim();
            if (category !== undefined) updateData.category = category;

            await thread.update(updateData);

            // Obtener el hilo actualizado con el usuario
            const updatedThread = await ForumThread.findByPk(thread.id, {
                include: [
                    { 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            ctx.body = updatedThread;
        } catch (err) {
            console.error('Error updating thread:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * DELETE /forums/thread/:id
     * Eliminar hilo y sus respuestas
     */
    async deleteThread(ctx) {
        try {
            const thread = ctx.state.thread;

            await thread.destroy();

            ctx.body = { message: 'Thread deleted' };
        } catch (err) {
            console.error('Error deleting thread:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error deleting thread' };
        }
    },

    /**
     * PATCH /forums/thread/:id/pin
     * Fijar o desfijar un hilo
     */
    async pinThread(ctx) {
        try {
            const thread = ctx.state.thread;
            const { isPinned } = ctx.request.body;

            if (typeof isPinned !== 'boolean') {
                ctx.status = 400;
                ctx.body = { error: 'isPinned must be a boolean' };
                return;
            }

            await thread.update({ isPinned });

            const updatedThread = await ForumThread.findByPk(thread.id, {
                include: [
                    { 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            ctx.body = updatedThread;
        } catch (err) {
            console.error('Error pinning thread:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * PATCH /forums/thread/:id/lock
     * Bloquear o desbloquear un hilo
     */
    async lockThread(ctx) {
        try {
            const thread = ctx.state.thread;
            const { isLocked } = ctx.request.body;

            if (typeof isLocked !== 'boolean') {
                ctx.status = 400;
                ctx.body = { error: 'isLocked must be a boolean' };
                return;
            }

            await thread.update({ isLocked });

            const updatedThread = await ForumThread.findByPk(thread.id, {
                include: [
                    { 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            ctx.body = updatedThread;
        } catch (err) {
            console.error('Error locking thread:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * POST /forums/thread/:id/reply
     * Crear respuesta en un hilo
     */
    async createReply(ctx) {
        try {
            const thread = ctx.state.thread;
            const { content } = ctx.request.body;
            const userId = ctx.state.user.id;

            if (!content || content.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Content is required' };
                return;
            }

            const reply = await ForumReply.create({
                threadId: thread.id,
                userId,
                content: content.trim()
            });

            // Obtener la respuesta con el usuario
            const createdReply = await ForumReply.findByPk(reply.id, {
                include: [
                    { 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            ctx.status = 201;
            ctx.body = createdReply;
        } catch (err) {
            console.error('Error creating reply:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * PATCH /forums/reply/:id
     * Editar respuesta
     */
    async updateReply(ctx) {
        try {
            const reply = ctx.state.reply;
            const { content } = ctx.request.body;

            if (!content || content.trim() === '') {
                ctx.status = 400;
                ctx.body = { error: 'Content is required' };
                return;
            }

            await reply.update({ content: content.trim() });

            const updatedReply = await ForumReply.findByPk(reply.id, {
                include: [
                    { 
                        model: User, 
                        as: 'user',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            ctx.body = updatedReply;
        } catch (err) {
            console.error('Error updating reply:', err);
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    /**
     * DELETE /forums/reply/:id
     * Eliminar respuesta
     */
    async deleteReply(ctx) {
        try {
            const reply = ctx.state.reply;

            await reply.destroy();

            ctx.body = { message: 'Reply deleted' };
        } catch (err) {
            console.error('Error deleting reply:', err);
            ctx.status = 500;
            ctx.body = { error: 'Error deleting reply' };
        }
    }
};

