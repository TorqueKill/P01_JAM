<!-- <script>
  import { onMount } from "svelte";
  import { gameHistory } from "$lib/dummyGames";
  import { quiz1, quiz2, quiz3 } from "$lib/dummyQuiz";

  //goto game history and see what quiz cooresponds to what game
  //display all the games on host and player side

  //player should be able to only look at their own history in detail ie question "what is 2+2" answer "4" score "1/1"
  //host should be able to look at all the history as scores ie. player1: 5/10, player2: 7/10 and the quiz that was used

  //host can choose to edit the quiz and then save it as a new quiz
  //both host and player can choose to delete the game history

  let playerUsername = "player1"; //should be able to change this to any player
</script>

<h1>Dummy View History</h1>

<button>view player history</button>
<button>view host history</button> -->

<script>
  // @ts-nocheck

  import { writable } from "svelte/store";
  import { gameHistory } from "$lib/dummyGames";
  import { user } from "$lib/userStore.js";
  import { quiz1, quiz2, quiz3, quiz4, quiz5 } from "$lib/dummyQuiz";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  // @ts-ignore
  const detailedPlayerHistory = writable([]);
  // @ts-ignore
  const hostHistory = writable([]);
  let showPlayerHistory = false;
  let showHostHistory = false;
  let playerEmail = $user.email;


  let localPlayerHistory;
  let localHostHistory;


  onMount(() => {
    if ($user.email == null || $user.email == "") {
      alert("Must be logged in to view history");
      goto("/");
    }

    localPlayerHistory = JSON.parse(localStorage.getItem("playerGameHistory"));
    if (localPlayerHistory == null) {
      localPlayerHistory = [];
    }

    localHostHistory = JSON.parse(localStorage.getItem("hostGameHistory"));
    if (localHostHistory == null) {
      localHostHistory = [];
    }

    console.log("localPlayerHistory:", localPlayerHistory);
    console.log("localHostHistory:", localHostHistory);

  });

  //note local history has the format:
  //{email: , username : , gameHistory: [{quiz: quiz, scores: playerScores}]}

  /**
   * @param {string} userEmail
   */
  function togglePlayerHistory(userEmail) {
    showPlayerHistory = !showPlayerHistory;
    if (showPlayerHistory) {
      /**
     * @type {{ quiz: string; details: ({ question: string; providedAnswer: string; 
    correctAnswer: string; wasCorrect: boolean; } | null)[]; }[]}
     */
      let playerHistory = [];

      let localGameHistory = localPlayerHistory.find(
        (player) => player.email == userEmail
      );

      if (localGameHistory == null) {
        alert("No history to show");
        showPlayerHistory = !showPlayerHistory;
        return;
      }

      //console.log("localGameHistory:", localGameHistory);
      let games = localGameHistory.gameHistory;
      
      games.forEach((quizHistory, index) => {
        //console.log("QuizHistory: ", quizHistory);
        let playerRecord = quizHistory.scores.find(
          (player) => player.name = userEmail
        );
        let currentQuiz = games[index].quiz;
        //console.log("currentQuiz:", currentQuiz);
        //console.log("playerRecord:", playerRecord);
        if (playerRecord && currentQuiz) {
          let quizDetails = playerRecord.scores.map((score, questionIndex) => {
            let questionItem = currentQuiz[questionIndex];
            //console.log("questionItem:", questionItem);
            if (questionItem) {
              return {
                question: questionItem.question,
                providedAnswer: questionItem.choices[score],
                correctAnswer: questionItem.answer,
                wasCorrect: score == 1,
              };
            }
            return null;
          });
          //console.log("quizDetails:", quizDetails);
          playerHistory.push({
            quiz: `Quiz ${index + 1}`,
            details: quizDetails.filter((detail) => detail !== null),
          });
        }
      });
      // @ts-ignore
      detailedPlayerHistory.set(playerHistory);
    } else {
      detailedPlayerHistory.set([]);
    }
  }

  function toggleHostHistory() {
    showHostHistory = !showHostHistory;
    if (showHostHistory) {
      /**
       * @type {{ quiz: string; players: { name: string; score: string; }[]; }[]}
       */
      let history = [];

      let localGameHistory = localHostHistory.find(
        (host) => host.email == $user.email
      );

      if (localGameHistory == null) {
        alert("No history to show");
        showHostHistory = !showHostHistory;
        return;
      }

      let games = localGameHistory.gameHistory;

      games.forEach((quizHistory, quizIndex) => {
        let quizResults = {
          quiz: `Quiz ${quizIndex + 1}`,
          players: quizHistory.scores.map((player) => ({
            name: player.name,
            score: `${player.scores.filter((score) => score === 1).length}/${
              player.scores.length
            }`,
          })),
        };
        history.push(quizResults);
      });
      // @ts-ignore
      hostHistory.set(history);
    } else {
      hostHistory.set([]);
    }
  }

  function deleteHistory() {
    detailedPlayerHistory.set([]);
    hostHistory.set([]);
    showPlayerHistory = false;
    showHostHistory = false;

    //delete local storage
    localStorage.removeItem("playerGameHistory");
    localStorage.removeItem("hostGameHistory");

    //delete local variables
    localPlayerHistory = [];
    localHostHistory = [];
  }
