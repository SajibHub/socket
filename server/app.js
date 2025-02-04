import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true 
    }
});

let users = {};

const updateUsers = () => {
    Object.keys(users).forEach((userId) => {
        const userList = Object.keys(users).filter(id => id != userId);
        io.to(userId).emit("user_list", userList);
    });
};


io.on('connection', (socket) => {
    const userId = socket.handshake.query.id;
    if (userId) {
        users[userId] = socket.id;
        updateUsers(userId); 
    }

    socket.on('private_message', (data) => {
        const { recipientId, message } = data;
        const recipientSocketId = users[recipientId];
      
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('private_message', {
            senderId: userId,
            message: message,
            status: "delivered",
          });
        } else {
          console.log(`User ${recipientId} not found`);
        }
    });
      
    socket.on('disconnect', () => {
        if (userId) {
            delete users[userId];
            console.log(`User disconnected: ${userId}`);
            updateUsers(); 
        }
    });

    socket.emit("user_list", Object.keys(users).filter(id => id !== userId));
});


server.listen(3030, () => {
    console.log("Server is running on port 3030");
});
