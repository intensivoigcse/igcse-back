const { User } = require('../models');

module.exports = {
    async getAll(ctx) {
        try {
            const users = await User.findAll();
            ctx.body = users;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching users' };
        }
    },

    async getById(ctx) {
        try {
            const user = await User.findByPk(ctx.params.id);
            if (!user) {
                ctx.status = 404;
                ctx.body = { error: 'User not found' };
                return;
            }
            ctx.body = user;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching user' };
        }
    },

    async create(ctx) {
        try {
            const { name, email, role, password } = ctx.request.body;
            const user = await User.create({ name, email, role, password });
            ctx.status = 201;
            ctx.body = user;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { name, email, role, password } = ctx.request.body;

            const user = await User.findByPk(id);
            if (!user) {
                ctx.status = 404;
                ctx.body = { error: 'User not found' };
                return;
            }

            await user.update({ name, email, role, password });
            ctx.body = user;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async remove(ctx) {
        try {
            const { id } = ctx.params;
            const user = await User.findByPk(id);
            if (!user) {
                ctx.status = 404;
                ctx.body = { error: 'User not found' };
                return;
            }

            await user.destroy();
            ctx.status = 204; 
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error deleting user' };
        }
    },
};
