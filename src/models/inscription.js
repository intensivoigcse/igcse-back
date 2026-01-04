const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Inscription = sequelize.define('Inscription', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        enrollment_status: {
            type: DataTypes.ENUM('pending', 'active', 'dropped', 'expired'),
            allowNull: false,
            defaultValue: 'pending',
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'courses',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        paymentStatus: {
            type: DataTypes.ENUM('pending', 'paid', 'failed'),
            allowNull: false,
            defaultValue: 'pending',
        },
        paymentAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },


    }, {    
        tableName: 'inscriptions',
        timestamps: true,
    });


    Inscription.associate = (models) => {
        Inscription.belongsTo(models.User, { foreignKey: 'userId', as: 'student' });
        Inscription.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
    };


    return Inscription;
};
