require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const DB_message = require('../../db-codes/message/db-message-api.js');
const constant_values = require('../../db-codes/constant_values');
const { sendMessage } = require('../../middlewares/socketConnect');


router.get('/',verify,async (req,res)=>{
    const currentUser = req.user;
    const chat_list = await DB_message.getConversationList(req.user.USER_ID);
    const image_list = [];
    for(let chat of chat_list){
        if(chat.NAME == null){
            const name = await DB_message.getPartnerName(chat.CONVERSATION_ID,req.user.USER_ID);
            chat.NAME = name.NAME;
            image_list.push(name.PROFILE_PIC);
        }
        let namelength = chat.NAME.split(" ");
        namelength = namelength[0];
        if(chat_list.USER_ID === req.user.USER_ID)
            namelength = "YOU";
        namelength = namelength.length;
        if(chat.TEXT !== null && chat.TEXT.length > Math.max(18-namelength,0))
                chat.TEXT = chat.TEXT.slice(0,Math.max(18-namelength,0))+ "...";
    }
    let data = {
        currentUser: currentUser,
        chat_list: chat_list,
        image_list: image_list
    }
    res.render('message',data);
})

router.post('/getChatList',verify,async (req,res) =>{
    const currentUser = req.user;
    const chat_list = await DB_message.getConversationList(req.body.user_id);
    const image_list = [];
    for(let chat of chat_list){
        if(chat.NAME == null){
            const name = await DB_message.getPartnerName(chat.CONVERSATION_ID,req.user.USER_ID);
            chat.NAME = name.NAME;
            image_list.push(name.PROFILE_PIC);
        }
        let namelength = chat.NAME.split(" ");
        namelength = namelength[0];
        if(chat_list.USER_ID === req.user.USER_ID)
            namelength = "YOU";
        namelength = namelength.length;
        if(chat.TEXT !== null && chat.TEXT.length > Math.max(18-namelength,0))
                chat.TEXT = chat.TEXT.slice(0,Math.max(18-namelength,0))+ "...";
    }
    let data = {
        currentUser: currentUser,
        chat_list: chat_list,
        image_list: image_list
    }
    res.send(data);
})

router.post('/getMessages',verify,async (req,res)=>{
    const result = await DB_message.getMessagesList(req.body.chat_id, constant_values.message_limit, req.body.first_message_id);
    let data = {
        currentUser : req.user,
        messages : result
    }
    res.send(data);
})

router.post('/insertMessage',verify,async (req,res) => {
    const result = await DB_message.insertMessage(req.body.message);
    const users = await DB_message.getPartnerName(req.body.message.chat_id,req.user.USER_ID);
    const msg = await DB_message.getMessageByMessageId(result);
    let room = users.USER_ID.toString();
    let key = "message";
    let m = {
        chat_id: req.body.message.chat_id,
        message: msg,

    }
    sendMessage(room,key,m);

    res.send({result:result});
})

router.post('/getUsersList',verify,async (req,res)=>{
    const result = await DB_message.getUsersListForMessageSearch(req.body.input,req.body.currentUser);
    res.send({result:result});
})

router.post('/deleteMessage',verify,async (req,res)=>{
    console.log(req.body);
    const result = await DB_message.deleteMessage(req.body.message_id);
    const users = await DB_message.getPartnerName(req.body.chat_id,req.user.USER_ID);
    console.log(users);
    const msg = await DB_message.getMessageByMessageId(req.body.message_id);
    let room = users.USER_ID.toString();
    let key = "message";
    console.log(msg);
    let m = {
        chat_id: req.body.chat_id,
        message: msg,

    }
    console.log(m);
    console.log(m);
    sendMessage(room,key,m);
    res.send({result:result});
})

router.post('/getConversationIdByUserId',verify,async (req,res)=>{
    const result = (await DB_message.getConversationIdByUserId(req.body.user_id,req.body.currentUser));
    res.send({result:result});
})

router.post('/getUserInfo',verify,async (req,res) =>{
    const result = (await DB_message.getUserInfo(req.body.user_id));
    res.send({result:result});
})

router.post('/createConversation',verify,async (req,res) =>{
    const result = (await DB_message.createConversation(req.body.user_id,req.body.currentUser));
    const result2 = (await DB_message.createConversationMember(req.body.user_id,result));
    const result3 = (await DB_message.createConversationMember(req.body.currentUser,result));
    res.send({result:result});
})

module.exports = router;