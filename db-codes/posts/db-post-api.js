const Database = require('../database');
const database = new Database();


async function addLike(post_id, user_id){
    const sql = `INSERT INTO LIKES
                    VALUES(:user_id, :post_id, CURRENT_TIMESTAMP)`;
    
    const binds={
        user_id : user_id,
        post_id : post_id,
    }
    await database.execute(sql, binds);
    return;
}

async function removeLike(post_id, user_id, ){
    const sql = `DELETE FROM LIKES 
                WHERE USER_ID = :user_id AND post_id = :post_id`;
    
    const binds={
        user_id : user_id,
        post_id : post_id
    }
    await database.execute(sql, binds);
    return;
}


async function getLikesCount(post_id){
    const sql = `SELECT count(*) AS LIKES_COUNT
                FROM LIKES
                WHERE POST_ID = :post_id`;
    const binds = {
        post_id : post_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
}

async function checkUserLiked(post_id,user_id){
    const sql = `SELECT 1 AS USER_LIKED
                FROM LIKES
                WHERE POST_ID = :post_id and USER_ID = :user_id`;
    const binds = {
        post_id : post_id,
        user_id : user_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
}

async function getLikersList(post_id){
    
    const sql = `SELECT LIKES.USER_ID, USERS.NAME, USERS.PROFILE_PIC
                FROM LIKES LEFT JOIN USERS ON LIKES.USER_ID = USERS.USER_ID
                WHERE POST_ID = :post_id
                ORDER BY TIMESTAMP DESC`;
    const binds = {
        post_id : post_id
    }
    const result = (await database.execute(sql, binds)).rows;
    return result;

}

async function getGroupAndUserOfPost(post_id){
    
    const sql = `SELECT P.GROUP_ID, P.USER_ID, G.GROUP_NAME, G.GROUP_PRIVACY
                FROM POSTS P LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID
                WHERE P.POST_ID = :post_id`;
    const binds = {
        post_id : post_id
    }
    const result = (await database.execute(sql, binds)).rows[0];
    return result;
}

async function getPost(post_id, user_id){
    const sql = `SELECT P.*, INITCAP(U.NAME) "USERNAME", U.PROFILE_PIC "USER_PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:user_id, P.POST_ID) "USER_LIKED",
                G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY
                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID
                WHERE P.POST_ID = :post_id`;

    const binds ={
        post_id : post_id,
        user_id : user_id
    };

    result = (await database.execute(sql,binds)).rows[0];

    const IMAGES = ['/images/pfp2.png','/images/pfp.jpg']
    result.IMAGES = IMAGES;
    
    return result;
}


async function getComments(post_id){
    const sql = `SELECT C.COMMENT_ID, C.POST_ID, C.TEXT, C.IMAGE, TO_CHAR(C.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                U.USER_ID, INITCAP(U.NAME) "USERNAME", U.PROFILE_PIC "USER_PROFILE_PIC"
                FROM COMMENTS C LEFT JOIN USERS U ON C.USER_ID = U.USER_ID
                WHERE C.POST_ID = :post_id
                ORDER BY C.TIMESTAMP ASC`;

    const binds ={
        post_id : post_id
    };

    result = (await database.execute(sql,binds)).rows;
    console.log(result);
    return result;
}


async function createPost(){
    
}

module.exports = {
    addLike,
    removeLike,
    getLikesCount,
    checkUserLiked,
    getLikersList,
    getGroupAndUserOfPost,
    getPost,
    getComments
}

