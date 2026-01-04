const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        role: {
            type: DataTypes.ENUM('student', 'professor', 'admin'),
            allowNull: false,
            defaultValue: 'student',
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    }, {
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },

        defaultScope: {
            attributes: { exclude: ['password'] },
        },
        scopes: {
            withPassword: { attributes: {} },
        }
    });

    User.prototype.validPassword = async function (password) {
        return bcrypt.compare(password, this.password);
    };

    User.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    };

    return User;
};
