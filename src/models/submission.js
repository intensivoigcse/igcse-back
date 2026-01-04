const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Submission = sequelize.define('Submission', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        assignmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'assignments',
                key: 'assignment_id',
            },
            onDelete: 'CASCADE',
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },

        comments: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        submissionDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'submissions',
        timestamps: true
    });

    Submission.associate = (models) => {

        Submission.belongsTo(models.User, { foreignKey: 'userId', as: 'student' });
        Submission.belongsTo(models.Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
        
    };

    return Submission;
};