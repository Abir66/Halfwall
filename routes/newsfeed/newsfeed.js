
const router = require('express').Router();
const DB_newsfeed = require('../../db-codes/posts/db-newsfeed-api');
const { verify } = require('../../middlewares/user-verification');
// const { verifyAccessToUpdatePost, verifyAccessToDeletePost } = require('../../middlewares/post-verification');

router.get('/', verify, async (req, res) => {

    let middle = [{type : "create-post", location : "posts/create_post"}];

    const search_data = {}
    
    if(req.query.newsfeed_search_term || req.query.newsfeed_sort_by){
        search_data.searched = true;
        search_data.search_term = req.query.newsfeed_search_term.trim();
        search_data.sort_by = req.query.newsfeed_sort_by;
    }

    const posts = await DB_newsfeed.getNewsFeedPostsForUserID(req.user.USER_ID, search_data);
    
    middle.push({type : "posts", data : posts});
    

    res.render('index', {
        type : "newsfeed",
        currentUser : req.user,
        group: undefined,
        title : 'Newsfeed',
        left : ['left-profile', 'sidebar'],
        right : [{location : 'newsfeed-search', data : search_data}],
        middle : middle
    });
});


module.exports = router;
