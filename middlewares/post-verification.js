require('dotenv').config();
const jwt = require('jsonwebtoken');
const DB_user = require('../db-codes/users/db-user-api');
const DB_group = require('../db-codes/groups/db-group-api');
const DB_group_member = require('../db-codes/groups/db-group-member-api');
const DB_post = require('../db-codes/posts/db-post-api');
const DB_follow = require('../db-codes/users/db-follow-api');

async function verifyAccessToViewPost(req,res,next){
    
    
    const post_metaData = await DB_post.getGroupAndUserOfPost(req.params.post_id);
    res.locals.postViewAccess = false;

    if(!post_metaData) return res.status(404).send('Post not found');

    else if(post_metaData.USER_ID == req.user.USER_ID) res.locals.postViewAccess = true;
    
    else if(post_metaData.GROUP_PRIVACY == 'PUBLIC') res.locals.postViewAccess = true;
    
    // check if group member
    else if(post_metaData.GROUP_PRIVACY == 'PRIVATE'){
        const isMember = await DB_group_member.isMember(post_metaData.GROUP_ID, req.user.USER_ID);
        if(isMember) res.locals.postViewAccess = true; 
    }

    // check if follower
    else if(post_metaData.GROUP_PRIVACY == 'PERSONAL PRIVATE'){
        const isFollower = await DB_follow.followedUser(req.user.USER_ID, post_metaData.USER_ID);
        if(isFollower) res.locals.postViewAccess = true;  
    }
    next()
}




module.exports = {
    verifyAccessToViewPost
};