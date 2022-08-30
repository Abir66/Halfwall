const Database = require('../database');
const database = new Database();
const default_values = require('../default_values');

async function getNewsFeedPostsForUserID(user_id, search_data, limit, timestamp, cursor_id){

    console.log('limit = ',  limit)
    let order_by = "TIMESTAMP DESC", search_term_str = "", cursor_str = '', limit_str = '';

    if(limit) limit_str = ` FETCH FIRST ${limit} ROWS ONLY`;
    
    if(search_data.sort_by === "popularity") order_by = `LIKES_COUNT DESC, P.TIMESTAMP DESC`;

    // only show the post before the previous query
    else if(cursor_id) cursor_str = ` AND P.POST_ID < ${cursor_id}`;
    
    

    if(search_data.search_term && search_data.search_term.length > 0) 
        search_term_str = `AND (UPPER(P.TEXT) LIKE UPPER('%${search_data.search_term}%')
                        OR UPPER(U.NAME) LIKE UPPER('%${search_data.search_term}%')
                        OR UPPER(U.STUDENT_ID) = '${search_data.search_term}' )`;
    
    const sql = `SELECT P.POST_ID, P.USER_ID, P.GROUP_ID, P.TEXT, TO_CHAR(P.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:user_id, P.POST_ID) "USER_LIKED",
                COMMENT_COUNT(P.POST_ID) "COMMENT_COUNT",
                CURSOR(SELECT FILE_TYPE, FILE_LOCATION FROM POST_FILES PF WHERE PF.POST_ID = P.POST_ID) "FILES"
                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID
                WHERE P.USER_ID IN (SELECT FOLLOWEE_ID FROM FOLLOWS WHERE FOLLOWER_ID = :user_id)
                AND P.GROUP_ID IN (1,2) ${search_term_str}
                ${cursor_str}
                ORDER BY ${order_by}
                `;

    const binds ={
        user_id : user_id
    };

    result = (await database.execute(sql,binds)).rows;
    return result;
}

module.exports = {getNewsFeedPostsForUserID};