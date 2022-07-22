const router = require('express').Router();
const db_post = require('../../db-codes/posts/db-post-api');
const { verify } = require('../../middlewares/user-verification');


// need to add a middleware to check if the user has access to the post
router.post('/like/post_id=:post_id', verify, async (req, res) => {
    await db_post.addLike(req.params.post_id, req.user.USER_ID);
    const likes_count = await db_post.getLikesCount(req.params.post_id);
    const user_liked = await db_post.checkUserLiked(req.params.post_id, req.user.USER_ID);

    const data = { likes_count : likes_count.LIKES_COUNT}
    if(user_liked) data.user_liked = true;
    res.send(data);
})


// need to add a middleware to check if the user has access to the post
router.post('/unlike/post_id=:post_id', verify, async (req, res) => {
    await db_post.removeLike(req.params.post_id, req.user.USER_ID);
    const likes_count = await db_post.getLikesCount(req.params.post_id);
    const user_liked = await db_post.checkUserLiked(req.params.post_id, req.user.USER_ID);

    const data = { likes_count : likes_count.LIKES_COUNT}
    if(user_liked) data.user_liked = true;
    res.send(data);
})

module.exports = router;