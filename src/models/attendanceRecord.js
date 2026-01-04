const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttendanceRecord = sequelize.define('AttendanceRecord', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        sessionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'attendance_sessions',
                key: 'id',
            },
            onDelete: 'CASCADE',
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
        status: {
            type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
            allowNull: false,
            defaultValue: 'absent',
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'attendance_records',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['sessionId', 'userId']
            },
            {
                fields: ['sessionId']
            },
            {
                fields: ['userId']
            },
            {
                fields: ['status']
            }
        ]
    });

    AttendanceRecord.associate = (models) => {
        AttendanceRecord.belongsTo(models.AttendanceSession, {
            foreignKey: 'sessionId',
            as: 'session',
            onDelete: 'CASCADE'
        });
        AttendanceRecord.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        AttendanceRecord.hasOne(models.AttendanceJustification, {
            foreignKey: 'recordId',
            as: 'justification',
            onDelete: 'CASCADE'
        });
    };

    return AttendanceRecord;
};

