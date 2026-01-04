const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Announcement = sequelize.define('Announcement', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'announcement_id'
        },
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'course_id',
            references: {
                model: 'courses',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'author_id',
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM('normal', 'important', 'urgent'),
            allowNull: false,
            defaultValue: 'normal',
        },
        isPinned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_pinned'
        },
    }, {
        tableName: 'announcements',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['course_id']
            },
            {
                fields: ['author_id']
            },
            {
                fields: ['is_pinned']
            },
            {
                fields: ['priority']
            }
        ]
    });

    Announcement.associate = (models) => {
        Announcement.belongsTo(models.Course, {
            foreignKey: 'courseId',
            as: 'course',
            onDelete: 'CASCADE'
        });
        Announcement.belongsTo(models.User, {
            foreignKey: 'authorId',
            as: 'author'
        });
    };

    return Announcement;
};

