const router = require('express').Router();
const db_post = require('../../db-codes/posts/db-post-api');
const db_marketplace = require('../../db-codes/groups/db-marketplace-api');
const db_tuition = require('../../db-codes/groups/db-tuition-api');
const dp_notification = require('../../db-codes/users/db-notification-api')
const { verify } = require('../../middlewares/user-verification');
const { verifyAccessToViewPost, verifyAccessToDeleteComment } = require('../../middlewares/post-verification');
const { posts_upload, comments_upload } = require('../../middlewares/file-upload');
const constant_values = require('../../db-codes/constant_values');
const utils = require('../../routerControllers/utils.js');

// need to add a middleware to check if the user has access to the post
router.post('/like/post_id=:post_id', verify, async (req, res) => {
    await db_post.addLike(req.params.post_id, req.user.USER_ID);
    const likes_count = await db_post.getLikesCount(req.params.post_id);
    const user_liked = await db_post.checkUserLiked(req.params.post_id, req.user.USER_ID);

    const data = { likes_count : likes_count.LIKES_COUNT}
    if(user_liked) data.user_liked = true;
    dp_notification.sendNotification();
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

router.get('/getLikersList', verify, async (req, res) => {
    const liker_list = await db_post.getLikersList(req.query.POST_ID);
    res.send(liker_list);
})

router.get('/post_id=:post_id', verify, verifyAccessToViewPost, async (req, res) => {
    if(!res.locals.postViewAccess) return res.status(403).send('Access denied');
    
    let post = undefined
    if(res.locals.post_group_id == constant_values.marketplace_group_id) post = await db_marketplace.getPosts(req.user.USER_ID, {post_id : req.params.post_id});
    else if(res.locals.post_group_id == constant_values.tuition_group_id) post = await db_tuition.getPosts(req.user.USER_ID, {post_id : req.params.post_id});
    else post = await db_post.getPost(req.params.post_id, req.user.USER_ID);
   
    res.render('index', {
        type : "post",
        currentUser : req.user,
        title : 'Halfwall',
        left : ['left-profile', 'sidebar'],
        right : [],
        middle : [{type : 'post', data : post}]
    });
})

router.get('/getPostData/post_id=:post_id', verify, verifyAccessToViewPost, async (req, res) => {
    
    
    let post = undefined
    if(res.locals.post_group_id == constant_values.marketplace_group_id) post = await db_marketplace.getPosts(req.user.USER_ID, {post_id : req.params.post_id});
    else if(res.locals.post_group_id == constant_values.tuition_group_id) post = await db_tuition.getPosts(req.user.USER_ID, {post_id : req.params.post_id});
    else post = await db_post.getPost(req.params.post_id, req.user.USER_ID);
    
    console.log(post);
    console.log(post.USER_ID)
    
    if(!post || post.USER_ID != req.user.USER_ID) {
        res.send({result : 'access denied'});
        return;
    }
    res.send({result : 'success', post : post});

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

    data.post_text = data.post_text.trim();
    
    
    
    const result = await db_post.createPost(req.user.USER_ID, data, files);

    let post = undefined
    if(req.body.group_id == constant_values.marketplace_group_id) post = await db_marketplace.getPosts(req.user.USER_ID, {post_id : result.post_id});
    else if(req.body.group_id == constant_values.tuition_group_id) post = await db_tuition.getPosts(req.user.USER_ID, {post_id : result.post_id});
    else post = await db_post.getPost(result.post_id, req.user.USER_ID);
    result.post = post;

    
    res.send(result);
} )


router.post('/edit-post/post_id=:post_id', verify, posts_upload.array('files',100), async (req, res) => {
    

    const data = req.body;
    data.post_id = req.params.post_id;

    console.log(data);
    
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

    data.post_text = data.post_text.trim();
    data.removed_files = utils.to_array(data.removed_files);
    
    console.log(data, files)
    
    
    await db_post.updatePost(data, files, data.removed_files);

    const result = {result : 'success'};
    let post = undefined
    if(req.body.group_id == constant_values.marketplace_group_id) post = await db_marketplace.getPosts(req.user.USER_ID, {post_id : req.params.post_id});
    else if(req.body.group_id == constant_values.tuition_group_id) post = await db_tuition.getPosts(req.user.USER_ID, {post_id : req.params.post_id});
    else post = await db_post.getPost(req.params.post_id, req.user.USER_ID);
    result.post = post;
    
    res.send(result);
} )


// delete post
router.post('/delete/post_id=:post_id', verify, async (req, res) => {
    await db_post.deletePost(req.params.post_id);
    res.send('success');
} )


// ------------------------------comments ---------------------------------------
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


router.get('/getComments', verify, async (req, res) => {
    const comments = await db_post.getComments(req.query.post_id, constant_values.comment_limit, req.query.last_comment_id);
    res.send(comments);
})

router.post('/deleteComment/comment_id=:comment_id', verify, verifyAccessToDeleteComment, async(req,res)=>{
    const result = await db_post.deleteComment(req.params.comment_id);
    res.send(result);
})


router.post('/getCommentById', verify,  async (req,res)=>{
    const result = await db_post.getCommentByID(req.body.comment_id);
    res.send({result:result});
})


router.post('/update-comment', verify, comments_upload.single('comment-image'), async (req, res) => {
    
    let file_path = undefined, remove_image = false;
    if(req.file) {
        file_path = req.file.path.replace(/\\/g, '/');
        file_path = file_path.substring(file_path.indexOf('/'));
        remove_image = true;
    }

    remove_image = remove_image || req.body.remove_image;
    const updated_comment = await db_post.updateComment(req.body.comment_id,req.body.comment_text, remove_image, file_path);
    const data = {result : 'success', comment : updated_comment};
    res.send(data);

})

router.get('/post_id=:post_id/comment/comment_id=:comment_id', verify, verifyAccessToViewPost, async (req, res) => {


    const comment =  await db_post.getCommentByID(req.params.comment_id);
    if(!comment){
        res.status(404).send('Group not found');
        return;
    }

    let post = undefined
    if(res.locals.post_group_id == constant_values.marketplace_group_id) post = await db_marketplace.getPosts(req.user.USER_ID, {post_id : req.params.post_id});
    else if(res.locals.post_group_id == constant_values.tuition_group_id) post = await db_tuition.getPosts(req.user.USER_ID, {post_id : req.params.post_id});
    else post = await db_post.getPost(req.params.post_id, req.user.USER_ID);
    
    post.initialComment = comment;
    console.log(post)

    res.render('index', {
        type : "post",
        currentUser : req.user,
        title : 'Halfwall',
        left : ['left-profile', 'sidebar'],
        right : [],
        middle : [{type : 'post', data : post}]
    });
    

   

})


module.exports = router;