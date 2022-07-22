require('dotenv').config();
const jwt = require('jsonwebtoken');
const db_user = require('../db-codes/users/db-user-api');
const db_post= require('../db-codes/posts/db-post-api');

async function verifyAccessToViewPost(req,res,next){
    const cookie  = req.header('cookie');
    if(!cookie) return res.redirect('/api/auth/login?status=Access Denied');
    const token = cookie.slice(11);

    // have to do something here...
    // try{
    //     const verified = jwt.verify(token, process.env.JWT_TOKEN_HELPER);
    //     req.user =await DB_user.getUserById(verified.user_id);
    //     const post = await DB_post.getPost(req.params.post_id);
    //     if(post.POST_TYPE === 'group_post'){
    //         const group_post = await DB_group_post.getGroupPost(req.user.USER_ID, req.params.post_id);
    //         const group_member = await DB_group_member.getGroupMember(req.user.USER_ID,group_post.GROUP_ID);
    //         if(group_member === undefined) return res.redirect('/api/auth/login?status=Access Denied');
    //     }
    //     next();

    // }catch(err){
    //     res.status(400).send('Invalid Token');
    // }

    next()
}




module.exports = {verify};