const { User } = require('../models');
const auth = require('../auth/auth');
const { ValidationError, UniqueConstraintError } = require('sequelize');
module.exports = {
    async register(ctx) {
        try {
            const { name, email, password, role } = ctx.request.body;
            if (role === 'admin') {
            ctx.status = 400;
            ctx.body = { error: 'Admin role is reserved' };
            return;
            }

            const user = await User.create({ name, email, password, role });
            
           

            ctx.status = 201;
            const jwt = auth.generateToken(user);
            
            ctx.body = { token: jwt, id: user.id , role: user.role };
        } catch (err) {
            if (err instanceof UniqueConstraintError) {
                ctx.status = 400;
                ctx.body = { error: 'Email already exists' };
            } else if (err instanceof ValidationError) {
                ctx.status = 400;
                ctx.body = { error: err.message };
            } else {
                console.error('Unexpected error:', err);
                ctx.status = 500;
                ctx.body = { error: 'Internal server error' };
            }
        }
    },

    async login(ctx) {
        try {
            const { email, password } = ctx.request.body;
            const user = await User.scope("withPassword").findOne({ where: { email } });
            if (!user) {
                ctx.status = 401;
                ctx.body = { error: 'User not found' };
                return;
            }

            const isValid = await user.validPassword(password);
            if (!isValid) {
                ctx.status = 401;
                ctx.body = { error: 'Invalid password' };
                return;
            }

            const jwt = auth.generateToken(user);
            ctx.body = { token: jwt, id: user.id, role: user.role};
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: "Error logging in:" + err.message };
        }
    }

};
