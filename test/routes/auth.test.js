const request = require('supertest');
const { sequelize } = require('../../src/models');
const app = require('../../src/app').app;

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'student'
            };

            const res = await request(app.callback())
                .post('/auth/register')
                .send(userData)
                .expect(201);

            expect(res.body).toHaveProperty('token');
            expect(typeof res.body.token).toBe('string');
        });

        it('should not allow registering with admin role', async () => {
            const userData = {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin'
            };

            const res = await request(app.callback())
                .post('/auth/register')
                .send(userData)
                .expect(400);

            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toContain('Admin role is reserved');
        });

        it('should return error for invalid email', async () => {
            const userData = {
                name: 'Invalid Email',
                email: 'invalid-email',
                password: 'password123',
                role: 'student'
            };

            const res = await request(app.callback())
                .post('/auth/register')
                .send(userData)
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        it('should return error for missing required fields', async () => {
            const userData = {
                name: 'Missing Fields',
                email: 'missing@example.com'
                // missing password
            };

            const res = await request(app.callback())
                .post('/auth/register')
                .send(userData)
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /auth/login', () => {
        beforeAll(async () => {
            // Create a test user for login
            await request(app.callback())
                .post('/auth/register')
                .send({
                    name: 'Login User',
                    email: 'login@example.com',
                    password: 'password123',
                    role: 'student'
                });
        });

        it('should login successfully with correct credentials', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'password123'
            };

            const res = await request(app.callback())
                .post('/auth/login')
                .send(loginData)
                .expect(200);

            expect(res.body).toHaveProperty('token');
            expect(typeof res.body.token).toBe('string');
        });

        it('should return error for non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            const res = await request(app.callback())
                .post('/auth/login')
                .send(loginData)
                .expect(401);

            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBe('User not found');
        });

        it('should return error for incorrect password', async () => {
            const loginData = {
                email: 'login@example.com',
                password: 'wrongpassword'
            };

            const res = await request(app.callback())
                .post('/auth/login')
                .send(loginData)
                .expect(401);

            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBe('Invalid password');
        });
    });
});
