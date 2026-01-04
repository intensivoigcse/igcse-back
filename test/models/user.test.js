const { sequelize, User } = require('../../src/models');

describe('User Model', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should create a user with valid data', async () => {
        const userData = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            role: 'student'
        };

        const user = await User.create(userData);
        expect(user.id).toBeDefined();
        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.role).toBe(userData.role);
        expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should hash password before creating', async () => {
        const user = await User.create({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'password123'
        });

        expect(user.password).not.toBe('password123');
        expect(user.password.length).toBeGreaterThan(10); // Hashed password is longer
    });

    it('should validate email format', async () => {
        await expect(User.create({
            name: 'Invalid Email',
            email: 'invalid-email',
            password: 'password123'
        })).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
        await User.create({
            name: 'User1',
            email: 'unique@example.com',
            password: 'password123'
        });

        await expect(User.create({
            name: 'User2',
            email: 'unique@example.com',
            password: 'password456'
        })).rejects.toThrow();
    });

    it('should default role to student', async () => {
        const user = await User.create({
            name: 'Default Role',
            email: 'default@example.com',
            password: 'password123'
        });

        expect(user.role).toBe('student');
    });

    it('should validate password is required', async () => {
        await expect(User.create({
            name: 'No Password',
            email: 'nopass@example.com'
        })).rejects.toThrow();
    });

    it('should validate validPassword method', async () => {
        const user = await User.create({
            name: 'Valid Pass',
            email: 'validpass@example.com',
            password: 'correctpassword'
        });

        const isValid = await user.validPassword('correctpassword');
        expect(isValid).toBe(true);

        const isInvalid = await user.validPassword('wrongpassword');
        expect(isInvalid).toBe(false);
    });

    it('should hash password on update', async () => {
        const user = await User.create({
            name: 'Update Pass',
            email: 'updatepass@example.com',
            password: 'oldpassword'
        });

        const oldHash = user.password;
        user.password = 'newpassword';
        await user.save();

        expect(user.password).not.toBe('newpassword');
        expect(user.password).not.toBe(oldHash);

        const isValid = await user.validPassword('newpassword');
        expect(isValid).toBe(true);
    });
});
