import jwt from'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    console.log(token);
    


    if (!token) throw new ApiError(401, "Access Denied");

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;    
    next();
  } catch (err) {
    throw new ApiError(400, "Invalid token");
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "Access denied" );
    }
    next();
  };
};


export { verifyToken, authorize };