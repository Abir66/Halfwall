
const router = require('express').Router();
const DB_newsfeed = require('../../db-codes/posts/db-newsfeed-api');
const { verify } = require('../../middlewares/user-verification');
// const { verifyAccessToUpdatePost, verifyAccessToDeletePost } = require('../../middlewares/post-verification');

router.get('/', verify, async (req, res) => {
    console.log('req.user', req.user);
    const currentUser = {
        USER_ID : req.user.USER_ID,
        NAME : req.user.NAME,
        PROFILE_PIC : 'images/pfp.jpg', // will change it later
    }
    
    const posts = await DB_newsfeed.getPostsForUserID(req.user.USER_ID);


    let middle = [];
    for (let i = 0; i < posts.length; i++) {

        // Images should be included in the post from the database after implementing FILES SCHEMA
        const IMAGES = ['images/pfp2.png','/images/pfp.jpg']
        posts[i].IMAGES = IMAGES;
        middle.push({type : 'post', content : posts[i]});
    }
    console.log("rendering");
    res.render('index', {
        type : "profile",
        currentUser : currentUser,
        profileOwner : currentUser, //edit that latter
        title : 'Newsfeed',
        left : ['left-profile', 'sidebar'],
        right : ['newsfeed-search'],
        middle : middle
    });
});
router.get('/:postid',function(req,res){
    console.log(req.params.postid);
    // here do a query and just show the post
})

module.exports = router;
