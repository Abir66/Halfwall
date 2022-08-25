require('dotenv').config();
const router = require('express').Router();
const DB_user = require('../../db-codes/users/db-user-api');
const DB_follow = require('../../db-codes/users/db-follow-api');
const jwt = require('jsonwebtoken');
const { verify } = require('../../middlewares/user-verification.js');
const { response } = require('express');
const utils = require('../../routerControllers/utils.js');


router.get('/user_id=:user_id', verify, async (req, res) => {
    
    const currentUser = req.user;
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

   

    const middle = [{type : 'profile', location : 'profile/profile'}]
    if(req.user.USER_ID == req.params.user_id) middle.push({type : 'create-post', location : 'posts/create_post'});



    const search_data = {}
    if((req.query.profile_post_search_term && req.query.profile_post_search_term.trim().length > 0 ) || req.query.profile_post_sort_by || req.query.profile_post_filter) 
    {
        search_data.searched = true;
        search_data.search_term = req.query.profile_post_search_term.trim();
        search_data.sort_by = req.query.profile_post_sort_by;
        search_data.search_filter = utils.to_array(req.query.profile_post_filter);
        if(search_data.search_filter.length > 1) {search_data.searched = false; search_data.search_filter = []}

    }
    
    const posts = await DB_user.getUserProfilePosts(req.user.USER_ID, req.params.user_id, followed, search_data);
    middle.push({type : 'posts', data : posts});
    

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


    right.push({location : 'profile-search', data : search_data});
    
    res.render('index', {
        type : "userProfile",
        currentUser : req.user,
        user : user, 
        group : undefined,
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
    
    let middle = [{type : 'editProfile', location : 'profile/editProfile'}];
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


router.get('/find-users',verify,async(req,res)=>{
   
    let searched = false;
    let users = undefined;
    if(Object.keys(req.query).length > 0){
        searched = true;
        console.log(req.query);

        const matches = req.query.search_input.replace(/\s+/g, " ").trim().match(/(\d+)/);
        let student_id = undefined;
        if(matches!= null && matches[0].length === 7 && !isNaN(matches[0]) ) student_id = parseInt(matches[0]);

        if(!req.query.search_input) req.query.search_input = '';
        if(!req.query.hall) req.query.hall = '';
        if(!req.query.batch) req.query.batch = '';
        if(!req.query.department) req.query.department = '';
        if(!req.query.city) req.query.city = '';
        if(!req.query.hall_attachment) req.query.hall_attachment = '';

        const search_data = {
            search_input : req.query.search_input.replace(/\s+/g, " ").trim(),
            student_id : student_id,
            hall : req.query.hall.replace(/\s+/g, " ").trim(),
            hall_attachment : req.query.hall_attachment.replace(/\s+/g, " ").trim(),
            department : req.query.department.replace(/\s+/g, " ").trim(),
            batch : req.query.batch.replace(/\s+/g, " ").trim(),
            city : req.query.city.replace(/\s+/g, " ").trim(),
        }
        users = await DB_user.searchProfile(search_data);
    };
    

    const data = {
        searched : searched,
        user_list : users
    }
    
    middle = [{type : 'find-users', location : 'find-users/find-users', data : data}];
    
    res.render('index', {
        type : "find-users",
        currentUser : req.user,
        title : 'Find Users',
        left : ['left-profile', 'sidebar'],
        right : [],
        middle : middle
    });
    
})



module.exports = router;