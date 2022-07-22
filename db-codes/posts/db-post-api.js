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


module.exports = {
    addLike,
    removeLike,
    getLikesCount,
    checkUserLiked
}

