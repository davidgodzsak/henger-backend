import { S3Client } from "@aws-sdk/client-s3";

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET = process.env.SECRET_ACCESS_KEY;

export default new S3Client({
    region: "eu-central-1",
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET
    }
});