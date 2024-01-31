// 'use strict';

import { Router } from 'express';
import { dataUrlToWebp, uploadToS3, uploadManyToS3, deleteImage } from '../utils/image-util.mjs';
import validateWorkshop from '../validator/workshop-validator.mjs';
import { getCollection } from '../utils/db.mjs';
import { ObjectId } from 'mongodb';

const HENGER_URL = 'https://henger.studio/'
const WORKSHOP_COLLECION_NAME = "Workshop";

const router = Router();

// todo use direct read of workshops file in FE
router.get('/', async (_, res) => {
    try {
        const collection = getCollection(WORKSHOP_COLLECION_NAME);
        const result = await collection.find().toArray();
        res.status(200).json(result);
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

    // upload images
    let coverUrl;
    let galleryUrls;
    try {
        coverUrl = await uploadToS3(await dataUrlToWebp(req.body.cover));
        galleryUrls = await uploadManyToS3(await Promise.all(req.body.gallery.map(it => dataUrlToWebp(it))));
    } catch (e) {
        return res.status(500).json({ message: "Cold not save images", error: e });
    }

    // save workshop
    try {
        const workshop = { ...req.body, cover: HENGER_URL + coverUrl, gallery: galleryUrls.map(it => HENGER_URL + it) }
        const collection = getCollection(WORKSHOP_COLLECION_NAME);
        collection.insertOne(workshop);
        return res.status(201).json({ message: "Workshop created!" });
    } catch (e) {
        return res.status(500).json({ message: "Could not save the workshop!", error: e })
    }
})

router.put('/:id', async (req, res) => {
    const collection = getCollection(WORKSHOP_COLLECION_NAME);
    const old = await collection.findOne({ _id: new ObjectId(req.params.id) })

    if (!old) {
        return res.status(404).json({ message: "Workshop does not exist!" })
    }

    // delete old images and upload new ones
    let coverUrl;
    let galleryUrls;
    try {
        if (req.body.cover.startsWith('data:')) {
            if (old.cover) { await deleteImage(old.cover.replace(HENGER_URL, "")) }
            coverUrl = HENGER_URL + (await uploadToS3(await dataUrlToWebp(req.body.cover)));
        }

        Promise.all(old.gallery.filter(it => !req.body.gallery.includes(it)).map(async it => await deleteImage(it.replace(HENGER_URL, ""))))
        galleryUrls = await Promise.all(req.body.gallery.map(async it => {
            if (it.startsWith('data:')) {
                return  HENGER_URL + (await uploadToS3(await dataUrlToWebp(it)));
            }
            return it
        }));
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Cold not save images", error: e });
    }

    const { _id, ...workshopData } = req.body;
    const workshopDataTransformed = { ...workshopData, cover: coverUrl, gallery: galleryUrls }

    const workshop = await collection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: workshopDataTransformed }
    );

    if (!workshop) {
        return res.status(404).json({ message: "Workshop does not exist!" })
    }

    return res.status(200).json({ message: "Edited workshop!" })
})


router.delete('/:id', async (req, res) => {
    let collection = getCollection(WORKSHOP_COLLECION_NAME);
    const workshop = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!workshop) {
        return res.status(404).json({ message: "Workshop does not exist!" })
    }
    res.status(200).json({ message: "Deleted workshop!" })
})


export default router;

// todo make a workshop-repository for data layer