const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ForumThread = sequelize.define('ForumThread', {
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
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        category: {
            type: DataTypes.ENUM('Dudas', 'Recursos', 'Estudio', 'Proyectos', 'General'),
            allowNull: false,
            defaultValue: 'General',
        },
        isPinned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isLocked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        views: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        tableName: 'forum_threads',
        timestamps: true,
        indexes: [
            {
                fields: ['courseId']
            },
            {
                fields: ['userId']
            },
            {
                fields: ['category']
            },
            {
                fields: ['isPinned']
            }
        ]
    });

    ForumThread.associate = (models) => {
        ForumThread.belongsTo(models.Course, { 
            foreignKey: 'courseId', 
            as: 'course',
            onDelete: 'CASCADE'
        });
        ForumThread.belongsTo(models.User, { 
            foreignKey: 'userId', 
            as: 'user'
        });
        ForumThread.hasMany(models.ForumReply, { 
            foreignKey: 'threadId', 
            as: 'replies',
            onDelete: 'CASCADE'
        });
    };

    return ForumThread;
};

