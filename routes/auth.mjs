import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth-middleware.mjs';
import bcrypt from "bcrypt";
import { generateOTP } from '../utils/otp.mjs';

const router = Router();

const SECRET_KEY = 'Zfxg3tT24npXGVqjqmwqLdishmHb8BCrVeCtJtxRvjcjyL3ggN_6@8'
const SALT_ROUNDS = 10;

router.post('/login', async (req, res) => {
    const validateResonse = await validateAndGet(req.body.email, req.body.password);

    if (validateResonse.success) {
        const user = { name: userName, groups: validateResonse.user.groups, email: validateResonse.user.email  }
        const accessToken = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
        res.json({ accessToken });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

router.post('/update-pass', requireAuth, async (req, res) => {
    if (await isOTPValid(req.body.otp)) {
        setNewPassword(req.body.email, req.body.newPassword);
        const user = { name: userName }; // Payload
        const accessToken = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
        res.json({ accessToken });
    } else {
        res.status(401).send('Invalid credentials');
    }
});


router.post('/forgot-pass', requireAuth('members'), async (req, res) => {
    // update otp
    const otp = await generateAndStoreOTP(req.body.email)
    sendMail(otp)
});

// helpers

async function validateAndGet(email, pass) {
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ email });
    const isValid = bcrypt.compare(user.password, pass)

    if (isValid) {
        return { success: true, user }
    } else {
        return { success: false, user: null }
    }
}

async function generateAndStoreOTP(email) {
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, SALT_ROUNDS);

    const usersCollection = await getCollection('users');
    await usersCollection.updateOne({ email }, {
        $set: {
            otp: hashedOTP
        }
    });

    return otp;
}

async function isOTPValid(user, otp) {
    if (user) {
        return await bcrypt.compare(otp, user.otp);
    }
    return false
}

async function setNewPassword(email, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const usersCollection = await getCollection('users');

    await usersCollection.updateOne({ email }, {
        $set: {
            password: hashedPassword,
            isPasswordResetRequired: false
        },
        $unset: { otp: "" }
    });

    return true;
}

async function findUserByEmail(email) {
    try {
        const usersCollection = await getCollection('users');
        const user = await usersCollection.findOne({ email: email });
        return user;
    } catch (err) {
        console.error('Error finding user by email:', err);
        throw err; // Or handle it as per your application's error handling policy
    }
}