const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Folder = sequelize.define('Folder', {
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
        parentFolderId: {
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
        studentVisible: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        }


    }, {
        tableName: 'folders',
        timestamps: true,
    });

    return Folder;
};
