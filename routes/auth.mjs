import { Router } from 'express';
import { sendEmail } from '../utils/mail.mjs';
import { generateAndStoreOTP, validateOTP,  validateAndGetUser, findUserByEmail, setNewPassword } from '../utils/auth-util.mjs';
import { jwtToken } from '../utils/auth-util.mjs';

const router = Router();

router.post('/login', async (req, res) => {
    const {success, user} = await validateAndGetUser(req.body.email, req.body.password);

    if (success) {
        res.json({ accessToken: jwtToken(user) });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

router.post('/update-pass', async (req, res) => {
    if (await validateOTP(req.body.email, req.body.otp)) {
        await setNewPassword(req.body.email, req.body.password);
        res.json({ accessToken: jwtToken(user) });
    } else {
        res.status(401).send('Invalid OTP or OTP not requested!');
    }
});


router.post('/forgot-pass', async (req, res) => {
    const email = req.body.email;
    const user = findUserByEmail(email);

    if(!user) {
        res.status(400).send("User not found!");
    }

    if(user.otp) {
        res.status(409).send("One Time pass already sent! Check email")
    }

    const otp = await generateAndStoreOTP(email);
    await sendEmail(email, 'Elfelejtett jelszó', 'Az átmeneti jelszaved: ' + otp);
    res.send("New one time password sent in email");
});

export default router;
