let io;
exports.socketConnection = (server) => {
  io = require('socket.io')(server);
  io.on('connection', (socket) => {
    console.info(`Client connected`);
    socket.on('handshake', function(data) {
        socket.join(data);
    });
    socket.on('disconnect',() => {
         console.log(socket.id," disconnected");    
    });
  });
};

exports.sendMessage = (roomId, key, message) => io.to(roomId).emit(key, message);
exports.sendNofification = (roomId,key,data) => io.to(roomId).emit(key,data);
exports.notification = (ar)=>{
    console.log("ready to send notification");
    for(let i=0;i<ar.length;i++){
        let room = ar[i].RECEIVER_ID;
        let key = "notification";
        console.log(ar[i]);
        //io.to(room).emit(key,ar[i]);
    }
}
exports.getRooms = () => io.sockets.adapter.rooms;