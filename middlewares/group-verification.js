require('dotenv').config();
const jwt = require('jsonwebtoken');
const DB_user = require('../db-codes/users/db-user-api');
const DB_group = require('../db-codes/groups/db-group-api');
const DB_group_member = require('../db-codes/groups/db-group-member-api');

async function verifyAdmin(req,res,next){
    const cookie  = req.header('cookie');
    if(!cookie) return res.redirect('/signin?status=Access Denied');
    const token = cookie.slice(11);
    try{
        const verified = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
        req.user = await DB_user.getUserById(verified.user_id);
        const group_id = req.params.group_id;
        const group = await DB_group.getGroupAbout(req.params.group_id);
        res.locals.group = group;
        
        if(!group){
            res.status(404).send('Group not found');
            return;
        }
    
        const isAdmin = await DB_group_member.isAdmin(group_id, req.user.USER_ID);
        
        if(!isAdmin) return res.redirect('/api/auth/login?status=Access Denied');
        next();

    }catch(err){
        res.status(400).send('Invalid Token');
    }
}


module.exports = {
    verifyAdmin
}