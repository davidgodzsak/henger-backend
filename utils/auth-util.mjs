import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { getCollection } from './db.mjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;
const USER_COLLECTION_NAME = "User";

export async function findUserByEmail(email) {
    try {
        const usersCollection = getCollection(USER_COLLECTION_NAME);
        const user = await usersCollection.findOne({ email: email });
        return user;
    } catch (err) {
        return null;
    }
}

export async function validateAndGetUser(email, pass) {
    const user = await findUserByEmail(email)
    if(!user) {
        return { success: false, user: null }
    }
    
    const isValid = await bcrypt.compare(pass, user.hashedPassword)

    if (isValid) {
        return { success: true, user }
    } else {
        return { success: false, user: null }
    }
}

export async function setNewPassword(email, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const usersCollection = getCollection(USER_COLLECTION_NAME);

    // todo error handling
    await usersCollection.updateOne({ email }, {
        $set: {
            hashedPassword
        },
        $unset: { otp: "" }
    });
}

export function jwtToken(user) {
    const userData = { name: user.name, groups: user.groups, email: user.email, id: user._id };
    const accessToken = jwt.sign(userData, SECRET_KEY, { expiresIn: '1h' });
    return accessToken;
}

export async function generateAndStoreOTP(email) {
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, SALT_ROUNDS);

    const usersCollection = getCollection(USER_COLLECTION_NAME);
    await usersCollection.updateOne({ email }, {
        $set: {
            otp: hashedOTP
        }
    });

    return otp;
}

export async function validateOTP(email, otp) {
    const user = await findUserByEmail(email);
    if(!user.otp) {
        return false;
    }
    return await bcrypt.compare(otp, user.otp);
}

function generateOTP(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, characters.length);
        otp += characters[randomIndex];
    }

    return otp;
}
