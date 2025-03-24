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
    io.emit("user_list", Object.keys(users));
};

io.on('connection', (socket) => {
    // When a user connects, they need to join with a userId
    socket.on('join', (userId) => {
        if (userId) {
            // Store the user with their socket id
            users[userId] = socket.id;
            // Join a room specific to this user
            socket.join(userId);
            console.log(`User ${userId} joined`);
            updateUsers();
            
            // Send current user list to the newly connected user
            socket.emit("user_list", Object.keys(users).filter(id => id !== userId));
        }
    });

    socket.on('private_message', (data) => {
        const { recipientId, message, senderId } = JSON.parse(data);
        
        // Send message to the recipient's room
        if (recipientId && users[recipientId]) {
            io.to(recipientId).emit('private_message', {
                senderId: senderId,
                message: message,
                status: "delivered",
            });
        }
    });

    socket.on('disconnect', () => {
        // Find and remove the user from the users object
        const userId = Object.keys(users).find(id => users[id] === socket.id);
        if (userId) {
            delete users[userId];
            console.log(`User disconnected: ${userId}`);
            updateUsers();
        }
    });
});

server.listen(3030, () => {
    console.log("Server is running on port 3030");
});