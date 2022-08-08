const router = require('express').Router();
const DB_follow = require('../../db-codes/users/db-follow-api');
const { verify } = require('../../middlewares/user-verification');


router.post('/requestFollow',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const following = req.body.USER_ID;
    await DB_follow.requestFollow(follower, following);
    res.send("success")
});


router.post('/processFollowRequest',verify, async (req,res)=>{
    const follower = req.body.USER_ID;
    const followee = req.user.USER_ID;
    const action = req.body.ACTION;
    console.log("action = ",action);
    const result = await DB_follow.processFollowRequest(follower, followee, action);
    res.send(result);
});


router.post('/removeFollowRequestToUser',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const following = req.body.USER_ID;
    await DB_follow.removeFollowRequest(follower, following);
    res.send("success")
});



router.post('/unfollow',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const followee = req.body.USER_ID;
    await DB_follow.removeFollow(follower, followee);
    res.send("success")
});

router.post('/removeFollower',verify, async (req,res)=>{
    const followee = req.user.USER_ID;
    const follower = req.body.USER_ID;
    await DB_follow.removeFollow(follower, followee);
    res.send("success")
});

router.get('/getFollowRequests',verify, async (req,res)=>{
    const follow_requests = await DB_follow.getFollowRequests(req.user.USER_ID);
    res.send(follow_requests)
});


router.get('/getFollowerList',verify, async (req,res)=>{
    const follower_list = await DB_follow.getFollowerList(req.query.USER_ID);
    res.send(follower_list);
})

router.get('/getFollowingList',verify, async (req,res)=>{
    const following_list = await DB_follow.getFollowingList(req.query.USER_ID);
    res.send(following_list);
})



module.exports = router;