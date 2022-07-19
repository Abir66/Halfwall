const Database = require('../database');
const database = new Database();


async function getNewsFeedPostsForUserID(user_id){

    const sql = `SELECT POSTS.*, USERS.NAME, USERS.PROFILE_PIC
                FROM POSTS LEFT OUTER JOIN USERS ON POSTS.USER_ID = USERS.USER_ID
                WHERE POSTS.USER_ID IN (SELECT FOLLOWEE_ID FROM FOLLOWS WHERE FOLLOWER_ID = :user_id)
                ORDER BY TIMESTAMP DESC `

    const binds ={
        user_id : user_id
    };

    // posts
    // will have to add likes, dislikes and comments later
    result = (await database.execute(sql,binds)).rows;
    console.log("db newsfeed api js :", result);
    return result;
}

module.exports = {getNewsFeedPostsForUserID};