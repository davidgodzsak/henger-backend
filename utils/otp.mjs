export function generateOTP(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, characters.length);
        otp += characters[randomIndex];
    }

    return otp;
}