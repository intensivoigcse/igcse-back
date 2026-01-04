const { Document } = require('../models');
const s3_upload = require('../file_upload_utils/s3_upload');
module.exports = {
    async getAll(ctx) {
        try {
            const documents = await Document.findAll();
            const signedDocuments = await s3_upload.addSignedFileUrlsToDocuments(documents);
            ctx.body = signedDocuments;

        } catch (err) {
            console.log(err)
            ctx.status = 500;
            ctx.body = { error: 'Error fetching documents' };
        }
    },

    async getById(ctx) {
        try {
            const document = await Document.findByPk(ctx.params.id);
            if (!document) {
                ctx.status = 404;
                ctx.body = { error: 'Document not found' };
                return;
            }
            const signedDocument = await s3_upload.addSignedFileUrlToDocument(document);
            ctx.body = signedDocument;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching document' };
        }
    },

    async getRootDocuments(ctx) {
        try {
            const { courseId } = ctx.params;
            const documents = await Document.findAll({ where: { courseId: courseId, folderId: null } });
            const signedDocuments = await s3_upload.addSignedFileUrlsToDocuments(documents);
            ctx.body = signedDocuments;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching root documents' };
        }
    },


    async uploadDocument(ctx) {
        try {
            const { courseId, folderId, studentVisible } = ctx.request.body;
            const file = ctx.request.file;

            if (!file) {
                ctx.status = 400;
                ctx.body = { error: 'No file uploaded' };
                return;
            }

            const { response, url } = await s3_upload.uploadFileToS3(file, courseId);
            if (!response) {
                ctx.status = 500;
                ctx.body = { error: 'Error uploading file to S3' };
                return;
            }

            const document = await Document.create({
                courseId,
                folderId: folderId || null,
                name: file.originalname,
                fileUrl: url,
                studentVisible: studentVisible !== undefined ? studentVisible : true
            });

            const signedDocument = await s3_upload.addSignedFileUrlToDocument(document);

            ctx.status = 201;
            ctx.body = {
                message: 'File received successfully',
                fileInfo: {
                    name: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size
                },
                document: signedDocument
            };
        } catch (err) {
            console.error(err);
            ctx.status = 500;
            ctx.body = { error: 'Error handling uploaded document' };
        }
    },



    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { name, studentVisible, folderId } = ctx.request.body;

            const document = await Document.findByPk(id);
            if (!document) {
                ctx.status = 404;
                ctx.body = { error: 'Document not found' };
                return;
            }

            await document.update({ name, studentVisible, folderId });
            const signedDocument = await s3_upload.addSignedFileUrlToDocument(document);
            ctx.body = signedDocument;
        } catch (err) {
            ctx.status = 400;
            ctx.body = { error: err.message };
        }
    },

    async remove(ctx) {
        // falta agregar lógica para eliminar en la s3
        try {
            const { id } = ctx.params;
            const document = await Document.findByPk(id);
            if (!document) {
                ctx.status = 404;
                ctx.body = { error: 'Document not found' };
                return;
            }

            await s3_upload.deleteFileFromS3(document.fileUrl);

            await document.destroy();
            ctx.status = 204;
        } catch (err) {
            console.error(err);
            ctx.status = 500;
            ctx.body = { error: 'Error deleting document' };
        }
    },

    async getByFolderId(ctx) {
        try {
            const { folderId } = ctx.params;
            const documents = await Document.findAll({ where: { folderId } });
            const signedDocuments = await s3_upload.addSignedFileUrlsToDocuments(documents);
            ctx.body = signedDocuments;
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: 'Error fetching documents for folder' };
        }
    }
};
