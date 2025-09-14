const Session = require("../models/session");

const webRTCSignalingSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  

    socket.on("prepare-session", async ({ sessionId, userId }) => {
      console.log(`User ${userId} is preparing to join session ${sessionId}`);

      const session = await Session.findOne({ sessionId });

      if (session) {
        socket.join(sessionId);
        console.log(`User ${userId} is observing session ${sessionId}`);

        socket.emit("session-info", {
          participants: session?.participants,
        });
        socket.on("disconnect", async () => {
          console.log(
            `Observer ${userId} disconnected from session ${sessionId}`
          );
        });
      } else {
        console.log(`Session with ID ${sessionId} not found`);
        socket.emit("error", { message: "Session not found" });
      }
    });
   
     socket.on(
      "join-session",
      async ({ sessionId, userId, name, photo, micOn, videoOn }) => {
        console.log(
          `User ${name} (${userId}) is attempting to join session ${sessionId}`
        );

        const session = await Session.findOne({ sessionId });
        if (session) {
          const existingParticipantIndex = session.participants.findIndex(
            (p) => p.userId === userId
          );

          if (existingParticipantIndex !== -1) {
            session.participants[existingParticipantIndex] = {
              ...session.participants[existingParticipantIndex],
              name: name || session.participants[existingParticipantIndex].name,
              photo:
                photo || session.participants[existingParticipantIndex].photo,
              micOn: micOn,
              videoOn: videoOn,
              socketId: socket.id,
            };
          } else {
            const participant = {
              userId,
              name,
              photo,
              socketId: socket.id,
              micOn: micOn,
              videoOn: videoOn,
            };
            session.participants.push(participant);
          }
          await session.save();
          socket.join(sessionId);

          console.log(
            `User ${name} (${userId}) has joined session ${sessionId}`
          );

          io.to(sessionId).emit(
            "new-participant",
            session.participants?.find((i) => i.userId === userId)
          );
          io.to(sessionId).emit("session-info", {
            participants: session.participants,
          });
        } else {
          console.log(`Session with ID ${sessionId} not found`);
          socket.emit("error", { message: "Session not found" });
        }
      }
    );



     socket.on("current-room", async ({ sessionId }) => {
      console.log("Asking for room participants");
      const session = await Session.findOne({ sessionId });

      io.to(sessionId).emit("all-participants", session?.participants);
    });

    socket.on("send-offer", async ({ sessionId, sender, receiver, offer }) => {
      console.log(
        `User ${sender} is sending an offer ${receiver} to session ${sessionId}`
      );
      io.to(sessionId).emit("receive-offer", { sender, receiver, offer });
    });




  });
};

module.exports = webRTCSignalingSocket;
