// 'use strict';

const express = require('express');
const { randomUUID } = require('crypto');
const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { dataUrlToWebp, uploadToS3, uploadManyToS3 } = require('../utils/image-util');
const s3Client = require('../utils/s3-client');
const validateWorkshop = require('../validator/workshop-validator')

const BUCKET_NAME = process.env.BUCKET_NAME;
const DB_PATH = 'db';
const HENGER_URL = 'https://henger.studio/'

const router = express.Router();

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

    // load existing workshops
    let workshops;
    try {
        workshops = await getWorkshopsFromAws();
    } catch (e) {
        return res.status(500).json({ message: "Could not load existing workshops!", error: e });
    }

    // upload images
    let coverUrl;
    let galleryUrls;
    try {
        coverUrl = await uploadToS3(await dataUrlToWebp(req.body.cover));
        galleryUrls = await uploadManyToS3(await Promise.all(req.body.gallery.map(it => dataUrlToWebp(it))));
    } catch {
        return res.status(500).json({ message: "Cold not save images", error: e });
    }

    // save workshop
    try {
        const workshop = { id: randomUUID(), ...req.body, cover: HENGER_URL + coverUrl, gallery: galleryUrls.map(it => HENGER_URL + it) }
        const props = { Body: JSON.stringify([...workshops, workshop]), ...workshopS3Request };
        const command = new PutObjectCommand(props);
        await s3Client.send(command)
    } catch (e) {
        return res.status(500).json({ message: "Could not save the workshop!", error: e })
    }

    res.status(201).json({ message: "Added workshop!" })
})

router.delete('/:id', async (req, res) => {
    const workshops = await getWorkshopsFromAws()
        .catch(e => res.status(500).json({ message: "Could not load existing workshops!", error: e }));
    const workshopsChanged = JSON.stringify(workshops.filter(it => it.id !== req.params.id))

    // todo delete all images for the workshop

    const command = new PutObjectCommand({ Body: workshopsChanged, ...workshopS3Request });
    await s3Client.send(command)
        .catch(e => res.status(500).json({ message: "Could not save the workshop change!", error: e }));

    res.status(201).json({ message: "Deleted workshop!" })
})

// helpers
async function getWorkshopsFromAws() {
    const command = new GetObjectCommand(workshopS3Request);
    const response = await s3Client.send(command);
    const bodyString = await response.Body.transformToString();
    return JSON.parse(bodyString)
}

module.exports = router