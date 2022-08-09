
const router = require('express').Router();
const DB_newsfeed = require('../../db-codes/posts/db-newsfeed-api');
const { verify } = require('../../middlewares/user-verification');
// const { verifyAccessToUpdatePost, verifyAccessToDeletePost } = require('../../middlewares/post-verification');

router.get('/', verify, async (req, res) => {
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
    
    const posts = await DB_newsfeed.getNewsFeedPostsForUserID(req.user.USER_ID, req.query.newsfeed_sort_by, req.query.newsfeed_search_term);
    
    let middle = [{type : "create-post", location : "posts/create_post"}];
    for (let i = 0; i < posts.length; i++) {
        // Images should be included in the post from the database after implementing FILES SCHEMA
        const IMAGES = ['/images/pfp2.png','/images/pfp.jpg']
        posts[i].IMAGES = IMAGES;
        middle.push({type : 'post', content : posts[i]});
    }


    const search_data = {}
    if(req.query.newsfeed_search_term || req.query.newsfeed_sort_by) search_data.searched = true;
    if(req.query.newsfeed_search_term) search_data.search_term = req.query.newsfeed_search_term;
    if(req.query.newsfeed_sort_by) search_data.sort_by = req.query.newsfeed_sort_by;
    const right = {
        type : "newsfeed-search-box",
        location : 'newsfeed-search',
        data : search_data
    }

    

    res.render('index', {
        type : "newsfeed",
        currentUser : currentUser,
        title : 'Newsfeed',
        left : ['left-profile', 'sidebar'],
        right : [right],
        middle : middle
    });
});


module.exports = router;
