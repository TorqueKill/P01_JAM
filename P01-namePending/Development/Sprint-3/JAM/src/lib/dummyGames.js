import { quiz1, quiz2, quiz3 } from "./dummyQuiz";

//NOTE THIS IS THE INPUT GIVEN BY SERVER AT THE END OF THE GAME

//score corresponds to the index of the question and if the player got it right

export const gameHistory = [
  [
    { name: "Player1", scores: [1, 0, 1, 1, 1] }, //quiz1
    { name: "Player2", scores: [0, 1, 1, 0, 1] },
    { name: "Player3", scores: [1, 1, 1, 1, 1] },
    { name: "Player4", scores: [0, 0, 1, 1, 0] },
    { name: "Player5", scores: [1, 0, 1, 0, 1] },
  ],
  [
    { name: "Player2", scores: [1, 1, 0, 0, 1] }, //quiz2
    { name: "Player1", scores: [0, 1, 1, 0, 1] },
    { name: "Player4", scores: [1, 1, 1, 0, 0] },
    { name: "Player3", scores: [0, 1, 1, 1, 1] },
    { name: "Player5", scores: [1, 1, 1, 0, 1] },
  ],
  [
    { name: "Player3", scores: [1, 1, 1, 1, 1, 0, 1, 0, 1, 1] }, //quiz3
    { name: "Player1", scores: [1, 1, 0, 0, 1, 1, 1, 1, 1, 0] },
    { name: "Player2", scores: [1, 1, 1, 1, 1, 0, 1, 0, 1, 1] },
    { name: "Player4", scores: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0] },
    { name: "Player5", scores: [1, 1, 1, 0, 1, 1, 0, 0, 1, 1] },
  ],
  [
    { name: "Player1", scores: [1, 1, 0, 0, 1, 1, 1, 0, 1, 1] }, //quiz4
    { name: "Player4", scores: [0, 1, 0, 0, 1, 1, 0, 1, 0, 1] },
    { name: "Player2", scores: [1, 1, 1, 0, 1, 0, 1, 0, 1, 1] },
    { name: "Player5", scores: [1, 1, 1, 1, 1, 1, 1, 0, 1, 1] },
    { name: "Player3", scores: [1, 0, 1, 1, 1, 0, 1, 0, 1, 0] },
  ],
  [
    { name: "Player5", scores: [1, 0, 1, 0, 1, 1, 1, 0, 1, 1] }, //quiz5
    { name: "Player1", scores: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: "Player3", scores: [1, 1, 1, 1, 1, 1, 0, 1, 1, 1] },
    { name: "Player2", scores: [0, 1, 1, 0, 1, 0, 1, 1, 0, 1] },
    { name: "Player4", scores: [1, 0, 1, 1, 0, 1, 0, 0, 1, 0] },
  ],
];
