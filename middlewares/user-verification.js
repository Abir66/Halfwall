require('dotenv').config();
const jwt = require('jsonwebtoken');
const DB_user = require('../db-codes/users/db-user-api');


//middleware function to verify the jwt token and find the user who is currently logged in
async function verify(req,res,next){
    const cookie  = req.header('cookie');
    if(!cookie) return res.redirect('/signin?status=Access Denied');
    const token = cookie.slice(11);
    try{
        const verified = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
        req.user = await DB_user.getUserById(verified.user_id);
        console.log("User verified", verified.user_id)
        next();
    }catch(err){
        res.status(400).send('Invalid Token');
    }
}

module.exports = {verify};