const express = require("express");
const http = require("http");
const socket = require("socket.io");
const mongoose = require("mongoose");
const passport = require("passport");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const Student = require("./models/Student");
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config({ path: path.resolve(__dirname, ".env") });
const keys = require("./config/key");

//Setup Middlewares
const app = express();
let server = http.createServer(app);
let io = socket(server);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  fileUpload({
    abortOnLimit: true,
    limits: {
      fileSize: 5 * 1024 * 1024,
      fieldSize: 7 * 1024 * 1024,
      fields: 20,
      files: 2,
      parts: 22,
    },
  })
);
app.use(cors());
app.use(passport.initialize());
require("./config/passport")(passport);

io.use(async (socket, next) => {
  try {
    const authorization = socket.handshake.auth?.token;
    const token =
      typeof authorization === "string"
        ? authorization.replace(/^Bearer\s+/i, "")
        : "";
    if (!token) return next(new Error("Authentication required"));

    const payload = jwt.verify(token, keys.secretOrKey);
    const student = await Student.findById(payload.id)
      .select("_id name registrationNumber")
      .lean();
    if (!student) return next(new Error("Student access required"));

    socket.data.student = student;
    return next();
  } catch (err) {
    return next(new Error("Authentication required"));
  }
});

//Socket IO setup
io.on("connection", (socket) => {
  socket.data.authorizedRooms = new Set();

  socket.on("join room", async ({ room1, room2 } = {}) => {
    try {
      const parseRoom = (room) => {
        if (typeof room !== "string") return null;
        const participants = room.split(".");
        if (
          participants.length !== 2 ||
          !participants[0] ||
          !participants[1] ||
          participants[0] === participants[1]
        ) {
          return null;
        }
        return participants;
      };

      const firstRoom = parseRoom(room1);
      const secondRoom = parseRoom(room2);
      const registrationNumber = socket.data.student.registrationNumber;
      if (
        !firstRoom ||
        !secondRoom ||
        !firstRoom.includes(registrationNumber) ||
        secondRoom[0] !== firstRoom[1] ||
        secondRoom[1] !== firstRoom[0]
      ) {
        return;
      }

      const otherRegistrationNumber = firstRoom.find(
        (participant) => participant !== registrationNumber
      );
      const otherStudentExists = await Student.exists({
        registrationNumber: otherRegistrationNumber,
      });
      if (!otherStudentExists) return;

      socket.data.authorizedRooms.add(room1);
      socket.data.authorizedRooms.add(room2);
      await Promise.all([socket.join(room1), socket.join(room2)]);
    } catch (err) {
      console.error("Unable to authorize chat room", err.message);
    }
  });
  socket.on("private message", (data = {}) => {
    if (
      typeof data.room !== "string" ||
      !socket.data.authorizedRooms.has(data.room) ||
      typeof data.message !== "string" ||
      !data.message.trim() ||
      data.message.length > 2000
    ) {
      return;
    }

    io.to(data.room).emit("new Message", {
      message: data.message.trim(),
      sender: socket.data.student.name,
      senderRegistrationNumber: socket.data.student.registrationNumber,
      createdAt: new Date(),
    });
  });
  socket.on("disconnect", function () {
    console.log("Socket disconnected");
  });
});

let _response = {};

//Routes
const adminRoutes = require("./routes/adminRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const studentRoutes = require("./routes/studentRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);

app.get("/", (req, res) => {
  const status = _response.database === "Healthy" ? 200 : 503;
  return res.status(status).json(_response);
});

//404 Route Error
app.use((req, res, next) => {
  const error = new Error("Invalid Route");
  error.status = 404;
  next(error);
});

//Error Handler
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

const PORT = process.env.PORT || 5000;

//Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then((data) => {
    _response.database = "Healthy";
    console.log(`MongoDB connected with server ${data.connection.host}`);
  })
  .catch((err) => {
    console.log("Error in connecting to MongoDB", err.message);
  });

//Start Server
server.listen(PORT, () => {
  _response.server = "Healthy";
  console.log(`Server running on port: ${PORT}`);
});
