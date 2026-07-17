//Login: User sends email + password → server verifies password → server creates a JWT containing { userId, orgId, role } and signs it with JWT_SECRET → sends the token back to the browser.

//Subsequent requests: Browser sends the token in the header Authorization: Bearer <token> → auth middleware intercepts the request, decodes the token using JWT_SECRET, and attaches the decoded payload to req.user.

//If the token is missing, expired, or tampered with: middleware returns 401 Unauthorized and the route handler never executes.

import jwt from 'jsonwebtoken';

export const authenticateToken= (req,res,next)=> {
//read authorization, extract the token after bearer
const authHeader = req.headers['authorization'];
if(!authHeader)
    return res.status(401).json({message:"authorization header missing"});

const parts = authHeader.split(" ");

if(parts.length !==2 || parts[0]!=="Bearer")
    return res.status(401).json({message:"authorization header malformed"});

const token = parts[1];
//verify tocken: this either returns the decoded payload or throws an error
try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    //attach the decoded user payload to the request object so downstream routes can use it
    req.user = decoded;
    //call next() to pass control to the actual route handler
    next();
}
catch{
    return res.status(403).json({message:"Invalid token"});
}

}