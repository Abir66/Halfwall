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
    const following = req.user.USER_ID;
    await DB_follow.acceptFollow(follower, following);
    res.send("success")
});

router.post('/removeFollowRequest',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const following = req.body.USER_ID;
    await DB_follow.removeFollowRequest(follower, following);
    res.send("success")
});

router.post('/removeFollow',verify, async (req,res)=>{
    const follower = req.user.USER_ID;
    const following = req.body.USER_ID;
    await DB_follow.removeFollow(follower, following);
    res.send("success")
});



module.exports = router;