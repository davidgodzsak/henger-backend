// 'use strict';

const express = require('express');
const validateWorkshop = require('../validator/workshop-validator')
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require('crypto');

const BUCKET_NAME = process.env.BUCKET_NAME;
const DB_PATH = 'db';
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET = process.env.SECRET_ACCESS_KEY;

const router = express.Router();
const client = new S3Client({
    region: "eu-central-1",
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET
    }
});

const workshopS3Request = { Bucket: BUCKET_NAME, Key: `${DB_PATH}/workshops.json` };

// todo use direct read of workshops file in FE
router.get('/', async (_, res) => {
    let workshops;
    try {
        workshops = await getWorkshopsFromAws()
    } catch (e) {
        return res.status(500).json({ message: "AWS Error", error: e })
    };
    // filter for only relevant ones
    // workshops.filter();

    return res.json(workshops);
})

// todo protect
router.post('/', async (req, res) => {
    // validate if they sent a workshop
    if (!validateWorkshop(req.body)) {
        return res.status(400).json({ message: "Not a workshop" });
    }
    const workshop = { id: randomUUID(), ...req.body }

    let workshops;
    try {
        workshops = await getWorkshopsFromAws();
    } catch (e) {
        return res.status(500).json({ message: "AWS Error", error: e });
    }

    try {
        const props = { Body: JSON.stringify([...workshops, workshop]), ...workshopS3Request };
        const command = new PutObjectCommand(props);
        await client.send(command)
    } catch (e) {
        return res.status(500).json({ message: "Could not save the workshop!", error: e })
    }

    res.status(201).json({ message: "Added workshop!" })
})

router.delete('/:id', async (req, res) => {
    const workshops = await getWorkshopsFromAws()
        .catch(e => res.status(500).json({ message: "AWS Error", error: e }));
    const workshopsChanged = JSON.stringify(workshops.filter(it => it.id !== req.params.id))

    // todo delete all images for the workshop

    const command = new PutObjectCommand({ Body: workshopsChanged, ...workshopS3Request });
    await client.send(command)
        .catch(e => res.status(500).json({ message: "Could not save the workshop change!", error: e }));

    res.status(201).json({ message: "Added workshop!" })
})

// helpers
async function getWorkshopsFromAws() {
    const command = new GetObjectCommand(workshopS3Request);
    const response = await client.send(command);
    const bodyString = await response.Body.transformToString();
    return JSON.parse(bodyString)
}

module.exports = router