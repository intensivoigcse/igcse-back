const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = new S3Client({
    region: process.env.AWS_REGION,  // e.g. "us-east-1"
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});


async function uploadFileToS3(file, courseId){

    const key = `development/course:${courseId}/${Date.now()}--${file.originalname}`;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return {response, url};

}

async function deleteFileFromS3(fileUrl) {
    const key = extractS3KeyFromUrl(fileUrl);
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    };
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    return;
}


async function getSignedFileUrl(fileUrl) {

    const key = extractS3KeyFromUrl(fileUrl);

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
}

function extractS3KeyFromUrl(url) {
    try {
        const parsed = new URL(url);
        let key = parsed.pathname;

        if (key.startsWith('/')) {
            key = key.slice(1);
        }
        
        return decodeURIComponent(key);

    } catch (err) {
        console.error("Error extracting S3 Key:", err); 
        throw new Error('Invalid S3 URL format');
    }
}

async function addSignedFileUrlToDocument(document) {

    let plainDocument = document.toJSON();
    let signedFileUrl;
    try {
    signedFileUrl = await getSignedFileUrl(plainDocument.fileUrl);
    } catch (err) {
      signedFileUrl = null;
    }
    plainDocument.signedFileUrl = signedFileUrl;
    return plainDocument;
}

async function addSignedFileUrlsToDocuments(documents) {

    const signedDocuments = [];
    for (const document of documents) {
        const signedDocument = await addSignedFileUrlToDocument(document);
        signedDocuments.push(signedDocument);
    }
    return signedDocuments;
}


module.exports = {uploadFileToS3, getSignedFileUrl, addSignedFileUrlToDocument, addSignedFileUrlsToDocuments, deleteFileFromS3};
