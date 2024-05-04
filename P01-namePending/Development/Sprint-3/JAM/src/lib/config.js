export const SCREENS = {
  HOME: 0,
  CREATE: 1,
  JOIN: 2,
  WAITING: 3,
  GAME: 4,
  SCORE: 5,
};

export const ROOM_SETTINGS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  MAX_QUESTIONS_PER_REPORT: 5,
};

export const GAME_SETTINGS = {
  MAX_QUESTIONS_PER_REPORT: 5,
  MAX_TIME_PER_QUESTION: 30,
  MAX_TIME_PER_REPORT: 10,
  MAX_TIME_PER_GAME: 1800,
};

export const AVATARS = [
  "man1.png",
  "woman1.png",
  "man2.png",
  "woman2.png",
  "man3.png",
  "woman3.png",
  "man4.png",
  "woman4.png",
  "man5.png",
  "woman5.png",
];

//1 week
export const SESSION_TIMEOUT = 604800000;

export const BACKEND_URL = "http://localhost:3001"; // || process.env.BACKEND_URL;

//https://boiling-beyond-93888-265de2b70712.herokuapp.com/
