const { Server } = require("socket.io");
require('dotenv').config();
const io = new Server(8000, { 
    cors: {
        origin: process.env.CLIENT_URL, // Replace with your frontend origin
        methods: ["GET", "POST"], // Allowed HTTP methods
        credentials: true 
    } 
});

const emailToId = new Map();
const idToEmail = new Map();

io.on("connection", (socket) => {
    console.log(socket.id);
    socket.on('room-join', (data) => {
        const { email, room } = data;

        emailToId.set(email, socket.id);
        idToEmail.set(socket.id, email);

        socket.join(room);

        io.to(room).emit('user-joined', { email, id: socket.id })
        io.to(socket.id).emit("room-join", data);
    })

    socket.on("user-call", ({to, offer}) => {
        io.to(to).emit('incoming-call', { from: socket.id, offer })
    })

    socket.on('call-accepted', ({ to, ans }) => {
        io.to(to).emit("call-accepted", { from: socket.id, ans });
    })
    
    socket.on('peer-negotiation-needed', ({ to, offer }) => {
        io.to(to).emit("peer-negotiation-needed", { from: socket.id, offer });
    })

    socket.on('peer-negotiation-done', ({ to, ans }) => {
        io.to(to).emit("peer-negotiation-final", { from: socket.id, ans });
    })

    socket.on('end-call', ({ to }) => {
        io.to(to).emit('end-call');
    })

    socket.on('disconnect', () => {
        const email = idToEmail.get(socket.id);
        if (email) {
            emailToId.delete(email);
            idToEmail.delete(socket.id);
            console.log(`User disconnected: ${email}`);
        }
    });
})