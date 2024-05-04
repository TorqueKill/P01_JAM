const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const Server = require("socket.io").Server;

// creating supabase client
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const userAuth = require("./userAuth");

const _consts = require("./config");

const supabaseUrl = _consts.SUPABASE_URL;
const supabaseKey = _consts.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

let corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "X-Requested-With",
    "Accept",
    "x-auth-token",
  ],
};

app.use(cors(corsOptions));

const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.use("/auth", userAuth(supabase), cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

//quiz is defined as an array of objects with the following properties: question, answer, choices
//quiz = [{question: "question", answer: "answer", choices: ["choice1", "choice2", "choice3", "choice4"]}, ...], timeLimit: 30]

//rooms = [{roomid: "roomid", users: [socketid, socketid, socketid...], host: socketid, quiz: quiz, answers:[], gameStarted: false, sessionLoaded: [], scores: [], maxPlayers: MIN_PLAYERS_PER_LOBBY, usersNames: [name, name, name...]}]}]
let rooms = [];

//users = [{socketid: socketid, name: name, roomid: roomid, email: email, vegetativeState: true/false}]
let users = [];

const MAX_PLAYERS_PER_LOBBY = _consts.MAX_PLAYERS_PER_LOBBY;
const MIN_PLAYERS_PER_LOBBY = _consts.MIN_PLAYERS_PER_LOBBY;
const TIME_PER_QUESTION = _consts.TIME_PER_QUESTION; //seconds
const LAG_BIAS = _consts.LAG_BIAS; //seconds
const DEFAUL_PLAYER_NAME = _consts.DEFAUL_PLAYER_NAME;
const REPORT_DISPLAY_TIME = _consts.REPORT_DISPLAY_TIME;

//<-------------------------SERVER FUNCTIONS------------------------->

//TODO LATER: add error handling for all functions
function getRoom(roomid) {
  return rooms.find((room) => room.roomid === roomid);
}

function getRoomIndex(roomid) {
  return rooms.findIndex((room) => room.roomid === roomid);
}

function addUserToRoom(roomid, socketid) {
  try {
    let room = getRoom(roomid);
    if (room) {
      room.users.push(socketid);
    } else {
      rooms.push({
        roomid: roomid,
        users: [socketid],
        host: socketid,
        quiz: [],
        answers: {},
        responseTimes: {},
        gameStarted: false,
        sessionLoaded: [],
        scores: [],
        maxPlayers: MIN_PLAYERS_PER_LOBBY,
        usersNames: {},
        timeOutIds: [],
        startTimeStampOfTimer: -1, // timestamp in milliseconds when the timer was started
        pauseTimerTime: -1,     // time elapsed in seconds when the timer was paused since the start of timer
        questionsPerReport: -1,
        ROOM_LAG_BIAS: 0,
        currentQuestion: -1,
        displayQuestion: false,
        
      });
    }
  } catch (e) {
    console.log(e);
  }
}

function getPlayerNum(roomid) {
  try {
    let room = getRoom(roomid);
    if (room) {
      if (room.host) {
        return room.users.length - 1;
      } else {
        return room.users.length;
      }
    } else {
      return 0;
    }
  } catch (e) {
    console.log(e);
  }
}

function setScores(roomid, scores) {
  let room = getRoom(roomid);
  if (room) {
    room.scores = scores;
  }
}

function removeUserFromRoom(roomid, socketid) {
  try {
    let room = getRoom(roomid);
    if (room) {
      let index = room.users.findIndex((id) => id === socketid);
      if (index !== -1) {
        room.users.splice(index, 1);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

function removeRoom(roomid) {
  try {
    let index = getRoomIndex(roomid);
    if (index !== -1) {
      rooms.splice(index, 1);
    }
  } catch (e) {
    console.log(e);
  }
}

//make sure id is unique
function makeid(length) {
  let unique = false;
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  while (!unique) {
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    unique = !rooms.find((room) => room.roomid === result);
  }
  return result;
}

function getRoomQuiz(roomid) {
  let room = getRoom(roomid);
  if (room) {
    return room.quiz;
  } else {
    return null;
  }
}

function setRoomQuiz(roomid, quiz) {
  let room = getRoom(roomid);
  if (room) {
    room.quiz = quiz;
  }
}

function setQuestionTimeOut(roomid, timeoutId) {
  let room = getRoom(roomid);
  if (room) {
    room.timeOutIds.push(timeoutId);
    room.startTimeStampOfTimer = Date.now();
  }
}

function setRoomMaxPlayers(roomid, maxPlayers) {
  let room = getRoom(roomid);
  if (room) {
    room.maxPlayers = maxPlayers;
  }
}

function setQuestionsPerReport(roomid, questionsPerReport) {
  let room = getRoom(roomid);
  if (room) {
    room.questionsPerReport = questionsPerReport;
  }
}

function getRoomMaxPlayers(roomid) {
  let room = getRoom(roomid);
  if (room) {
    return room.maxPlayers;
  } else {
    return MIN_PLAYERS_PER_LOBBY;
  }
}

function setRoomCurrentQuestion(roomid, questionIndex) {
  let room = getRoom(roomid);
  if (room) {
    room.currentQuestion = questionIndex;
  }
}

function getRoomCurrentQuestion(roomid) {
  let room = getRoom(roomid);
  if (room) {
    return room.currentQuestion;
  } else {
    return -1;
  }
}

function setRoomDisplayQuestion(roomid, displayQuestion) {
  let room = getRoom(roomid);
  if (room) {
    room.displayQuestion = displayQuestion;
  }
}

function makeDummyStringList(length) {
  let result = [];
  for (let i = 0; i < length; i++) {
    result.push("");
  }
  return result;
}

function handleAnswer(roomid, socketid, answer, questionIndex, timeAnswered) {
  try {
    // if questionIndex is -1, that means user has re-connected so get the current question index

    // if (questionIndex === -1) {
    //   questionIndex = getRoomCurrentQuestion(roomid);
    // }

    let room = getRoom(roomid);
    let choicesIdx = answer;

    if (room) {
      if (!room.answers[socketid]) {
        //
        room.answers[socketid] = makeDummyStringList(room.quiz.length);
      }

      if (!room.responseTimes[socketid]) {
        room.responseTimes[socketid] = makeDummyStringList(room.quiz.length);
      }


      let answer = room?.quiz[questionIndex]?.choices[choicesIdx];

      //if answer is undefined, set answer to a default value
      if (!answer) {
        // answer = room.quiz[questionIndex].choices[0];
        answer = "default_value_time_ran_out";

        // time ran out so respone time is 0
        responseTime = 0;
        room.responseTimes[socketid][questionIndex] = responseTime;
        console.log("time remaining: ", responseTime);
        
      } else {
        // player answered so repsonse time is time limit - timeAnswered
        responseTime = room.quiz[questionIndex].timeLimit - timeAnswered;
        room.responseTimes[socketid][questionIndex] = responseTime;
        console.log("time remaining: ", responseTime);
      }

      // if answerIndex -1 then that means time ran out for that user
      // so answer is set to emtpy string

      // if (answerIndex === -1) {
      //   answer = 'default_value_time_ran_out';
      // }

      room.answers[socketid][questionIndex] = answer;
    }
  } catch (e) {
    console.log(e);
  }
}

function checkAllAnswered(roomid, questionIndex) {
  try {
    let room = getRoom(roomid);
    if (room) {
      let numAnswers = 0;
      //console.log(room.answers);
      for (let key in room.answers) {
        console.log(key, room.answers[key])
        if (room.answers[key][questionIndex]) {
          numAnswers++;
        }
      }
      if (numAnswers === room.users.length - 1) {
        return true;
      }

      //check users in vegetative state
      //console.log(users);
      //console.log(room.users);

      let numVegetative = 0;
      for (let i = 0; i < room.users.length; i++) {
        if (
          users.find((user) => user.socketid === room.users[i])?.vegetativeState
        ) {
          numVegetative++;
        }
      }

      console.log("num vegetative: " + numVegetative);

      //combine numAnswers and vegetative state
      if (numAnswers + numVegetative === room.users.length - 1) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.log(e);
  }
}

//returns true if for a given question, they are the first to answer
function checkFirstToAnswer(roomid, questionIndex) {
  try {
    let room = getRoom(roomid);
    if (room) {
      let numAnswers = 0;
      for (let key in room.answers) {
        if (room.answers[key][questionIndex]) {
          numAnswers++;
        }
      }
      if (numAnswers === 1) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.log(e);
  }
}

//returns a list of socketids of people who answered a given question
function getPeopleWhoAnswered(roomid, questionIndex) {
  try {
    let room = getRoom(roomid);
    if (room) {
      let people = [];
      for (let key in room.answers) {
        if (room.answers[key][questionIndex]) {
          people.push(key);
        }
      }
      return people;
    }
  } catch (e) {
    console.log(e);
  }
}

function getScoresTillQuestion(roomid, questionIndex, socketid) {
  try {
    let room = getRoom(roomid);
    if (room) {
      let scores = [];
      //return scores for user with socketid, till questionIndex
      for (let i = 0; i < questionIndex; i++) {
        if (room.answers[socketid]) {
          if (room.quiz[i].answer === room.answers[socketid][i]) {
            scores.push(1);
          } else {
            scores.push(0);
          }
        }
      }

      console.log("scores till question: " + scores);

      return scores;
    }
  } catch (e) {
    console.log(e);
  }
}

//for each id, get the number of correct answers in the form of a list of 1s and 0s = [1, 0, 1, 1, 0, 1, 0, 1, 1, 1] where length = number of questions
function getFinalScores(roomid, socketid) {
  try {
    let room = getRoom(roomid);
    let scores = [];
    if (room) {
      if (room.answers[socketid]) {
        let quiz = room.quiz;
        let answers = room.answers[socketid];
        for (let i = 0; i < quiz.length; i++) {
          if (quiz[i].answer === answers[i]) {
            scores.push(1);
          } else {
            scores.push(0);
          }
        }
      }
    }
    return scores;
  } catch (e) {
    console.log(e);
  }
}

function setUser(socketid, roomid, name, email, avatarIndex) {
  let room = getRoom(roomid);
  if (room) {
    room.usersNames[socketid] = name;
    users.push({
      socketid: socketid,
      name: name,
      roomid: roomid,
      email: email,
      vegetativeState: false,
      dummyUser: false, // this is set to true for the case when game has less than max players before starting
      justReconnected: false,
      avatarIndex: avatarIndex,
    });
  }
}

function setDummyUser(roomid, socketid, name, email, avatarIndex) {
  let room = getRoom(roomid);
  if (room) {
    room.usersNames[socketid] = name;
    users.push({
      socketid: socketid,
      name: name,
      roomid: roomid,
      email: email,
      vegetativeState: true,
      dummyUser: true,
      justReconnected: false,
      avatarIndex: avatarIndex,
    });
  }
}

function removeName(socketid, roomid) {
  try {
    let room = getRoom(roomid);
    let _name = users.find((user) => user.socketid === socketid).name;
    if (room) {
      //find matching name in room.usersNames and remove it
      for (let key in room.usersNames) {
        if (room.usersNames[key] === _name) {
          delete room.usersNames[key];
          break;
        }
      }
    }
    //remove user from users
    let index = users.findIndex((user) => user.socketid === socketid);
    if (index !== -1) {
      users.splice(index, 1);
    }
  } catch (e) {
    console.log(e);
  }
}

function getName(socketid) {
  let user = users.find((user) => user.socketid === socketid);
  if (user) {
    return user.name;
  } else {
    return DEFAUL_PLAYER_NAME;
  }
}

//all users are marked with their socketid (including host)

function getAllUsers(roomid, includeHost) {
  let room = getRoom(roomid);
  let names = [];
  if (room) {
    for (let key in room.usersNames) {
      if (includeHost || key !== room.host) {
        //find avatar index else set to 0
        if (users.find((user) => user.socketid === key)) {
          let avatarIndex = users.find(
            (user) => user.socketid === key
          )?.avatarIndex;
          if (avatarIndex === undefined) {
            avatarIndex = 0;
          }
          names.push({ name: room.usersNames[key], avatarIndex: avatarIndex });
        } else {
          names.push({ name: room.usersNames[key], avatarIndex: 0 });
        }
      }
    }
  }
  return names;
}
function getPlayersAnswered(roomid, questionIndex) {
  try {
    let room = getRoom(roomid);
    if (room) {
      let numAnswers = 0;
      //console.log(room.answers);
      for (let key in room.answers) {
        console.log("Question Index: ", questionIndex);
        console.log(key, room.answers[key])
        if (room.answers[key][questionIndex]) {
          numAnswers++;
        }
      }
      console.log("NumAnswers: ", numAnswers);

      // Count the total number of players (excluding the host)
      let totalPlayers = room.users.length - 1;

      // Emit the total number of players and the number of players who have answered
      return { numAnswers, totalPlayers };
    }
  } catch (e) {
    console.log(e);
  }
}

function reconnectionInit(roomid, socketid, email, name, avatarIndex) {
  try {
    if (email === undefined || email === "") {
      return false;
    }

    //check if user was in room before
    let user = users.find(
      (user) => user.email === email && user.roomid === roomid
    );
    if (user) {
      //note that user.socketid is the old socketid

      //update socketid in room
      let room = getRoom(roomid);
      if (room) {
        let index = room.users.findIndex((id) => id === user.socketid);
        if (index !== -1) {
          room.users[index] = socketid;
        }
      }

      //update socketid in usernames so new id maps to old name, delete old key
      // let name = getName(user.socketid);
      // room.usersNames[socketid] = name;
      // delete room.usersNames[user.socketid];

      // commented out the above as the username can be different upon re-join

      room.usersNames[socketid] = name;
      delete room.usersNames[user.socketid];

      //update socketid in answers
      console.log("Deleting old socketid from answers");
      let answers = room.answers[user.socketid];

      if (answers) {
        room.answers[socketid] = answers;
        delete room.answers[user.socketid];
      } else {
        room.answers[socketid] = makeDummyStringList(room.quiz.length);
      }


     

      //update avatar index in users
      user.avatarIndex = avatarIndex;
      console.log("Avatar index: " + user.avatarIndex)

      // updating username
      user.name = name;

     


      //update socketid in users
      user.socketid = socketid;
    } else {
      return false;
    }

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function lateConnectionInit(roomid, socketid, email, name, avatarIndex) {

  try {
    
    // finding a dummy user that has vegetative state as true

    let user = users.find(
       (user) => user.dummyUser === true && user.vegetativeState === true 
       && user.roomid === roomid
    );

    if (user) {

      let room = getRoom(roomid);
      if (room) {
        let index = room.users.findIndex((id) => id === user.socketid);
        if (index !== -1) {
          room.users[index] = socketid;
        }
      }

      //update socketid in usernames so new id maps to new name, delete old key
      // let name = getName(user.socketid);
      room.usersNames[socketid] = name;
      delete room.usersNames[user.socketid];

      //update socketid in answers
      console.log("Deleting old socketid from answers");
      let answers = room.answers[user.socketid];

      if (answers) {

        room.answers[socketid] = answers;
        delete room.answers[user.socketid];
      } else {
        room.answers[socketid] = makeDummyStringList(room.quiz.length);
      }


      // room.answers[socketid] = answers;
      // delete room.answers[user.socketid];

      //update avatar index in users
      user.avatarIndex = avatarIndex;

      //update socketid in users
      user.socketid = socketid;

      // update name and email
      user.name = name;
      user.email = email

      // now this is not a dummy user
      user.dummyUser = false;

    } else {
      return false;


    }

    return true;
  }

  catch (e) {

    console.log(e);
    return false;

  }
}



function checkSessionLoaded(roomid) {
  //check if all users have loaded session
  //treat users in vegetative state as loaded
  try {
    let room = getRoom(roomid);
    if (room) {
      if (room.sessionLoaded.length === room.users.length) {
        return true;
      }

      // print all the user names and vegetative state of users in the room


      for (let i = 0; i < room.users.length; i++) {
        console.log("User: " + room.users[i] + " vegetative state: " + users.find((user) => user.socketid === room.users[i])?.vegetativeState);
      }
      

      //check users in vegetative state
      let numVegetative = 0;
      for (let i = 0; i < room.users.length; i++) {
        if (
          users.find((user) => user.socketid === room.users[i])?.vegetativeState
        ) {
          numVegetative++;
        }
      }

      console.log("num vegetative in checkSessionLoaded fucntion: " + numVegetative)
      

      //combine sessionLoaded and vegetative state
      if (room.sessionLoaded.length + numVegetative === room.users.length) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function removeAllUsers(roomid) {
  //remove all users from users who are in roomid
  try {
    let room = getRoom(roomid);
    if (room) {
      for (let i = 0; i < room.users.length; i++) {
        let index = users.findIndex((user) => user.socketid === room.users[i]);
        if (index !== -1) {
          users.splice(index, 1);
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
}

//<-------------------------SERVER EVENTS ------------------------->

server.listen(process.env.PORT || 3001, () => {
  if (process.env.PORT) {
    console.log("listening on port " + process.env.PORT);
  } else {
    console.log("listening on port 3001");
  }
});

//TODO LATER: everytime a user is connected make sure they are sent to the home screen

io.on("connection", async (socket) => {
  console.log("a user connected with id: " + socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected");

    //emit to all users in room that user left and remove user from room

    //------------------------------------PERSISTANCE------------------------------------
    //if user emits disconnect, it means connection was lost, so do not remove user from room put the user in a vegetative state
    //user MUST emit a seperate leave room event to leave room so remove below code and put it in a seperate event

    //user is put in a vegetative state

    //TODO LATER: if host disconnects, everyone is kicked out of the room and the room is deleted

    //check if user is host
    let host = rooms.find((room) => room.host === socket.id);
    //clear all timeouts
    if (host) {
      for (let i = 0; i < host.timeOutIds.length; i++) {
        clearTimeout(host.timeOutIds[i]);
      }
      //delete room, emit to all users in room that room was deleted
      removeAllUsers(host.roomid);
      io.to(host.roomid).emit("room-deleted");
      removeRoom(host.roomid);
      console.log("removed host from room: " + host.roomid);
    }

    let room = rooms.find((room) => room.users.includes(socket.id));

    if (room) {
      //find user in users and set vegetative state to true
      let user = users.find((user) => user.socketid === socket.id);
      if (user) {
        user.vegetativeState = true;
      }

      return;

      //remove user from users
      removeName(socket.id, room.roomid);
      removeUserFromRoom(room.roomid, socket.id);

      //broadcast to all users in room that user left
      let playernum = getPlayerNum(room.roomid);
      let names = getAllUsers(room.roomid, false);
      io.to(room.roomid).emit("user-left", socket.id, playernum, names);
    }
  });

  socket.on("create-room", (quiz, roomSettings, userData) => {
    // create room and add user to it, check if room already exists then create new room and remove user from old room

    //first check if host already has a room
    let host = rooms.find((room) => room.host === socket.id);

    //if host already has a room, remove host from that room
    if (host) {
      removeRoom(host.roomid);
      console.log("removed host from room: " + host.roomid);
    }

    let name = userData.username;
    let email = userData.email;

    //create new room
    let roomid = makeid(6);
    socket.join(roomid);
    addUserToRoom(roomid, socket.id);
    setRoomQuiz(roomid, quiz);
    setRoomMaxPlayers(roomid, roomSettings.maxPlayers);
    setQuestionsPerReport(roomid, roomSettings.reportScores);
    setRoomDisplayQuestion(roomid, roomSettings.displayQuestion);
    setUser(socket.id, roomid, name, email, 0); //default avatar index is 0
    socket.emit("room-created", roomid);
    console.log("user created room: " + roomid);
    console.log("Quiz received, first question: " + quiz[0].question);
  });

  socket.on("join-room", (roomid, userData) => {
    //check if room is full or game has started, if so emit error

    //------------------------------------PERSISTANCE------------------------------------
    //if room is full, emit error and do not join room/ game started and is not logged in do same
    
    //DO FOLLOWING IF USER HAS LOGGED IN AND WAS IN A ROOM BEFORE:
    //if game has started, check if the user is was in the room before and if so, start user reconnection process
    //user reconnection process: reconnect-> next-question (current question)
    //make a function that gets the current question index given a roomid
    //when a previous user joins, they will have different socketid, so make sure to update the socketid in the room

    //NOTE dead/non responsive users in lobby are treated normal users, they are not removed from the room
    //TODO LATER: possibly remove them based on certain conditions/ timeout

    //check if room exists
    if (!getRoom(roomid)) {
      return;
    }

    let name = userData.username;
    let email = userData.email;
    let avatarIndex = userData.avatarIndex;

    if (!name) {
      name = DEFAUL_PLAYER_NAME;
    }

    //check if user logged in
    if (email === undefined || email === "") {
      //if game started, return
      if (getRoom(roomid).gameStarted) {
        socket.emit("room-full");
        return;
      }
    }

    

    if (reconnectionInit(roomid, socket.id, email, name, avatarIndex)) {
      //begin reconnection process
      console.log("reconnection process started: " + socket.id + email);
      console.log("avatarIndex: " + avatarIndex)
      socket.join(roomid);
      //get room quiz
      let quiz = getRoomQuiz(roomid);
      let data = {
        quiz: quiz,
        currentQuestion: getRoom(roomid).currentQuestion,
      };

      socket.emit("reconnect", data);
      return;
    }

    //check if room is full
    if (getRoom(roomid)?.users.length - 1 >= getRoomMaxPlayers(roomid)) {

      // check if there are dummy users in the room. If yes, then room has less than max players

      if (lateConnectionInit(roomid, socket.id, email, name, avatarIndex)) {

        //begin reconnection process
        console.log("late connection process started: " + socket.id + email);
        socket.join(roomid);
        //get room quiz
        let quiz = getRoomQuiz(roomid);
        socket.emit("late-connect", quiz);
        // let data = {
        //   quiz: quiz,
        //   currentQuestion: getRoom(roomid).currentQuestion,
        // };

        // socket.emit("late-connect", data);
        return;
      }


      socket.emit("room-full");
      return;
    }
    
    
    // if (getRoom(roomid).gameStarted) {

    //   // if game has started, add user to room and emit to all users in room that user joined
    //   console.log("user joined room: " + roomid);
    //   socket.join(roomid);
    //   addUserToRoom(roomid, socket.id);

    //   //emit to all users in room that user joined
    //   let playernum = getPlayerNum(roomid);
    //   let users = getAllUsers(roomid, false);
    //   io.to(roomid).emit("user-joined", socket.id, playernum, users);
    //   return;
    
    // }

    setUser(socket.id, roomid, name, email, avatarIndex);

    //add user to room and emit to all users in room that user joined
    console.log("user joined room: " + roomid);
    socket.join(roomid);
    addUserToRoom(roomid, socket.id);

    //emit to all users in room that user joined
    let playernum = getPlayerNum(roomid);
    let users = getAllUsers(roomid, false);

    io.to(roomid).emit("user-joined", socket.id, playernum, users);

    //if room is full, emit game start
    if (playernum >= getRoomMaxPlayers(roomid)) {
      rooms[getRoomIndex(roomid)].gameStarted = true;

      //start measuring lag bias as send this to all users
      rooms[getRoomIndex(roomid)].ROOM_LAG_BIAS = Date.now();

      roomSettings = {
        displayQuestion: getRoom(roomid).displayQuestion,
      };

      io.to(roomid).emit("game-start", getRoomQuiz(roomid), roomSettings);
    }
  });

  socket.on("force-start-game", (roomid) => {
    let room = getRoom(roomid);
    if (room) {
      rooms[getRoomIndex(roomid)].gameStarted = true;
      rooms[getRoomIndex(roomid)].ROOM_LAG_BIAS = Date.now();
      roomSettings = {
        displayQuestion: getRoom(roomid).displayQuestion,
      };

      remainingPlayers = getRoomMaxPlayers(roomid) - (room.users.length - 1);

      // adding remaining players as dummy users

      for (let i = 1; i < 1 + remainingPlayers; i++) {

        console.log("Adding dummy user: " + i + " to room: " + roomid)

        let dummyUser = {
          socketid: "dummy" + i,
          name: "dummy" + i,
          roomid: roomid,
          email: "dummy" + i + "@dummy.com",
          vegetativeState: true,
          dummyUser: true,
          justReconnected: false,
          avatarIndex: 0,
        }

        setDummyUser(dummyUser.roomid, dummyUser.socketid, dummyUser.name, dummyUser.email, dummyUser.avatarIndex);
        addUserToRoom(roomid, dummyUser.socketid);
      }

      io.to(roomid).emit("game-start", getRoomQuiz(roomid), roomSettings);
    }
  });

  socket.on("session-loaded", (roomid, screenid) => {
    console.log("session loaded: " + socket.id);
    let room = getRoom(roomid);
    if (room) {
      //count number of users that have loaded session, if all users have loaded session, emit next question

      //------------------------------------PERSISTANCE------------------------------------
      //TODO LATER: given a certain number of users have loaded, start a countdown timer and if all users have not loaded by the end of the timer, emit next question
      //TODO LATER: users not loaded will be in a vegetative state, new check should mark these users as loaded

      room.sessionLoaded.push(socket.id);
      if (checkSessionLoaded(roomid)) {
        console.log("all users have loaded session: " + screenid);

        //screen = 4 is game screen
        if (screenid == 4) {
          io.to(roomid).emit("next-question", 0);
          let playersData = { numAnswers: 0, totalPlayers: room.users.length - 1};
          io.to(roomid).emit("players-answered", playersData);
          

          setRoomCurrentQuestion(roomid, 0);

          //time difference between when game started and now in seconds
          let timeDiff = (Date.now() - room.ROOM_LAG_BIAS) / 1000;
          console.log("Time diff: " + timeDiff);

          //set lag bias which is the time difference between when game started and now
          //and now represents the time it took for all users to load the session
          rooms[getRoomIndex(roomid)].ROOM_LAG_BIAS = timeDiff;

          //get room quiz and timeLimit for first question
          let quiz = getRoomQuiz(roomid);
          let timeLimit = quiz[0].timeLimit;

          //timeout for the first question
          let timeoutId = setTimeout(() => {
            console.log("timeout for question: " + 0);
            io.to(roomid).emit("timeout", 1);
          }, (timeLimit + LAG_BIAS + timeDiff) * 1000);

          //set timeout id
          setQuestionTimeOut(roomid, timeoutId);

          //reset session loaded
          room.sessionLoaded = [];
        }

        if (screenid == 5) {
          io.to(roomid).emit("final-scores", room.scores);
          //reset session loaded
          room.sessionLoaded = [];
        }
      }
    }
  })

  socket.on("pause-timer", (roomid, questionIndex) => {
    let room = getRoom(roomid);
    if (room) {
      
      room.pauseTimerTime = (Date.now() - room.startTimeStampOfTimer) / 1000;
      clearTimeout(room.timeOutIds[questionIndex])
      room.timeOutIds.pop();

      io.to(roomid).emit("timer-paused", 1);
    }

  })

  socket.on("resume-timer", (roomid, questionIndex) => {

    let room = getRoom(roomid);
    if (room) {
      
      let quiz = getRoomQuiz(roomid);
      // finding remaining time
      let timeLimit = quiz[questionIndex].timeLimit - room.pauseTimerTime;

      let timeoutId = setTimeout(() => {
        console.log("timeout for question: " + questionIndex);
        io.to(roomid).emit("timeout", questionIndex + 1);
      }, (timeLimit  + LAG_BIAS + room.ROOM_LAG_BIAS) * 1000);

      //set timeout id
      setQuestionTimeOut(roomid, timeoutId);
      io.to(roomid).emit("timer-resumed", 1);
      
    }


  })

  socket.on("handle-answer", (roomid, answer, questionIndex) => {
    try {

      // Check if this a reconnected user and if so, get the current question index

      if (questionIndex !== getRoomCurrentQuestion(roomid)) {
        questionIndex = getRoomCurrentQuestion(roomid);

      }


      console.log(
        "answer received: " + answer + " questionIndex: " + questionIndex,
        "roomid: " + roomid
      );

      //check if answer is undefined or questionIndex is undefined
      if (answer === undefined || questionIndex === undefined) {
        return;
      }

      let room = getRoom(roomid);
      if (room) {

        timeAnswered = (Date.now() - room.startTimeStampOfTimer) / 1000;
        console.log("Time taken to answer: " + timeAnswered);
        handleAnswer(roomid, socket.id, answer, questionIndex, timeAnswered);

        // Get the number of players who have answered so far
        let playersData = getPlayersAnswered(roomid, questionIndex); // playersData has num of players answered so far and total players
        console.log("Emitting players:", playersData);
        io.to(roomid).emit("players-answered", playersData);
      }

      //check if all players have answered, emit next question
      //if last question, emit final scores
      //if questionPerReport is not -1, check if questionIndex is a multiple of questionPerReport, if so emit scores till question

      //------------------------------------PERSISTANCE------------------------------------
      //if user is in a vegetative state, count their answer as an empty string

      if (checkAllAnswered(roomid, questionIndex)) {
        let scores = [];

        //<------------------------------------FINAL SCORES------------------------------------>

        if (questionIndex === getRoomQuiz(roomid).length - 1) {
          //emit final scores for each player (not host)
          for (let i = 0; i < room.users.length; i++) {

            // check if user is a dummy User
            if (room.users[i] !== room.host && !users.find((user) => user.socketid === room.users[i])?.dummyUser) {
              scores.push({
                name: getName(room.users[i]),
                scores: getFinalScores(roomid, room.users[i]),
                avatarIndex: users.find(
                  (user) => user.socketid === room.users[i]
                )?.avatarIndex,
              });
            }
          }

          //set scores
          //console.log("final scores: " + scores);
          setScores(roomid, scores);
          io.to(roomid).emit("game-end");

          //<------------------------------------REPORTING------------------------------------>
        } else if (
          room.questionsPerReport !== -1 &&
          (questionIndex + 1) % room.questionsPerReport === 0
        ) {
          //emit scores till question
          for (let i = 0; i < room.users.length; i++) {
            // check if user is a dummy user
            if (room.users[i] !== room.host && !users.find((user) => user.socketid === room.users[i])?.dummyUser) {
              scores.push({
                name: getName(room.users[i]),
                scores: getScoresTillQuestion(
                  roomid,
                  questionIndex + 1,
                  room.users[i]
                ),
                avatarIndex: users.find(
                  (user) => user.socketid === room.users[i]
                )?.avatarIndex,
              });
            }
          }

          //console.log("scores till question: " + questionIndex);

          io.to(roomid).emit(
            "scores-till-question",
            scores,
            REPORT_DISPLAY_TIME
          );

          //set timeout for next question
          setTimeout(() => {
            io.to(roomid).emit("next-question", questionIndex + 1);
            let playersData = { numAnswers: 0, totalPlayers: room.users.length - 1};
            io.to(roomid).emit("players-answered", playersData);

            setRoomCurrentQuestion(roomid, questionIndex + 1);

            //clear timeout for previous question
            clearTimeout(room.timeOutIds[questionIndex]);

            //handle timeout for next question here
            let quiz = getRoomQuiz(roomid);
            let timeLimit = quiz[questionIndex + 1].timeLimit;

            let timeoutId = setTimeout(() => {
              console.log("timeout for question: " + (questionIndex + 1));
              io.to(roomid).emit("timeout", questionIndex + 1);
              
            }, (timeLimit + LAG_BIAS + room.ROOM_LAG_BIAS) * 1000);

            //set timeout id
            setQuestionTimeOut(roomid, timeoutId);
          }, (REPORT_DISPLAY_TIME + LAG_BIAS + room.ROOM_LAG_BIAS) * 1000);

          //<------------------------------------NEXT QUESTION------------------------------------>
        } else {
          io.to(roomid).emit("next-question", questionIndex + 1);
          let playersData = { numAnswers: 0, totalPlayers: room.users.length - 1};
          io.to(roomid).emit("players-answered", playersData);

          setRoomCurrentQuestion(roomid, questionIndex + 1);

          //clear timeout for previous question
          clearTimeout(room.timeOutIds[questionIndex]);

          //handle timeout for next question here
          let quiz = getRoomQuiz(roomid);
          let timeLimit = quiz[questionIndex + 1].timeLimit;

          let timeoutId = setTimeout(() => {
            console.log("timeout for question: " + (questionIndex + 1));
            io.to(roomid).emit("timeout", questionIndex + 1);
            
          }, (timeLimit + LAG_BIAS + room.ROOM_LAG_BIAS) * 1000);

          //set timeout id
          setQuestionTimeOut(roomid, timeoutId);
        }
      }
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("leave-room", (roomid) => {
    //remove user from room and emit to all users in room that user left
    console.log("user left room: " + roomid);
    removeName(socket.id, roomid);
    removeUserFromRoom(roomid, socket.id);

    //broadcast to all users in room that user left
    let playernum = getPlayerNum(roomid);
    let users = getAllUsers(roomid, false);
    io.to(roomid).emit("user-left", socket.id, playernum, users);

    //if host left, delete room
    let room = getRoom(roomid);
    if (room) {
      if (room.host === socket.id) {
        removeRoom(roomid);
      }
    }
  });

  socket.on("reconnected", (roomid) => {
    //user reconnected and now is in game screen, remove user from vegetative state

    //find user in users using socketid and roomid
    let user = users.find(
      (user) => user.socketid === socket.id && user.roomid === roomid
    );
    if (user) {
      user.vegetativeState = false;
    }
  });

  socket.on("late-connected", (roomid) => {
    //user joined late and now is in game screen, remove user from vegetative state
    let user = users.find(
      (user) => user.socketid === socket.id && user.roomid === roomid
    );
    if (user) {
      user.vegetativeState = false;
    }
  });
});
