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
    socket.on('kisu',msg=>{
        const message = 'paisi';
        console.log("from kisu");
        socket.to(msg).emit("message",message);
    })
  });
};

exports.sendMessage = (roomId, key, message) => io.to(roomId).emit(key, message);
exports.sendNofification = (roomId,key,data) => io.to(roomId).emit(key,data);

exports.getRooms = () => io.sockets.adapter.rooms;