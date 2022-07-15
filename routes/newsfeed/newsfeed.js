
const router = require('express').Router();
const DB_newsfeed = require('../../db-codes/posts/db-newsfeed-api');
const { verify } = require('../../middlewares/user-verification');
// const { verifyAccessToUpdatePost, verifyAccessToDeletePost } = require('../../middlewares/post-verification');



router.get('/', verify, async (req, res) => {
    const user_id = req.user.USER_ID;
    console.log(user_id);
    const posts = await DB_newsfeed.getPostsForUserID(user_id);
    res.send(posts);
});



module.exports = router;
