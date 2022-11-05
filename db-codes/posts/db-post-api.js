const Database = require('../database');
const database = new Database();
const default_values = require('../default_values');
const constant_values = require('../constant_values');
const DB_storage = require('../files/storage-files');
const DB_notification = require('../users/db-notification-api');
const utils = require('../../routerControllers/utils');



async function addLike(post_id, user_id){
    const sql = `INSERT INTO LIKES
                    VALUES(:user_id, :post_id, CURRENT_TIMESTAMP)`;
    
    const binds={
        user_id : user_id,
        post_id : post_id,
    }
    await database.execute(sql, binds);
    DB_notification.sendNotification();
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
    
    const sql = `SELECT LIKES.USER_ID, USERS.NAME, NVL(USERS.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
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

    const sql = `SELECT P.POST_ID, P.USER_ID, P.GROUP_ID, P.TEXT, TO_CHAR(P.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                INITCAP(U.NAME) "USERNAME",  NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",
                LIKE_COUNT(P.POST_ID) "LIKES_COUNT", USER_LIKED_THIS_POST(:user_id, P.POST_ID) "USER_LIKED",
                COMMENT_COUNT(P.POST_ID) "COMMENT_COUNT",
                G.GROUP_ID, G.GROUP_NAME, G.GROUP_PRIVACY,
                (SELECT json_arrayagg(
                    json_object('FILE_ID' value POST_FILE_ID, 'FILE_LOCATION' value PF.FILE_LOCATION, 'FILE_TYPE' value PF.FILE_TYPE)) "FILES"
                    from POST_FILES pf WHERE pf.POST_ID = P.POST_ID
                ) "FILES"

                FROM POSTS P LEFT JOIN USERS U ON P.USER_ID = U.USER_ID LEFT JOIN GROUPS G ON P.GROUP_ID = G.GROUP_ID
                WHERE P.POST_ID = :post_id`;

    const binds ={
        post_id : post_id,
        user_id : user_id
    };

    result = (await database.execute(sql,binds)).rows[0];
    return result;
}


async function getComments(post_id, limit, cursor_id){
    
    let limit_str = '', cursor_str = '';
    if(limit) limit_str = `FETCH FIRST ${limit} ROWS ONLY`;
    
    if(cursor_id) cursor_str = ` AND COMMENT_ID > ${cursor_id}`;
    const sql = `SELECT C.COMMENT_ID, C.POST_ID, C.TEXT, C.IMAGE, TO_CHAR(C.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                U.USER_ID, INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM COMMENTS C LEFT JOIN USERS U ON C.USER_ID = U.USER_ID
                WHERE C.POST_ID = :post_id
                ${cursor_str}
                ORDER BY C.TIMESTAMP ASC
                ${limit_str}`;

    const binds ={
        post_id : post_id
    };

    result = (await database.execute(sql,binds)).rows;
    return result;
}



async function createPost(user_id, post_data, files){
    console.log(post_data)
    const sql = `BEGIN
                    CREATE_POST(:user_id, :group_id, :text, :result, :post_id);
                END;`;

    const binds = {
        user_id : user_id,
        group_id : post_data.group_id,
        text : post_data.post_text,
        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        },
        post_id: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
        }
    }

    const result =  (await database.execute(sql, binds)).outBinds;
   
    if(result.result != 'success') return result;


    if(files.length > 0){
        let file_insert_sql = 'INSERT ALL';
        for(let file of files) {
            file_insert_sql += ` INTO POST_FILES (POST_ID, FILE_TYPE, FILE_LOCATION) VALUES(:post_id, '${file.file_type}', '${file.file_path}')`;
        }
        file_insert_sql += ' SELECT 1 FROM DUAL';
        const file_insert_binds = { post_id : result.post_id }
        await database.execute(file_insert_sql, file_insert_binds);
    }

    // // if group is marketplace
    if(post_data.group_id == constant_values.marketplace_group_id){
        const sql = `INSERT INTO SELL_POSTS (POST_ID, CATAGORY, PRICE, CONDITION, AVAILABLE) VALUES (:post_id, :catagory, :price, :condition, :available)`;
        const binds = {
            post_id : result.post_id,
            catagory : post_data.catagory,
            price : post_data.price,
            condition : post_data.condition,
            available : 'Yes'
        }
        await database.execute(sql, binds);
    }


    else if(post_data.group_id == constant_values.tuition_group_id){

        const sql = `INSERT INTO TUITION_POSTS (POST_ID, CLASS, REMUNERATION, STUDENT_COUNT, PREFERENCE, LOCATION) 
                    VALUES (:post_id, :class, :remuneration, :student_count, :preference, :location)`;

        const binds = {
            post_id : result.post_id,
            class : post_data.class,
            remuneration : post_data.remuneration,
            student_count : post_data.student_count,
            preference : post_data.preference,
            location : post_data.location
        }

        await database.execute(sql, binds);

        // insert all subjects into tuition_subjects table
        post_data.subjects = utils.to_array(post_data.subjects);
        if(post_data.subjects.length > 0){
            let subject_insert_sql = 'INSERT ALL';
            for(let subject of post_data.subjects) {
                subject_insert_sql += ` INTO TUITION_SUBJECTS (POST_ID, SUBJECT) VALUES(:post_id, '${subject}')`;
            }
            subject_insert_sql += ' SELECT 1 FROM DUAL';
            const subject_insert_binds = { post_id : result.post_id }
            await database.execute(subject_insert_sql, subject_insert_binds);
        }


        // tuition notification

        const notification_users_sql = `
        
        SELECT T2.USER_ID

        FROM 
        (
	        (SELECT SUBJECT FROM TUITION_SUBJECTS where POST_ID = :post_id) T1
	        INNER JOIN
	        (SELECT USER_ID, SUBJECT FROM TUITION_NOTIFICATION_SUBJECTS) T2
	        on T1.SUBJECT = T2.SUBJECT

        )

        WHERE :location in (SELECT LOCATION from TUITION_NOTIFICATION_LOCATIONS TL WHERE TL.USER_ID = T2.USER_ID )
        AND :class in (SELECT CLASS from TUITION_NOTIFICATION_CLASSES TC WHERE TC.USER_ID = T2.USER_ID )
        AND T2.USER_ID <> :user_id

        GROUP BY T2.USER_ID
        HAVING COUNT(*) = :subject_count
        `;

        const notification_users_binds = {
            post_id : result.post_id,
            location : post_data.location,
            class : post_data.class,
            subject_count : post_data.subjects.length,
            user_id : user_id
        }
        let notification_users = (await database.execute(notification_users_sql, notification_users_binds)).rows;
        notification_users = notification_users.map(user => user.USER_ID);
        DB_notification.sendTuitionNotification(notification_users, result.post_id, user_id);
        
    }

    return result;
}

async function updatePost(post_data, files, removed_files){

    const sql = `UPDATE POSTS SET TEXT = :text, GROUP_ID = :group_id WHERE POST_ID = :post_id`;
    const binds = {
        post_id : post_data.post_id,
        text : post_data.post_text,
        group_id : post_data.group_id
    }

    await database.execute(sql, binds);

    if(files.length > 0){
        let file_insert_sql = 'INSERT ALL';
        for(let file of files) {
            file_insert_sql += ` INTO POST_FILES (POST_ID, FILE_TYPE, FILE_LOCATION) VALUES(:post_id, '${file.file_type}', '${file.file_path}')`;
        }
        file_insert_sql += ' SELECT 1 FROM DUAL';
        const file_insert_binds = { post_id : post_data.post_id }
        await database.execute(file_insert_sql, file_insert_binds);
    }

    // // if group is marketplace
    if(post_data.group_id == constant_values.marketplace_group_id){

        const sql = `UPDATE SELL_POSTS SET CATAGORY = :catagory, PRICE = :price, CONDITION = :condition, AVAILABLE = :available WHERE POST_ID = :post_id`;
        const binds = {
            post_id : post_data.post_id,
            catagory : post_data.catagory,
            price : post_data.price,
            condition : post_data.condition,
            available : post_data.available
        }
        await database.execute(sql, binds);
    }

    else if(post_data.group_id == constant_values.tuition_group_id){

        const sql = `UPDATE TUITION_POSTS SET CLASS = :class, BOOKED = :booked, REMUNERATION = :remuneration, STUDENT_COUNT = :student_count, PREFERENCE = :preference, LOCATION = :location WHERE POST_ID = :post_id`;

        const binds = {
            post_id : post_data.post_id,
            class : post_data.class,
            remuneration : post_data.remuneration,
            student_count : post_data.student_count,
            preference : post_data.preference,
            location : post_data.location,
            booked : post_data.booked
        }

        await database.execute(sql, binds);

        // delete all subjects from tuition_subjects table
        const sql2 = `DELETE FROM TUITION_SUBJECTS WHERE POST_ID = :post_id`;
        const binds2 = {
            post_id : post_data.post_id
        }
        await database.execute(sql2, binds2);

        // insert all subjects into tuition_subjects table
        //
        post_data.subjects = utils.to_array(post_data.subjects);
        if(post_data.subjects.length > 0){
            let subject_insert_sql = 'INSERT ALL';
            for(let subject of post_data.subjects) {
                subject_insert_sql += ` INTO TUITION_SUBJECTS (POST_ID, SUBJECT) VALUES(:post_id, '${subject}')`;
            }
            subject_insert_sql += ' SELECT 1 FROM DUAL';
            const subject_insert_binds = { post_id : post_data.post_id }
            await database.execute(subject_insert_sql, subject_insert_binds);
        }
    }

    // delete files with file_ids in removed_files
    if(removed_files.length > 0){
        let file_delete_sql = 'DELETE FROM POST_FILES WHERE POST_ID = :post_id AND POST_FILE_ID IN (' + removed_files.join(',') + ')';
        const file_delete_binds = { post_id : post_data.post_id }
        await database.execute(file_delete_sql, file_delete_binds);
        DB_storage.storageCleanup();
    }



}

async function createComment(comment){
    const sql = `BEGIN
                    CREATE_COMMENT(:post_id, :user_id, :text, :image, :result, :comment_id);
                END;`;
    
    const binds = {
        post_id : comment.post_id,
        user_id : comment.user_id,
        text : comment.comment_text,
        image : comment.comment_image,
        result: {
            dir: oracledb.BIND_OUT,
            type: oracledb.VARCHAR2
        },
        comment_id: {
            dir: oracledb.BIND_OUT,
            type: oracledb.NUMBER
        }
    }

    
    const result =  (await database.execute(sql, binds)).outBinds;
    DB_notification.sendNotification();
    return result;

}




async function updateComment(comment_id,comment_text, remove_image, new_image){

    
    let set_image_str = '';
    if(new_image) set_image_str = `, IMAGE = '${new_image}'`;
    else if(remove_image){ set_image_str = `, IMAGE = NULL`; }

    
    const sql = `UPDATE COMMENTS SET TEXT = :text ${set_image_str} WHERE COMMENT_ID = :comment_id`;
    
    const binds = {
        comment_id : comment_id,
        text : comment_text
    }
    
    
    await database.execute(sql, binds);

    // get the comment
    const comment = await getCommentByID(comment_id);
    DB_notification.sendNotification();
    DB_storage.storageCleanup();
    return comment;
    
}

async function getCommentByID(comment_id){
    const sql = `SELECT C.COMMENT_ID, C.POST_ID, C.TEXT, C.IMAGE, TO_CHAR(C.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
                U.USER_ID, INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
                FROM COMMENTS C LEFT JOIN USERS U ON C.USER_ID = U.USER_ID
                WHERE C.COMMENT_ID = :comment_id`;

    const binds ={
        comment_id : comment_id
    };

    result = (await database.execute(sql,binds)).rows[0];
    
    return result;
}

async function deleteComment(comment_id){
    const sql = `DELETE FROM COMMENTS WHERE COMMENT_ID = :comment_id`;
    const binds = {
        comment_id:comment_id,
    }

    try{
        await database.execute(sql, binds);
        DB_storage.storageCleanup();
        return 'success'
    }catch(err){
        
        return 'something went wrong'
    }
   
}

async function getCommentCount(post_id){
    const sql = `
        SELECT COUNT(*) AS N
        FROM COMMENTS
        WHERE POST_ID = :post_id
    `;

    const binds = {
        post_id:post_id
    }

    result = (await database.execute(sql,binds)).rows[0].N;
    return result;
}

async function getCommentMetadata(comment_id){
    
    const sql = `select C.COMMENT_ID, C.POST_ID, C.USER_ID,
                P.GROUP_ID, P.USER_ID "POST_USER_ID" 
                from comments c join posts p on c.post_id = p.post_id
                where c.comment_id = :comment_id`;
    
    const binds = {
        comment_id:comment_id
    }

    result = (await database.execute(sql,binds)).rows[0];
    return result;

}

async function deletePost(post_id){
    const sql = `DELETE FROM POSTS WHERE POST_ID = :post_id`;
    const binds = {
        post_id:post_id,
    }

    try{
        await database.execute(sql, binds);
        DB_storage.storageCleanup();
        return 'success'
    }catch(err){
        
        return 'something went wrong'
    }

}


module.exports = {
    addLike,
    removeLike,
    getLikesCount,
    checkUserLiked,
    getLikersList,
    getGroupAndUserOfPost,
    getPost,
    getComments,
    createPost,
    createComment,
    getCommentByID,
    deleteComment,
    getCommentCount,
    updateComment,
    getCommentMetadata,
    deletePost,
    updatePost,
    
}

