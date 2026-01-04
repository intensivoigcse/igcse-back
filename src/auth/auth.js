const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtAuth(required = true) {
    return async (ctx, next) => {
        const authHeader = ctx.headers['authorization'];

        if (!authHeader) {
            if (required) {
                ctx.status = 401;
                ctx.body = { error: 'Authorization header missing' };
                return;
            } else {
                return next(); 
            }
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            ctx.status = 401;
            ctx.body = { error: 'Token missing' };
            return;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            ctx.state.user = decoded; 
            await next();
        } catch (err) {
            ctx.status = 403;
            console.log(err);
            ctx.body = { error: 'Invalid or expired token' };
        }
    };

}

function generateToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '2h' } 
    );
};

function getUserIdFromToken(ctx){
    const authHeader = ctx.headers['authorization'];
    if (!authHeader) {
        throw new Error('Authorization header missing');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new Error('Token missing');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;

};


function checkRole(role = 'student'){
    return async (ctx, next) => {

        const user = ctx.state.user;
        
        if (!user) {
                ctx.status = 404;
                ctx.body = { error: 'User not found' };
                return;
            }
        
        if (role == 'student'){
            await next();
            return;
        }

        if (user.role !== role) {
            ctx.status = 403;
            ctx.body = { error: 'Unauthorized' };
            return;
        }
        await next();
    };

}


module.exports = { jwtAuth, generateToken, getUserIdFromToken, checkRole};
