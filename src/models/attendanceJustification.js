const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttendanceJustification = sequelize.define('AttendanceJustification', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        recordId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'attendance_records',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
        professorNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'attendance_justifications',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['recordId']
            },
            {
                fields: ['status']
            }
        ]
    });

    AttendanceJustification.associate = (models) => {
        AttendanceJustification.belongsTo(models.AttendanceRecord, {
            foreignKey: 'recordId',
            as: 'record',
            onDelete: 'CASCADE'
        });
    };

    return AttendanceJustification;
};

