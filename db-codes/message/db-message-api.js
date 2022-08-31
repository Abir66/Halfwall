const Database = require('../database');
const database = new Database();
const default_values = require('../default_values');


async function getConversationList(user_id){
    const sql = `SELECT C.* , INITCAP(U.NAME) AS NAME, MESSAGES.TEXT,U.USER_ID, INITCAP(U.NAME) AS USER_NAME,U.STUDENT_ID,NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
    FROM CONVERSATIONS C,MESSAGES,USERS U,CONVERSATION_MEMBERS CM
    WHERE C.MESSAGE_ID = MESSAGES.MESSAGE_ID AND MESSAGES.USER_ID = U.USER_ID AND CM.CONVERSATION_ID = C.CONVERSATION_ID AND CM.USER_ID = :user_id
    ORDER BY C.TIMESTAMP DESC
    `;
    const binds = {
        user_id: user_id
    }
    const result = (await database.execute(sql,binds)).rows;
    return result;
}

async function getMessageByMessageId(message_id){
    const sql = `
        SELECT M.MESSAGE_ID, M.CONVERSATION_ID, M.TEXT, M.TYPE, TO_CHAR(M.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP",
        U.USER_ID, U.STUDENT_ID, U.NAME, NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC" 
            FROM MESSAGES M LEFT JOIN USERS U ON M.USER_ID = U.USER_ID
            WHERE MESSAGE_ID = :message_id
    `
    const binds = {
        message_id:message_id,
    }
    const result = (await database.execute(sql,binds)).rows[0];
    return result;

}


async function getMessagesList(conversation_id, limit, cursor_id ){

    let limit_str = '', cursor_str = '';
    if(limit) limit_str = `FETCH FIRST ${limit} ROWS ONLY`;
    if(cursor_id) cursor_str = ` AND M.MESSAGE_ID < ${cursor_id}`;


    const sql = `
        SELECT M.MESSAGE_ID, M.CONVERSATION_ID, M.TEXT, TO_CHAR(M.TIMESTAMP, 'HH:MM DD-MON-YYYY') "TIMESTAMP", M.TYPE,
        U.USER_ID, INITCAP(U.NAME) "USERNAME", NVL(U.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
        FROM MESSAGES M JOIN USERS U
        ON M.USER_ID = U.USER_ID
        WHERE CONVERSATION_ID = :conversation_id
        ${cursor_str}
        ORDER BY M.TIMESTAMP DESC
        ${limit_str}
    `
    
    const binds = {
        conversation_id: conversation_id
    }
    const results = (await database.execute(sql,binds)).rows;

    return results;
}

async function getPartnerName(convo_id,user_id){
    console.log(convo_id, user_id)
    const sql = `SELECT INITCAP(USERS.NAME) NAME,NVL(USERS.PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC",USERS.USER_ID
    FROM CONVERSATIONS,CONVERSATION_MEMBERS,USERS
    WHERE USERS.USER_ID = CONVERSATION_MEMBERS.USER_ID AND CONVERSATION_MEMBERS.USER_ID != :user_id AND CONVERSATIONS.CONVERSATION_ID = CONVERSATION_MEMBERS.CONVERSATION_ID AND CONVERSATIONS.CONVERSATION_ID = :convo_id
    FETCH FIRST 1 ROWS ONLY
    `
    const binds = {
        user_id: user_id,
        convo_id: convo_id
        
    }
    const result = (await database.execute(sql,binds)).rows[0];

    return result;
    
}

async function insertMessage(message){
    const sql = `
        BEGIN
        CREATE_MESSAGE(:chat_id,:user_id,:text,:result);
        END;
    `;

    const binds = {
        chat_id: message.chat_id,
        user_id: message.user_id,
        text: message.text,

        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.NUMBER
        }
    }
    const result = (await database.execute(sql,binds)).outBinds;

    return result.result;
}

async function deleteMessage(message_id){
    const sql = `
        BEGIN
        DELETE_MESSAGE(:message_id,:result);
        END;
    `;

    const binds = {
        message_id: message_id,

        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.VARCHAR2
        }
    }
    const result = (await database.execute(sql,binds)).outBinds;

    return result.result;

}

async function getUsersListForMessageSearch(input,currentUser){
    
    const sql = `
        SELECT USER_ID, STUDENT_ID, INITCAP(NAME) NAME, EMAIL, DEPARTMENT, 
        DATE_OF_BIRTH, INITCAP(HALL) HALL, HALL_ATTACHMENT, BATCH, 
        INITCAP(STREET) STREET, INITCAP(CITY) CITY, POSTCODE,
        NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
        FROM USERS
        WHERE ((UPPER(NAME) LIKE UPPER('%'||:temp ||'%')) OR (TO_CHAR(STUDENT_ID) = :temp) OR (EMAIL = :email)) AND (USER_ID != :currentUser)

        
    `;
    temp = input.toString().toUpperCase().trim();
    email = u=input.toString().trim();
    const binds = {
        temp: temp,
        email: email,
        currentUser:currentUser
    }
    const result = (await database.execute(sql,binds)).rows;
    return result;

}

async function getConversationIdByUserId(user_id,currentUser){
    const sql = `
        SELECT CONVERSATION_ID
        FROM CONVERSATION_MEMBERS
        WHERE USER_ID = :user_id

        INTERSECT

        SELECT CONVERSATION_ID
        FROM CONVERSATION_MEMBERS
        WHERE USER_ID = :currentUser
    `;

    const binds = {
        user_id:user_id,
        currentUser:currentUser
    }

    const result = (await database.execute(sql,binds)).rows;
    return result;
}

async function getUserInfo(user_id){
    const sql = `
        SELECT USER_ID, STUDENT_ID, INITCAP(NAME) NAME, EMAIL, DEPARTMENT, 
        DATE_OF_BIRTH, INITCAP(HALL) HALL, HALL_ATTACHMENT, BATCH, 
        INITCAP(STREET) STREET, INITCAP(CITY) CITY, POSTCODE,
        NVL(PROFILE_PIC, '${default_values.default_pfp}') "PROFILE_PIC"
        FROM USERS
        WHERE USER_ID = :user_id
    `;

    const binds = {
        user_id:user_id
    }

    const result = (await database.execute(sql,binds)).rows[0];
    return result;

}

async function createConversation(user_id){
    const sql = `
        BEGIN
        CREATE_CONVERSATION(:user_id,:result);
        END;
    `;
    let binds = {
        user_id: user_id,
        result: {
            dir: oracledb.BIND_OUT, 
            type: oracledb.NUMBER
        }
    }
    const result = (await database.execute(sql,binds)).outBinds;
    return result.result;
}

async function createConversationMember(user_id,newconvoid){
    const sql = `
        INSERT INTO CONVERSATION_MEMBERS(CONVERSATION_ID,USER_ID,STATUS)
        VALUES(:newconvoid,:user_id,'U')
    `;
    const binds = {
        newconvoid:newconvoid,
        user_id:user_id
    }
    const result = (await database.execute(sql,binds));

    return newconvoid;
}


module.exports = {
    getConversationList,
    getPartnerName,
    getMessagesList,
    insertMessage,
    deleteMessage,
    getUsersListForMessageSearch,
    getConversationIdByUserId,
    getUserInfo,
    createConversation,
    createConversationMember,
    getMessageByMessageId
}