// 'use strict';

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { dataUrlToWebp, uploadToS3, uploadManyToS3 } from '../utils/image-util.mjs';
import send from '../utils/s3-client.mjs';
import validateWorkshop from '../validator/workshop-validator.mjs';
import { getCollection } from '../utils/db.mjs';

const BUCKET_NAME = process.env.BUCKET_NAME;
const DB_PATH = 'db';
const HENGER_URL = 'https://henger.studio/'

const router = Router();

const WORKSHOP_COLLECION_NAME = "Workshop";
const workshopS3Request = { Bucket: BUCKET_NAME, Key: `${DB_PATH}/workshops_dev.json` };

// todo use direct read of workshops file in FE
router.get('/', async (_, res) => {
    try {
        const collection = getCollection(WORKSHOP_COLLECION_NAME);
        const result = await collection.insertOne(req.body);
        res.status(201).json(result);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
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
        await send(command)
    } catch (e) {
        return res.status(500).json({ message: "Could not save the workshop!", error: e })
    }

    res.status(201).json({ message: "Added workshop!" })
})

router.put('/:id', async (req, res) => {
    const workshops = await getWorkshopsFromAws()
        .catch(e => res.status(500).json({ message: "Could not load existing workshops!", error: e }));

    const editedWorkshop = req.body;

    // todo store new pictures
    // delete old pictures

    const workshopsChanged = workshops.map(workshop => workshop.id == editedWorkshop.id ? editedWorkshop : workshop)

    const command = new PutObjectCommand({ Body: workshopsChanged, ...workshopS3Request });
    await send(command)
        .catch(e => res.status(500).json({ message: "Could not save the workshop change!", error: e }));

    res.status(200).json({ message: "Edited workshop!" })
})


router.delete('/:id',  async (req, res) => {
    const workshops = await getWorkshopsFromAws()
        .catch(e => res.status(500).json({ message: "Could not load existing workshops!", error: e }));
    const workshopsChanged = JSON.stringify(workshops.filter(it => it.id !== req.params.id))

    // todo delete all images for the workshop

    const command = new PutObjectCommand({ Body: workshopsChanged, ...workshopS3Request });
    await send(command)
        .catch(e => res.status(500).json({ message: "Could not save the workshop change!", error: e }));

    res.status(200).json({ message: "Deleted workshop!" })
})

// helpers
async function getWorkshopsFromAws() {
    const command = new GetObjectCommand(workshopS3Request);
    const response = await send(command);
    const bodyString = await response.Body.transformToString();
    return JSON.parse(bodyString)
}

export default router;