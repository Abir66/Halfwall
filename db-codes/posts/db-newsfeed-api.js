const Database = require('../database');
const database = new Database();





async function getPostsForUserID(user_id){

    const sql = `SELECT POSTS.*, USERS.USER_ID, USERS.NAME, USERS.PROFILE_PIC
                FROM POSTS LEFT OUTER JOIN USERS ON POSTS.USER_ID = USERS.USER_ID
                WHERE POSTS.USER_ID IN (SELECT FOLLOWEE_ID FROM FOLLOWS WHERE FOLLOWER_ID = ${user_id})
                ORDER BY TIMESTAMP DESC `

    result = (await database.execute(sql)).rows;
    console.log(result);
    return result;
}


module.exports = {getPostsForUserID};