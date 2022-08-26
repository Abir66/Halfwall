const router = require('express').Router();
const db_post = require('../../db-codes/posts/db-post-api');
const { verify } = require('../../middlewares/user-verification');
const { verifyAccessToViewPost } = require('../../middlewares/post-verification');
const { posts_upload, comments_upload } = require('../../middlewares/file-upload');

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

router.get('/getLikersList', async (req, res) => {
    const liker_list = await db_post.getLikersList(req.query.POST_ID);
    res.send(liker_list);
})

router.get('/post_id=:post_id', verify, verifyAccessToViewPost, async (req, res) => {
    if(!res.locals.postViewAccess) return res.status(403).send('Access denied');
    const post = await db_post.getPost(req.params.post_id);
    console.log(post);
   
    res.render('index', {
        type : "post",
        currentUser : req.user,
        title : 'Halfwall',
        left : ['left-profile', 'sidebar'],
        right : [],
        middle : [{type : 'post', data : post}]
    });
})


router.get('/getComments', async (req, res) => {
    const comments = await db_post.getComments(req.query.post_id);
    res.send(comments);
})



router.post('/create-post', verify, posts_upload.array('files',100), async (req, res) => {
    
    const data = req.body;
    
    const files = [];
    for(let file of req.files) {
        
        const file_extension = file.filename.split('.').pop();
        let file_path = file.path.replace(/\\/g, '/');
        file_path = file_path.substring(file_path.indexOf('/'));

        if(file_extension === 'png' || file_extension === 'jpg' || file_extension === 'jpeg') {
            files.push({
                file_path : file_path,
                file_type : 'IMAGE'
            });
        }

        else if(file_extension === 'mp4') {
            files.push({
                file_path : file_path,
                file_type : 'VIDEO'
            });
        }
    }

    data.post_text = data.post_text.replace(/\s+/g, " ").trim();
    
    
    
    await db_post.createPost(req.user.USER_ID, data, files);
    res.send('okay');
} )


router.post('/post_id=:post_id/comment', verify, verifyAccessToViewPost, comments_upload.single('comment_image') ,async (req, res) => {

    let file_path = undefined;
    if(req.file) {
        file_path = req.file.path.replace(/\\/g, '/');
        file_path = file_path.substring(file_path.indexOf('/'));
    }

    const comment = {
        post_id : req.params.post_id,
        user_id : req.user.USER_ID,
        comment_text : req.body.comment_text_input,
        comment_image : file_path
    }

    const result = await db_post.createComment(comment);
    

    if(result.result != 'success'){
        res.send(result.result);
        return;
    }


    const new_comment = await db_post.getCommentByID(result.comment_id);
    result.comment = new_comment;
    res.send(result);

})

module.exports = router;