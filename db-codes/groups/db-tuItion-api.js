const Database = require('../database');
const database = new Database();

// require defaults
const default_values = require('../default_values');

// require constants
const constant_values = require('../constant_values');


async function getPosts(user_id, search_data){

    console.log('getPosts', search_data);

    let orderby = '', search_term_str = '', post_user = '', price_search = '', condition_search = '', available_search = '', catagory_search = '';
    
    // sorting
    orderby = ` ORDER BY P.TIMESTAMP DESC`;
    // if(search_data.sort_by == 'popularity') orderby = ` ORDER BY LIKES_COUNT DESC`;

    // if(search_data.search_term && search_data.search_term.length > 0) 
    //     search_term_str = ` AND (UPPER(P.TEXT) LIKE UPPER('%${search_data.search_term}%') 
    //                         OR UPPER(U.NAME) LIKE UPPER('%${search_data.search_term}%')
    //                         OR UPPER(U.STUDENT_ID) = '${search_data.search_term}' 
    //                         OR UPPER(SP.CATAGORY) LIKE UPPER('%${search_data.search_term}%'))`;

    // if(search_data.min_price) price_search = ' AND SP.PRICE >= ' + search_data.min_price;
    // if(search_data.max_price) price_search += ' AND SP.PRICE <= ' + search_data.max_price;

    // if(search_data.condition) condition_search = ` AND SP.CONDITION =  '${search_data.condition}'`; 
    // if(search_data.available) available_search = ` AND SP.AVAILABLE =  '${search_data.available}'`; 

    // if(search_data.catagory && search_data.catagory.length > 0) catagory_search =  `AND SP.CATAGORY IN ('${ search_data.catagory.join("','") }')`;

    // if(search_data.user_id) post_user = ' AND P.USER_ID = ' + search_data.user_id;
    
    
    const sql = `SELECT P.POST_ID, P.USER_ID, P.GROUP_ID, P.TEXT, TO_CHAR(P.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:user_id, P.POST_ID) "USER_LIKED",
                COMMENT_COUNT(P.POST_ID) "COMMENT_COUNT",
                G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY,
                (SELECT json_arrayagg(
                    json_object('FILE_LOCATION' value PF.FILE_LOCATION, 'FILE_TYPE' value PF.FILE_TYPE)) "FILES"
                    from POST_FILES pf WHERE pf.POST_ID = P.POST_ID
                ) "FILES",
                TP.CLASS, TP.REMUNERATION, TP.STUDENT_COUNT, TP.PREFERENCE, TP.BOOKED, TP.LOCATION,
                CURSOR(SELECT TS.SUBJECT FROM TUITION_SUBJECTS TS WHERE TS.POST_ID = P.POST_ID) "SUBJECTS"
                
                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID
                LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID LEFT JOIN TUITION_POSTS TP ON P.POST_ID = TP.POST_ID
                
                WHERE P.GROUP_ID = :group_id
                ${post_user}
                ${catagory_search}
                ${condition_search}
                ${available_search}
                ${price_search}
                ${search_term_str}
                ${orderby}
                `;

    const binds ={
        group_id : constant_values.tuition_group_id,
        user_id : user_id
    };

    result = (await database.execute(sql,binds)).rows;
    return result;
}


module.exports = {
    getPosts
}