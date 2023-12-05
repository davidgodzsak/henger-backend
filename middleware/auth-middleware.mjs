
import { expressjwt } from "express-jwt";

const SECRET_KEY = 'your_secret_key';

export const requireAuth = expressjwt({
  secret: SECRET_KEY,
  algorithms: ['HS256'],
  userProperty: 'user'
});