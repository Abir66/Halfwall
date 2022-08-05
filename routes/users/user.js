require('dotenv').config();
const router = require('express').Router();
const DB_user = require('../../db-codes/users/db-user-api');
const DB_follow = require('../../db-codes/users/db-follow-api');
const jwt = require('jsonwebtoken');
const { verify } = require('../../middlewares/user-verification.js');
const { response } = require('express');


router.get('/user_id=:user_id', verify, async (req, res) => {
    
    console.log("in user router : ", req.query);
    
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
    const follower_cout = await DB_follow.getFollowerCount(req.params.user_id);
    const following_count = await DB_follow.getFollowingCount(req.params.user_id);
    const post_count = await DB_user.getPostCount(req.params.user_id);

    user.post_count = post_count.POST_COUNT;
    user.follower_count = follower_cout.FOLLOWER_COUNT;
    user.following_count = following_count.FOLLOWING_COUNT;

    let followed, requested;
    followed = await DB_follow.followedUser(req.user.USER_ID, req.params.user_id);
    if(followed) user.followed = followed;

    else{
        requested = await DB_follow.requestedToFollowUser(req.user.USER_ID, req.params.user_id);
        if( requested) user.requested = requested;
    }

   
    // public private issues
    const posts = await DB_user.getUserProfilePosts(req.user.USER_ID, req.params.user_id, followed, req.query.profile_post_sort_by, req.query.profile_post_search_term, req.query.profile_post_filter);
    
    //console.log(user);
    
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

    const right = [];

    // if user id is same make a follow requests count
    if(req.user.USER_ID == req.params.user_id){
        request_count = await DB_follow.getFollowRequestCount(req.user.USER_ID)
        
        if(request_count.FOLLOW_REQUEST_COUNT > 0){
            currentUser.request_count = request_count.FOLLOW_REQUEST_COUNT;
            const follow_requests = { type : "follow-requests", location : 'follow-requests' }
            right.push(follow_requests);
        }
    }


    const search_data = {}
    if(req.query.profile_post_search_term || req.query.profile_post_sort_by) search_data.searched = true;
    if(req.query.profile_post_search_term) search_data.search_term = req.query.profile_post_search_term;
    if(req.query.profile_post_sort_by) search_data.sort_by = req.query.profile_post_sort_by;

    if(!search_data.searched && !(!req.query.profile_post_filter || req.query.profile_post_filter.length == 2)) search_data.searched = true;
    if(req.query.profile_post_filter && req.query.profile_post_filter.length != 2) search_data.filter = req.query.profile_post_filter;



    const profile_search = {
        type : "profile-search-box",
        location : 'profile-search',
        data : search_data
    }

    right.push(profile_search);
    
    res.render('index', {
        type : "userProfile",
        currentUser : currentUser,
        user : user, 
        title : 'Halfwall | @'+user.STUDENT_ID,
        left : ['left-profile', 'sidebar'],
        right : right,
        middle : middle
    });

});


router.get('/profile', verify, async (req, res) => {
    res.redirect('/user/user_id='+req.user.USER_ID);
});

router.get('/editProfile', verify, async(req,res)=>{
    const currentUser = {
        USER_ID : req.user.USER_ID,
        STUDENT_ID : req.user.STUDENT_ID,
        NAME : req.user.NAME,
        EMAIL : req.user.EMAIL,
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
    
    let middle = [{type : 'editProfile'}];
    res.render('index', {
        type : "editProfile",
        currentUser : currentUser,
        title : 'Edit Profile',
        left : ['left-profile', 'sidebar'],
        right : [],
        middle : middle
    });
});


router.post('/editProfile', verify, async(req,res)=>{
    if(req.user.PASSWORD != req.body.password){
        res.send('Incorrect Password');
        return;
    }
    if(req.body.new_password) req.body.password = req.body.new_password
    let response = await DB_user.updateUser(req.body, req.user.USER_ID);
    if (response.result === 'Student ID or email already exists' || response.result === 'Something went wrong') {
        res.send(response.result);
        return;
    }
    res.send("success");
    
});

module.exports = router;