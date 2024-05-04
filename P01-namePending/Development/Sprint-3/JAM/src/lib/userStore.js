// @ts-nocheck
//store states for user

import { writable } from "svelte/store";
import { quiz1 } from "../lib/dummyQuiz.js";

function makeid(length) {
  let result = "";
  let characters = "0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

let userName = "User" + makeid(4);

//{id: socketid, isHost: false, quiz: {}, score: {}}

export const user = writable({
  id: "",
  isHost: false,
  quiz: [],
  score: {},
  gameid: "",
  hostQuiz: quiz1,
  userDecided: false,
  userName: userName,
  email: "",
  currentSession: 0,
  reconnected: false,
  lateConnected: false,
  currentQuestion: -1,
  displayQuestion: false,
  avatarIndex: 0, //default avatar
});
