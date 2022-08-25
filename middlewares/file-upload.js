// require multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


const image_and_video_filter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'  || file.mimetype === 'video/mp4') cb(null, true);
    else cb(new Error('Posts can only have jpeg, jpg, png or mp4'), false);
}

const image_filter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') cb(null, true);
    else cb(new Error('Profile picture can only be jpeg, jpg or png'), false);
}

const posts_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/posts');
    } ,
    filename: (req, file, cb) => {
        cb(null, Date.now() + uuidv4() + path.extname(file.originalname));
    }
})


const profile_picture_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/profile-pictures');
    } ,
    filename: (req, file, cb) => {
        cb(null, Date.now() + uuidv4() + path.extname(file.originalname));
    }
});


const group_cover_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/group-covers');
    } ,
    filename: (req, file, cb) => {
        cb(null,  Date.now() + uuidv4() + path.extname(file.originalname));
    }
});

const comments_storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/comments');
    } ,
    filename: (req, file, cb) => {
        cb(null, Date.now() + uuidv4() + path.extname(file.originalname));
    }
});


posts_upload = multer({storage: posts_storage, fileFilter: image_and_video_filter});
profile_picture_upload = multer({storage: profile_picture_storage, fileFilter: image_filter});
group_cover_upload = multer({storage: group_cover_storage, fileFilter: image_filter});
comments_upload = multer({storage: comments_storage, fileFilter: image_and_video_filter});



// export
module.exports = {
    posts_upload,
    profile_picture_upload,
    group_cover_upload,
    comments_upload
}
