const { Document, SubmissionDocument, Folder } = require('../../models');
const s3_upload = require('../../file_upload_utils/s3_upload');

module.exports = {

    async getSubmissionDocuments(submissionId) {
        const submissionDocuments = await SubmissionDocument.findAll({
            where: { submissionId }
        });

        const documents = [];

        for (const sd of submissionDocuments) {
            const document = await Document.findByPk(sd.documentId);
            const signed = await s3_upload.addSignedFileUrlToDocument(document);
            documents.push(signed);
        }

        return documents;
    },


    async getSubmissionsDocuments(submissions){

        let submissionsWithDocuments = [];

        for (const submission of submissions) {

            const documents = await this.getSubmissionDocuments(submission.id);
            submissionsWithDocuments.push({ submission, documents });

        }

        return submissionsWithDocuments

    },


    async getOrCreateSubmissionFolder(courseId, userId) {
        const name = `Submission ${userId}`;

        let folder = await Folder.findOne({
            where: { courseId, parentFolderId: null, name }
        });

        if (!folder) {
            folder = await Folder.create({
                courseId,
                parentFolderId: null,
                name,
                studentVisible: false
            });
        }

        return folder;
    },

    async uploadSubmissionFiles(files, courseId, submissionId, folderId) {
        const uploadedDocs = [];

        for (const file of files) {
            const { response, url } = await s3_upload.uploadFileToS3(file, courseId);

            if (!response) {
                throw new Error('Error uploading file to S3');
            }

            const document = await Document.create({
                courseId,
                folderId,
                name: file.originalname,
                fileUrl: url,
                studentVisible: false
            });

            await SubmissionDocument.create({
                submissionId,
                documentId: document.id
            });

            const signed = await s3_upload.addSignedFileUrlToDocument(document);
            uploadedDocs.push(signed);
        }

        return uploadedDocs;
    }
};
