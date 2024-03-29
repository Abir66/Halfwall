const Database = require('../database');
const database = new Database();

// require defaults
const default_values = require('../default_values');

// require constants
const constant_values = require('../constant_values');


async function getPosts(user_id, search_data){

    

    let orderby = '', search_term_str = '', post_user = '';
    
    // sorting
    orderby = ` ORDER BY P.TIMESTAMP DESC`;
    if(search_data.sort_by == 'popularity') orderby = ` ORDER BY LIKES_COUNT DESC`;

    if(search_data.search_term && search_data.search_term.length > 0) 
        search_term_str = ` AND (UPPER(P.TEXT) LIKE UPPER('%${search_data.search_term}%') 
                            OR UPPER(U.NAME) LIKE UPPER('%${search_data.search_term}%')
                            OR UPPER(U.STUDENT_ID) = '${search_data.search_term}' )`;


    if(search_data.user_id) post_user = ' AND P.USER_ID = ' + search_data.user_id;
    
    
    const sql = `SELECT P.POST_ID, P.USER_ID, P.GROUP_ID, P.TEXT, TO_CHAR(P.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:user_id, P.POST_ID) "USER_LIKED",
                COMMENT_COUNT(P.POST_ID) "COMMENT_COUNT",
                G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY,
                (SELECT json_arrayagg(
                    json_object('FILE_ID' value PF.POST_FILE_ID, 'FILE_LOCATION' value PF.FILE_LOCATION, 'FILE_TYPE' value PF.FILE_TYPE)) "FILES"
                    from POST_FILES pf WHERE pf.POST_ID = P.POST_ID
                ) "FILES"
                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID
                LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID
                
                WHERE P.GROUP_ID = :group_id
                ${post_user}
                ${search_term_str}
                ${orderby}
                `;

    const binds ={
        group_id : constant_values.public_forum_group_id,
        user_id : user_id
    };

    result = (await database.execute(sql,binds)).rows;
    return result;
}


module.exports = {
    getPosts
}