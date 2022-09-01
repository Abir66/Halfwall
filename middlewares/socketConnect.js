let io;
exports.socketConnection = (server) => {
  io = require('socket.io')(server);
  io.on('connection', (socket) => {
    console.info(`Client connected`);
    socket.on('handshake', function(data) {
        socket.join(data);
    });
    socket.on('disconnect',() => {
         //console.log(socket.id," disconnected");    
    });
  });
};

exports.sendMessage = (roomId, key, message) => io.to(roomId).emit(key, message);
exports.sendNofification = (roomId,key,data) => io.to(roomId).emit(key,data);


const notification_sender = async function emitNotifications(notifications){
console.log("ready to send notification");
    console.log(notifications, 'hreeeeee');
    for(let notification of notifications){
      // convert to string

        let room = notification.RECEIVER_ID.toString();
        let key = "notification";
        
        io.to(room).emit(key,notification);
    }

}

exports.notification_sender = notification_sender;
    
exports.getRooms = () => io.sockets.adapter.rooms;