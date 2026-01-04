const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Assignment = sequelize.define('Assignment', {
        assignment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'courses', 
                key: 'id',
            },
            onDelete: 'CASCADE', 
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        maxScore: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 10000
            },
            defaultValue: 100
        },

        due_date: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isFutureDate(value) {
                    if (new Date(value) <= new Date()) {
                        throw new Error('Due date must be set in the future.');
                    }
                }
            }
        },
    }, {
        tableName: 'assignments',
        timestamps: true,
    });

    Assignment.associate = (models) => {

        Assignment.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
        
    };

    return Assignment;
};