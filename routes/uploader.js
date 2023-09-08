'use strict';

const express = require('express');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require('crypto');
const multer = require("multer");
const sharp = require("sharp");

const router = express.Router();
const client = new S3Client();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const BUCKET_NAME = process.env.BUCKET_NAME;
const UPLOAD_PATH = 'upload';
const HENGER_URL = 'https://henger.studio'

const imageS3Request = (filename, body) => ({ Bucket: BUCKET_NAME, Key: `${UPLOAD_PATH}/${filename}`, Body: body });

// todo alow multiple file upload
router.post('/image', upload.single('image'), async (req, res) => {
    const fileName = `${randomUUID()}.webp`;
    const image = await sharp(req.file.buffer).webp({ quality: 20 }).toBuffer();

    const command = new PutObjectCommand(imageS3Request(fileName, image));

    try {
        await client.send(command)
    } catch {
        return res.status(500).json({ message: "Could not save the image!", error: e });
    }
    const path = UPLOAD_PATH + "/" + fileName

    res.status(201).json({ url: HENGER_URL + "/" + path, path })
})

router.delete("/:filePath", async (req, res) => {
    const path = decodeURIComponent(req.params.filePath)

    const command = new DeleteObjectCommand({Bucket: BUCKET_NAME, Key: path});
    try {
        await client.send(command)
    } catch {
        return res.status(500).json({ message: "Could not save the image!", error: e });
    }

    res.status(200).json({message: "Deleted!"})
})

module.exports = router