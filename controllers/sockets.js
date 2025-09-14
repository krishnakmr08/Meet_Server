const Session = require("../models/session");

const webRTCSignalingSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

   




    
  });
};

module.exports = webRTCSignalingSocket;
