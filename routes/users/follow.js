const router = require('express').Router();
const DB_follow = require('../../db-codes/users/db-follow-api');
const { verify } = require('../../middlewares/user-verification');


router.post('/follow',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const following = req.body.USER_ID;
    await DB_follow.follow(follower, following);
    res.send("success")
});


router.post('/unfollow',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const following = req.body.USER_ID;
    await DB_follow.unfollow(follower, following);
    res.send("success")
});



module.exports = router;