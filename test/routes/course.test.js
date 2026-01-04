const request = require('supertest');
const app = require('../../src/app').app
const { User, Course, sequelize } = require('../../src/models');
const auth = require('../../src/auth/auth');

describe('Course ownership & authentication', () => {
    let ownerToken;
    let otherUserToken;
    let course;

    beforeEach(async () => {
        await sequelize.sync({ force: true });

        const owner = await User.create({
            name: 'Prof Owner',
            email: 'owner@example.com',
            password: '123456',
            role: 'professor'
        });
        const otherUser = await User.create({
            name: 'Student User',
            email: 'student@example.com',
            password: '123456',
            role: 'student'
        });

        ownerToken = auth.generateToken(owner);
        otherUserToken = auth.generateToken(otherUser);

        course = await Course.create({
            title: 'Intro to Testing',
            description: 'Learn Jest & Supertest with hands-on practice and plenty of examples to cover edge cases.',
            professor_id: owner.id,
            category: 'testing',
            level: 'primero',
            status: 'published',
            tags: ['jest', 'supertest'],
            modality: 'online'
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('allows the owner to update their course', async () => {
        const res = await request(app.callback())
            .patch(`/course/${course.id}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'Updated Title' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated Title');
    });

    test('denies access to another user updating the course', async () => {
        const res = await request(app.callback())
            .patch(`/course/${course.id}`)
            .set('Authorization', `Bearer ${otherUserToken}`)
            .send({ title: 'Hacked Title' });

        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Unauthorized/i);
    });

    test('denies update without token', async () => {
        const res = await request(app.callback())
            .patch(`/course/${course.id}`)
            .send({ title: 'Should Fail' });

        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/Authorization header missing/i);
    });


    test('allows the owner to delete their course', async () => {
        const res = await request(app.callback())
            .delete(`/course/${course.id}`)
            .set('Authorization', `Bearer ${ownerToken}`);

        expect(res.status).toBe(204);
    });

    test('denies acess to another user deleting the course', async () => {
        const res = await request(app.callback())
            .delete(`/course/${course.id}`)
            .set('Authorization', `Bearer ${otherUserToken}`);

        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Unauthorized/i);
    });

    test('denies student from creating a course', async () => {
        const res = await request(app.callback())
            .post('/course')
            .set('Authorization', `Bearer ${otherUserToken}`)
            .send({ title: 'New Course' });

        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Unauthorized/i);
    });
});
