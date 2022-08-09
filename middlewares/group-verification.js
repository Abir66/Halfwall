require('dotenv').config();
const jwt = require('jsonwebtoken');
const DB_user = require('../db-codes/users/db-user-api');
const DB_group = require('../db-codes/groups/db-group-api');
const DB_group_member = require('../db-codes/groups/db-group-member-api');

async function verifyAdmin(req,res,next){
    const cookie  = req.header('cookie');
    if(!cookie) return res.redirect('/api/auth/login?status=Access Denied');
    const token = cookie.slice(11);
    try{
        const verified = jwt.verify(token, process.env.JWT_TOKEN_HELPER);
        req.user =await DB_user.getUserById(verified.user_id);
        const group = await DB_group.getGroup(req.params.group_id, req.user.USER_ID);
        if(group.ADMIN_ID != req.user.USER_ID) return res.redirect('/api/auth/login?status=Access Denied');
        next();

    }catch(err){
        res.status(400).send('Invalid Token');
    }
}


module.exports = {
    verifyAdmin
}