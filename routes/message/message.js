require('dotenv').config();
const router = require('express').Router();
const { verify } = require('../../middlewares/user-verification.js');
const DB_message = require('../../db-codes/message/db-message-api.js');


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
    const result = await DB_message.getMessagesList(req.body.chat_id);
    let data = {
        currentUser : req.user,
        messages : result
    }
    res.send(data);
})

router.post('/insertMessage',verify,async (req,res) => {
    const result = await DB_message.insertMessage(req.body.message);
    res.send({result:result});
})

router.post('/getUsersList',verify,async (req,res)=>{
    const result = await DB_message.getUsersListForMessageSearch(req.body.input,req.body.currentUser);
    res.send({result:result});
})

router.post('/deleteMessage',verify,async (req,res)=>{
    const result = await DB_message.deleteMessage(req.body.message_id);
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
    console.log(result," ----------inside message.js");
    const result2 = (await DB_message.createConversationMember(req.body.user_id,result));
    const result3 = (await DB_message.createConversationMember(req.body.currentUser,result));
    res.send({result:result});
})

module.exports = router;