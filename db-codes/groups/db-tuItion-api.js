const Database = require('../database');
const database = new Database();

// require defaults
const default_values = require('../default_values');

// require constants
const constant_values = require('../constant_values');


async function getPosts(user_id, search_data){

    console.log('getPosts', search_data);

    let orderby = '', post_id_str = '', search_term_str = '', post_user = '', price_search = '', condition_search = '', available_search = '', catagory_search = '';
    
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
    
    if(search_data.post_id) post_id_str = ` AND P.POST_ID = ${search_data.post_id}`;
    
    const sql = `SELECT P.POST_ID, P.USER_ID, P.GROUP_ID, P.TEXT, TO_CHAR(P.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:user_id, P.POST_ID) "USER_LIKED",
                COMMENT_COUNT(P.POST_ID) "COMMENT_COUNT",
                G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY,
                (SELECT json_arrayagg(
                    json_object('FILE_ID' value PF.POST_FILE_ID, 'FILE_LOCATION' value PF.FILE_LOCATION, 'FILE_TYPE' value PF.FILE_TYPE)) "FILES"
                    from POST_FILES pf WHERE pf.POST_ID = P.POST_ID
                ) "FILES",
                TP.CLASS, TP.REMUNERATION, TP.STUDENT_COUNT, TP.PREFERENCE, TP.BOOKED, TP.LOCATION,
                CURSOR(SELECT TS.SUBJECT FROM TUITION_SUBJECTS TS WHERE TS.POST_ID = P.POST_ID) "SUBJECTS"
                
                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID
                LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID LEFT JOIN TUITION_POSTS TP ON P.POST_ID = TP.POST_ID
                
                WHERE P.GROUP_ID = :group_id
                ${post_id_str}
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
    if(search_data.post_id) result = result[0];
    return result;
}


async function getTuitionNotificationData(user_id){

    const location_sql = `SELECT LOCATION FROM TUITION_NOTIFICATION_LOCATIONS WHERE USER_ID = :user_id`;
    const location_binds = {
        user_id : user_id
    };
    const location_result = (await database.execute(location_sql,location_binds)).rows;

    const subject_sql = `SELECT SUBJECT FROM TUITION_NOTIFICATION_SUBJECTS WHERE USER_ID = :user_id`;
    const subject_binds = {
        user_id : user_id
    };
    const subject_result = (await database.execute(subject_sql,subject_binds)).rows;

    const class_sql = `SELECT CLASS FROM TUITION_NOTIFICATION_CLASSES WHERE USER_ID = :user_id`;
    const class_binds = {
        user_id : user_id
    };
    const class_result = (await database.execute(class_sql,class_binds)).rows;

    const data = {
        locations : location_result,
        subjects : subject_result,
        classes : class_result
    };

    return data;
}


async function saveNotificationData(user_id, data){

    const location_sql = `DELETE FROM TUITION_NOTIFICATION_LOCATIONS WHERE USER_ID = :user_id`;
    const location_binds = {
        user_id : user_id
    };
    await database.execute(location_sql,location_binds);

    const subject_sql = `DELETE FROM TUITION_NOTIFICATION_SUBJECTS WHERE USER_ID = :user_id`;
    const subject_binds = {
        user_id : user_id
    };
    await database.execute(subject_sql,subject_binds);

    const class_sql = `DELETE FROM TUITION_NOTIFICATION_CLASSES WHERE USER_ID = :user_id`;
    const class_binds = {
        user_id : user_id
    };
    await database.execute(class_sql,class_binds);

    const location_data = data.locations;
    const subject_data = data.subjects;
    const class_data = data.classes;


    if(location_data.length > 0){

        let location_insert_sql = 'INSERT ALL';
        for(let location of location_data) {
            location_insert_sql += ` INTO TUITION_NOTIFICATION_LOCATIONS (USER_ID, LOCATION) VALUES(:user_id, '${location}')`;
        }

        location_insert_sql += ' SELECT 1 FROM DUAL';
        const location_insert_binds = { user_id : user_id }
        await database.execute(location_insert_sql, location_insert_binds);
    }

    if(subject_data.length > 0){

        let subject_insert_sql = 'INSERT ALL';
        for(let subject of subject_data) {
            subject_insert_sql += ` INTO TUITION_NOTIFICATION_SUBJECTS (USER_ID, SUBJECT) VALUES(:user_id, '${subject}')`;
        }

        subject_insert_sql += ' SELECT 1 FROM DUAL';
        const subject_insert_binds = { user_id : user_id }
        await database.execute(subject_insert_sql, subject_insert_binds);
    }

    if(class_data.length > 0){

        let class_insert_sql = 'INSERT ALL';
        for(let class_name of class_data) {
            class_insert_sql += ` INTO TUITION_NOTIFICATION_CLASSES (USER_ID, CLASS) VALUES(:user_id, '${class_name}')`;
        }

        class_insert_sql += ' SELECT 1 FROM DUAL';
        const class_insert_binds = { user_id : user_id }
        await database.execute(class_insert_sql, class_insert_binds);
    }

    return true;

}

module.exports = {
    getPosts,
    getTuitionNotificationData,
    saveNotificationData
}