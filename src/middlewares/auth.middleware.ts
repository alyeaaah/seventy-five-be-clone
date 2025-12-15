// middleware/auth.js
import jwt from 'jsonwebtoken';
import config from '../config';

export default function (req:any, res:any, next:any) {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.data = decoded;
    next();
  } catch (err) {
    console.log(err);
    
    res.status(401).json({ message: 'Token is not valid' });
  }
}
