const Database = require('../database');
const database = new Database();


async function getNewsFeedPostsForUserID(user_id, sort_by = "TIMESTAMP DESC", search_term = ""){

    let order_by = "TIMESTAMP DESC";
    
    // HAVE TO IMPLEMENT A RANK FUNCTION LATER
    if(sort_by === "popularity") order_by = `LIKES_COUNT DESC, TIMESTAMP DESC`;


    let search_str = "";
    if(search_term && search_term.length > 0) search_str = `AND (UPPER(TEXT) LIKE UPPER('%${search_term}%') OR UPPER(GET_USER_NAME(USER_ID)) LIKE UPPER('%${search_term}%'))`;
    
    const sql = `SELECT POSTS.*, GET_USER_NAME(USER_ID) "USERNAME", GET_USER_PROFILE_PIC(USER_ID) "PROFILE_PIC", LIKE_COUNT(POST_ID) "LIKES_COUNT",
                USER_LIKED_THIS_POST(:user_id, POST_ID) "USER_LIKED"
	                
                FROM POSTS
                WHERE POSTS.USER_ID IN (SELECT FOLLOWEE_ID FROM FOLLOWS WHERE FOLLOWER_ID = :user_id) ${search_str}
                ORDER BY ${order_by}`;

    const binds ={
        user_id : user_id
    };

    result = (await database.execute(sql,binds)).rows;
    return result;
}

module.exports = {getNewsFeedPostsForUserID};