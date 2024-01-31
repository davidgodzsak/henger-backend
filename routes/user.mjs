// 'use strict';

import { Router } from 'express';
import { randomUUID } from 'crypto';
import validateUser from '../validator/user-validator.mjs';
import { getCollection } from '../utils/db.mjs';
import { ObjectId } from 'mongodb';

const HENGER_URL = 'https://henger.studio/'

const router = Router();

const USER_COLLECTION_NAME = "User";


// todo use direct read of workshops file in FE
router.get('/', async (_, res) => {
    const collection = getCollection(USER_COLLECTION_NAME);
    const results = await collection.find().project({ hashedPassword: 0, otp: 0 }).toArray();
    return res.send(results).status(200);
})

// todo auth
router.post('/', async (req, res) => {
    // validate if they sent a user
    if (!validateUser(req.body)) {
        return res.status(400).json({ message: "Not a user" });
    }

    // check for uniqueness 
    let collection = getCollection(USER_COLLECTION_NAME);
    const user = await collection.findOne({ email: req.body.email });
    if (user) {
        return res.status(400).json({ message: "User already exists!" }) // todo instead use a mongodb index
    }

    // save user
    try {
        const result = await collection.insertOne(req.body)
        return res.status(201).json({ message: 'Inserted user', id: result.insertedId })
    } catch (e) {
        return res.status(500).json({ message: "Could not save the user!", error: e })
    }
})


// todo auth
router.put('/:id', async (req, res) => {
    // validate if they sent a user
    if (!validateUser(req.body)) {
        return res.status(400).json({ message: "Not a user", errors: validateUser.errors });
    }

    let { _id, otp, hashedPassword, ...userData } = req.body;

    // check for uniqueness 
    let collection = getCollection(USER_COLLECTION_NAME);
    try {
        const user = await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: userData }
        );

        if (!user) {
            return res.status(404).json({ message: "User does not exist!" }) // todo instead use a mongodb index
        }
        return res.status(200).json({ message: "Edited user!" })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ message: "Could not save the user!", error: e })
    }
})

// todo auth
router.delete('/:id', async (req, res) => {
    let collection = getCollection(USER_COLLECTION_NAME);
    const user = await collection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (!user) {
        return res.status(404).json({ message: "User does not exist!" }) // todo instead use a mongodb index
    }
    res.status(200).json({ message: "Deleted member!" })
})

export default router;