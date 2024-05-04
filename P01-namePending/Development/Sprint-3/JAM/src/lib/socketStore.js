// @ts-nocheck
// socketStore.js
import { writable } from "svelte/store";
import { io } from "socket.io-client";
import { BACKEND_URL } from "./config";

console.log(BACKEND_URL);

const socket = io(BACKEND_URL);

// Create a writable store for handling events
export const roomEvents = writable({});
export const gameEvents = writable({});

// Listen for events and update the store
socket.on("room-created", (roomid) => {
  roomEvents.update(() => ({ roomCreated: roomid }));
});

socket.on("user-joined", (socketid, playerNum, users) => {
  roomEvents.update(() => ({
    roomJoined: { id: socketid, num: playerNum, users: users },
  }));
});

socket.on("user-left", (socketid, playerNum, users) => {
  roomEvents.update(() => ({
    roomLeft: { id: socketid, num: playerNum, users: users },
  }));
});

socket.on("room-full", () => {
  roomEvents.update(() => ({ roomFull: true }));
});

socket.on("game-start", (quiz, options) => {
  roomEvents.update(() => ({
    gameStarted: { quiz: quiz, options: options },
  }));
});

socket.on("next-question", (question) => {
  console.log("next question");
  gameEvents.update(() => ({ nextQuestion: question }));
});

socket.on("final-scores", (scores) => {
  roomEvents.update(() => ({ finalScores: scores }));
});

socket.on("game-end", () => {
  roomEvents.update(() => ({ gameEnd: true }));
});

socket.on("reconnect", (data) => {
  console.log("reconnect");
  roomEvents.update(() => ({ reconnect: data }));
});

socket.on("late-connect", (quiz, options) => {
  console.log("late-connect");
  roomEvents.update(() => ({ lateConnect: { quiz: quiz, options: options }}));
});

socket.on("room-deleted", () => {
  roomEvents.update(() => ({ roomDeleted: true }));
});

socket.on("timeout", (question) => {
  console.log("timeout");
  gameEvents.update(() => ({ timeout: question }));
});

socket.on("scores-till-question", (scores, display_time) => {
  console.log("scores-till-question");
  gameEvents.update(() => ({
    scoresTillQuestion: scores,
    display_time: display_time,
  }));
});

socket.on("timer-paused", () => {
  console.log("pauseTimer");
  gameEvents.update(() => ({pauseTimer: true}));
})

socket.on("timer-resumed", () => {
  console.log("resumeTimer");
  gameEvents.update(() => ({resumeTimer: true}));
});

// socket.on

// Export the socket connection for reuse
export { socket };
