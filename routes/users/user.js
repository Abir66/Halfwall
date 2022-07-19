require('dotenv').config();
const router = require('express').Router();
const DB_user = require('../../db-codes/users/db-user-api');
const jwt = require('jsonwebtoken');
const { verify } = require('../../middlewares/user-verification.js');


router.get('/:user_id', verify, async (req, res) => {
    const currentUser = {
        USER_ID : req.user.USER_ID,
        STUDENT_ID : req.user.STUDENT_ID,
        NAME : req.user.NAME,
        DEPARTMENT: req.user.DEPARTMENT,
        DATE_OF_BIRTH: req.user.DATE_OF_BIRTH,
        HALL: req.user.HALL,
        HALL_ATTACHMENT: req.user.HALL_ATTACHMENT,
        BATCH: req.user.BATCH,
        STREET: req.user.STREET,
        CITY: req.user.CITY,
        POSTCODE: req.user.POSTCODE,
        PROFILE_PIC : '/images/pfp.jpg', // will change it later
    }

    

    const user = await DB_user.getUserById(req.params.user_id);
    const follower_cout = await DB_user.getFollowerCount(req.params.user_id);
    const following_count = await DB_user.getFollowingCount(req.params.user_id);
    const post_count = await DB_user.getPostCount(req.params.user_id);
    const posts = await DB_user.getUserProfilePosts(req.params.user_id);
    const followed = await DB_user.followedUser(req.user.USER_ID, req.params.user_id);
    

    user.post_count = post_count.POST_COUNT;
    user.follower_count = follower_cout.FOLLOWER_COUNT;
    user.following_count = following_count.FOLLOWING_COUNT;
    if(followed) user.followed = followed;
    console.log(user);
    
    middle = [{type : 'profile', content : 'profile'}]


    // inefficient. have to change it later
    for (let i = 0; i < posts.length; i++) {
        // Images should be included in the post from the database after implementing FILES SCHEMA
        posts[i].NAME = user.NAME;
        posts[i].PROFILE_PIC = user.PROFILE_PIC;
        const IMAGES = ['/images/pfp2.png']
        posts[i].IMAGES = IMAGES;
        middle.push({type : 'post', content : posts[i]});
    }
    
    res.render('index', {
        type : "userProfile",
        currentUser : currentUser,
        user : user, 
        title : 'Halfwall | @'+user.STUDENT_ID,
        left : ['left-profile', 'sidebar'],
        right : ['newsfeed-search'],
        middle : middle
    });

});



module.exports = router;