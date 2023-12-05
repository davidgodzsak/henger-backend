import expressJwt from 'express-jwt';

const SECRET_KEY = 'your_secret_key';

export const requireAuth = expressJwt({
  secret: SECRET_KEY,
  algorithms: ['HS256'],
//   userProperty: 'user'
});