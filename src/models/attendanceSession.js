const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttendanceSession = sequelize.define('AttendanceSession', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        sessionDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        startTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        endTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
    }, {
        tableName: 'attendance_sessions',
        timestamps: true,
        indexes: [
            {
                fields: ['courseId']
            },
            {
                fields: ['sessionDate']
            }
        ]
    });

    AttendanceSession.associate = (models) => {
        AttendanceSession.belongsTo(models.Course, {
            foreignKey: 'courseId',
            as: 'course',
            onDelete: 'CASCADE'
        });
        AttendanceSession.hasMany(models.AttendanceRecord, {
            foreignKey: 'sessionId',
            as: 'records',
            onDelete: 'CASCADE'
        });
    };

    return AttendanceSession;
};