</script>

<main>
  <body>
    <div class="container">
      <h1>View History</h1>
      <button on:click={()=>{goto("/hostOrPlayer")}}>Back</button>
      {#if $user.isHost}
        <h3>Host</h3>
      {:else}
        <h3>Player</h3>
      {/if}
      <button on:click={() => togglePlayerHistory(playerEmail)}
        >Player history</button
      >
      {#if $user.isHost}
        <button on:click={toggleHostHistory}>Host history</button>
      {/if}
      <button on:click={deleteHistory}>Delete history</button>

      {#if showPlayerHistory}
        {#each $detailedPlayerHistory as quiz (quiz.quiz)}
          <h3>{quiz.quiz}</h3>
          <ul>
            {#each quiz.details as detail}
              <li>
                {detail.question}: {detail.correctAnswer}
                ({detail.wasCorrect ? "Correct" : "Incorrect"})
              </li>
            {/each}
          </ul>
        {/each}
      {/if}

      {#if showHostHistory}
        {#each $hostHistory as quiz}
          <h3>{quiz.quiz}</h3>
          <ul>
            {#each quiz.players as player}
              <li>{player.name}: {player.score}</li>
            {/each}
          </ul>
        {/each}
      {/if}
    </div>
  </body>
</main>

<style>
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #7801a8;
    font-family: "Jeju Gothic", sans-serif;
    color: #ffffff;
  }

  .container {
    text-align: center;
    max-width: 800px;
    width: 80%;
    margin: 20px;
    padding: 20px;
    box-sizing: border-box;
    border-radius: 10px;
    background-color: #018198;
    font-family: "Jeju Gothic", sans-serif;
  }

  button {
    background-color: #ccc;
    border: none;
    color: white;
    padding: 5px 25px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 140px;
    cursor: pointer;
    border-radius: 5px;
    transition: all 0.3s ease;
    font-family: "Jeju Gothic", sans-serif;
  }

  button:hover {
    background-color: #c49eff;
  }
  h1,
  h3 {
    margin: 10px 0;
    font-family: "Jeju Gothic", sans-serif;
    font-size: 2rem;
  }

  ul {
    list-style: none;
    padding: 0;
    text-align: left;
    font-family: "Jeju Gothic", sans-serif;
    font-size: 20px;
  }

  li {
    background-color: #c49eff;
    margin: 5px 0;
    padding: 10px;
    border-radius: 5px;
    font-family: "Jeju Gothic", sans-serif;
    font-size: 20px;
  }

  @media (max-width: 480px) {
    h1,
    h3 {
      font-size: 1.25rem;
    }

    li {
      font-size: 0.875rem;
    }

    button {
      font-size: 0.9rem;
      padding: 6px 12px;
    }
    .container {
      margin: 10px;
      padding: 10px;
    }
  }
</style>
