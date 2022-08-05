const router = require('express').Router();
const DB_follow = require('../../db-codes/users/db-follow-api');
const { verify } = require('../../middlewares/user-verification');


router.post('/requestFollow',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const following = req.body.USER_ID;
    console.log(follower, following);
    await DB_follow.requestFollow(follower, following);
    res.send("success")
});

router.post('/acceptFollow',verify, async (req,res)=>{
    const follower = req.body.USER_ID;
    const followee = req.user.USER_ID;
    await DB_follow.acceptFollow(follower, followee);
    res.send("success")
});

router.post('/removeFollowRequest',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const following = req.body.USER_ID;
    await DB_follow.removeFollowRequest(follower, following);
    res.send("success")
});

router.post('/removeFollowToUser',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const followee = req.body.USER_ID;
    await DB_follow.removeFollow(follower, followee);
    res.send("success")
});

router.post('/removeFollowOFUser',verify, async (req,res)=>{
    const followee = req.user.USER_ID;
    const follower = req.body.USER_ID;
    await DB_follow.removeFollow(follower, followee);
    res.send("success")
});

router.get('/getFollowRequests',verify, async (req,res)=>{
    const follow_requests = await DB_follow.getFollowRequests(req.user.USER_ID);
    res.send(follow_requests)
});

module.exports = router;