const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Document = sequelize.define('Document', {
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
        folderId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'folders',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },


        fileUrl: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'https://placehold.co/600x400.png',
        },

        studentVisible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        }


    }, {
        tableName: 'documents',
        timestamps: true,
    });

    return Document;
};
