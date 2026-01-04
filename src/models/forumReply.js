const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ForumReply = sequelize.define('ForumReply', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        threadId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'forum_threads',
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
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        tableName: 'forum_replies',
        timestamps: true,
        indexes: [
            {
                fields: ['threadId']
            },
            {
                fields: ['userId']
            }
        ]
    });

    ForumReply.associate = (models) => {
        ForumReply.belongsTo(models.ForumThread, { 
            foreignKey: 'threadId', 
            as: 'thread',
            onDelete: 'CASCADE'
        });
        ForumReply.belongsTo(models.User, { 
            foreignKey: 'userId', 
            as: 'user'
        });
    };

    return ForumReply;
};

