import sharp from "sharp";
import { randomUUID } from 'crypto';
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import send from './s3-client.mjs';

const BUCKET_NAME = process.env.BUCKET_NAME;
const UPLOAD_PATH = 'upload';

export async function dataUrlToWebp(dataUrlImage) {
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

export async function uploadToS3({ fileName, image }) {
    const command = new PutObjectCommand(imageS3Request(fileName, image));

    try {
        await send(command)
    } catch {
        throw new Error({ message: "Could not save the image!", error: e });
    }

    return UPLOAD_PATH + "/" + fileName;
}

export async function uploadManyToS3(items) {
    return await Promise.all(items.map(it => uploadToS3(it)))
}

export async function deleteImage(path) {
    const command = new DeleteObjectCommand({Bucket: BUCKET_NAME, Key: path});
    try {
        await send(command)
    } catch {
        throw new Error({ message: "Could not save the image!", error: e });
    }

    return true
}