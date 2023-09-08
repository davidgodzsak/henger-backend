'use strict';

const express = require('express');
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require('crypto');
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");

const router = express.Router();
const client = new S3Client();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const BUCKET_NAME = process.env.BUCKET_NAME;
const DB_PATH = 'db';
const UPLOAD_PATH = 'upload';
const HENGER_URL = 'https://henger.studio'

const workshopS3Request = { Bucket: BUCKET_NAME, Key: `${DB_PATH}/workshops.json` };
const imageS3Request = (filename, body) => ({ Bucket: BUCKET_NAME, Key: `${UPLOAD_PATH}/${filename}`, Body: body });

// todo use direct read of workshops file in FE
router.get('/', async (req, res) => {
    const workshops = await getWorkshopsFromAws()
        .catch(e => res.status(500).json({ message: "AWS Error", error: e }));

    // filter for only relevant ones
    // workshops.filter();

    return res.json(workshops);
})

// todo protect
router.post('/', async (req, res) => {
    console.log(req.body);

    // validate if they sent a workshop
    if (!isWorkshop(req.body)) {
        return res.status(400).json({ message: "Not a workshop" });
    }

    const workshops = await getWorkshopsFromAws()
        .catch(e => res.status(500).json({ message: "AWS Error", error: e }));

    const command = PutObjectCommand({ Body: [...workshops, req.body], ...workshopS3Request });
    await client.send(command)
        .catch(e => res.status(500).json({ message: "Could not save the image!", error: e }));

    res.status(201).json({ message: "Added workshop!" })
})

// helpers
function isWorkshop(request) {
    const hasTitle = "";
    return hasTitle;
}

async function getWorkshopsFromAws() {
    const command = new GetObjectCommand(workshopS3Request);
    return await client.send(command)
        .then(async (it) => await readBodyToJson(it))
}

function readBodyToJson(it) {
    return it.Body.transformToString().then(b => JSON.parse(b));
}

module.exports = router