const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SubmissionDocument = sequelize.define('SubmissionDocument', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        submissionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'submissions',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        documentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'documents',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
    }, {
        tableName: 'submissionDocuments',
        timestamps: true
    });

    SubmissionDocument.associate = (models) => {
        SubmissionDocument.belongsTo(models.Submission, { foreignKey: 'submissionId' });
        SubmissionDocument.belongsTo(models.Document, { foreignKey: 'documentId' });
    };

    return SubmissionDocument;
};