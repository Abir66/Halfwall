const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const ejs = require("ejs");
const multer = require('multer');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './public')))

// setting up server for socket.io
const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server);

io.on('connection',socket => {
    // console.log("New connection detected");
    // console.log(socket.id);
	// socket.on('kisu', msg =>{
    //     console.log("got something");
    //     io.to(socket.id).emit('sendMessage','keman asa vaya');
    // })
    // socket.on('disconnect',() => {
    //     console.log("disconnecting  ",socket.id);
        
    // });
})


// import routers

// users routers
const auth = require('./routes/users/auth');
const user = require('./routes/users/user');
const followRoute = require('./routes/users/follow');
const post = require('./routes/posts/post');
const marketplace = require('./routes/groups/marketplace');



// newsfeed routers
const newsfeed = require('./routes/newsfeed/newsfeed');

// group routers
const group = require('./routes/groups/groups');

// message routers
const messages = require('./routes/message/message');



// middlewares
app.use('/auth', auth);
app.use('/newsfeed', newsfeed);
app.use('/user', user);
app.use('/follow', followRoute);
app.use('/posts', post);
app.use('/groups', group);
app.use('/marketplace', marketplace);
app.use('/message',messages);



// default error handler
app.use((err, req, res, next) => {
    console.log(err);
    if(err) res.status(500).send(err.message);
    else res.send('success')
})


const port = process.env.PORT || 5000;
server.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
})