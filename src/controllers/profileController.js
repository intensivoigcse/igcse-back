const { User } = require('../models');
const auth = require('../auth/auth');

module.exports = {
    async getProfile(ctx) {
        try {
            const userId = auth.getUserIdFromToken(ctx);
            const user = await User.findByPk(userId);
            if (!user) {
                ctx.status = 404;
                ctx.body = { error: 'User not found' };
                return;
            }
            ctx.body = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching profile:' + err.message };
        }
    }

};
