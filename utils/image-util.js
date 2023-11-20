const sharp = require("sharp");
const { randomUUID } = require('crypto');
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require('./s3-client')

const BUCKET_NAME = process.env.BUCKET_NAME;
const UPLOAD_PATH = 'upload';

async function dataUrlToWebp(dataUrlImage) {
    const base64image = dataUrlImage.substr(dataUrlImage.indexOf('base64') + 7)
    const imageBuffer = Buffer.from(base64image, 'base64')
    const fileName = `${randomUUID()}.webp`;

    const webp = await sharp(imageBuffer).webp({ quality: 20 }).toBuffer();

    return {
        image: webp,
        fileName
    }
}

const imageS3Request = (filename, body) => ({ Bucket: BUCKET_NAME, Key: `${UPLOAD_PATH}/${filename}`, Body: body });

async function uploadToS3({ fileName, image }) {
    const command = new PutObjectCommand(imageS3Request(fileName, image));

    try {
        await s3Client.send(command)
    } catch {
        throw new Error({ message: "Could not save the image!", error: e });
    }

    return UPLOAD_PATH + "/" + fileName;
}

async function uploadManyToS3(items) {
    return await Promise.all(items.map(it => uploadToS3(it)))
}

async function deleteImage(path) {
    const command = new DeleteObjectCommand({Bucket: BUCKET_NAME, Key: path});
    try {
        await s3Client.send(command)
    } catch {
        throw new Error({ message: "Could not save the image!", error: e });
    }

    return true
}

module.exports = { dataUrlToWebp, uploadToS3, uploadManyToS3 };