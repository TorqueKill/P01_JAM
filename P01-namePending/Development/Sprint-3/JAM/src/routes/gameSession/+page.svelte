<script>
  // @ts-nocheck

  //------------------------------------PRESISTANCE------------------------------------
  // navigate to main menu if user is disconnected, if user is not logged in, goto login/signup

  import { SCREENS,GAME_SETTINGS,AVATARS } from "$lib/config.js";
  import { user } from "$lib/userStore.js";
  import { socket, roomEvents, gameEvents } from "$lib/socketStore.js";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { tweened } from "svelte/motion";

  let isHost;
  let quiz;
  let currentQuestion;
  let isAnswerSubmitted;
  let answerSubmitted;
  let originalTimer = GAME_SETTINGS.MAX_TIME_PER_QUESTION;
  let timeLeft = tweened(originalTimer);
  let resetTimer = false; // true when next question is loaded
  let timeRanOut = false; // true when time runs out for a question
  let ispauseTimer = false;
  let playersAnsweredSoFar = 0; // Variable to store the count of players who have answered
  let numPlayers = 0;
  let sessionScores = [];
  let scoreDisplayCheck = false;
  let scoreDisplayTimer = GAME_SETTINGS.SCORE_DISPLAY_TIME;
  let displayQuestionForPlayers = false;

  onMount(() => {
    quiz = $user.quiz;
    isHost = $user.isHost; //hosts will display the question
    displayQuestionForPlayers = $user.displayQuestion;
    currentQuestion = -1;
    isAnswerSubmitted = false;
    answerSubmitted = "";

    if ($user.currentSession != SCREENS.GAME) {
      $user.currentSession = SCREENS.GAME;
      socket.emit("session-loaded", $user.gameid, SCREENS.GAME);
    }
    socket.on("players-answered", (playersData) => {
      // Update the count of players who have answered
      console.log("Received players data:", playersData);
      playersAnsweredSoFar = playersData.numAnswers;
      numPlayers = playersData.totalPlayers;
      // You may also update other relevant variables here if needed
    });
  });

  //----------------------------REACTIVE CHANGES-------------------------

  $: {
    const events = $gameEvents;
    console.log(events);

    if (events.nextQuestion == 0 || events.nextQuestion) {
      currentQuestion = events.nextQuestion;
      console.log(events);
      isAnswerSubmitted = false;
      answerSubmitted = "";
      resetTimer = true;
      timeRanOut = false;

      // reset score display check to start timer
      scoreDisplayCheck = false;

      //set the event to null so that it doesn't get called repeatedly
      events.nextQuestion = null;
    }

    //check for 'timeout' event
    if (events.timeout) {


      //check if answer was submitted, if not, then send answer
      console.log("in timeout event");
      if (!isAnswerSubmitted) {
        let _currentQuestion = currentQuestion;
        currentQuestion = events.timeout;
        console.log(events);
        isAnswerSubmitted = false;
        answerSubmitted = "";
        resetTimer = true;
        timeRanOut = false;

        console.log("timeout");
        
        // host should not be able to send answer
        if (!isHost) {

          if ($user.reconnected) {
            // changed from currentQuestion - 1 to currentQuestion. After rejoining it was sending answer to the prev question
            sendAnswer(-1, currentQuestion); //reconnected user waits till timeout
            $user.reconnected = false;

          } else if ($user.lateConnected) {
            sendAnswer(-1, currentQuestion ); //reconnected user waits till timeout
            $user.lateConnected = false;
          } else {
            sendAnswer(-1, _currentQuestion); // Index is -1 if time runs out
          }
        }

      }


      //   if ($user.reconnected) {
      //     sendAnswer(-1, currentQuestion - 1); //reconnected user waits till timeout
      //   } else {
      //     sendAnswer(-1, _currentQuestion); // Index is -1 if time runs out
      //   }
      // }

      //set the event to null so that it doesn't get called repeatedly
      events.timeout = null;
    }

    if (events.scoresTillQuestion) {
      sessionScores = events.scoresTillQuestion;
      sessionScores.sort(sortByScore);
      scoreDisplayCheck = true;
      scoreDisplayTimer = events.display_time;
      events.scoresTillQuestion = null;
    }

    if (events.pauseTimer) {
      ispauseTimer = true;
      events.pauseTimer = null;
    }

    if (events.resumeTimer) {
      ispauseTimer = false;
      events.resumeTimer = null;
    }
  }

  $: {
    const events = $roomEvents;
    console.log(events);

    if (events.roomDeleted) {
      socket.disconnect();
      socket.connect();

      $user.gameid = null;
      $user.quiz = null;
      $user.isHost = false;
      $user.userDecided = false;

      goto("/");
    }

    if (events.gameEnd) {
      goto("/gameEnd");
    }
  }

  //---------------------------CLIENT TIMER-----------------------------------

  if (!$user.isHost || scoreDisplayCheck) {
    // timer is only for non-hosts unless score is being displayed
    setInterval(() => {
      if (scoreDisplayCheck) {
        if (scoreDisplayTimer > 0) {
          scoreDisplayTimer--;
        }
        return; // don't run the timer if score is being displayed
      }

      if (ispauseTimer) {
        return;
      }

      // timer is reset when new question is loaded
      if (resetTimer) {
        $timeLeft = quiz[currentQuestion].timeLimit;
        resetTimer = false;
        return;
      }

      // Timer is paused when answer is submitted until next question is loaded
      if (isAnswerSubmitted) {
        return;
      }

      // timer decrement by 1 second every second
      if ($timeLeft > 0) {
        $timeLeft--;

        // Time ran out for this question
      } else if ($timeLeft <= 0 && $timeLeft > -100) {
        timeRanOut = true;

        // set to -100 so that send answer doesn't get called repeatedly
        $timeLeft = -100;
      }
    }, 1000);
  }

  $: secondsLeft = Math.floor($timeLeft); // important for reactive state

  //-------------------------------FUNCTIONS---------------------------------

  //quiz format: refer to dummyQuiz.js in lib folder

  const sendAnswer = (answerIdx, questionIdx) => {
    if (isAnswerSubmitted || ispauseTimer ) {
      return;
    }
    if (answerIdx === -1) {
      answerSubmitted = "Time ran out";
    } else {
      answerSubmitted = quiz[currentQuestion].choices[answerIdx];
    }
    // answerSubmitted = quiz[currentQuestion].choices[answerIdx];
    isAnswerSubmitted = true;
    console.log("Sent answer: ", answerIdx);
    socket.emit("handle-answer", $user.gameid, answerIdx, questionIdx);
  };

  const playerScore = (scoreList) => {
    let score = 0;
    for (let i = 0; i < scoreList.length; i++) {
      if (scoreList[i] == 1) {
        score++;
      }
    }
    return score;
  };

  const sortByScore = (a, b) => {
    return playerScore(b.scores) - playerScore(a.scores);
  };

  const pauseTimer = () => {
    
    socket.emit("pause-timer", $user.gameid, currentQuestion);
    
    
  };

  const resumeTimer = () => {
    socket.emit("resume-timer", $user.gameid, currentQuestion);
  };


  const restartConnection = () => {
    socket.disconnect();
    socket.connect();

    $user.gameid = null;
    $user.quiz = null;
    $user.isHost = false;
    $user.userDecided = false;

    goto("/");
  }
</script>

<main>
  <body>
    <div class="container">
      <!------------------------------- LOADING ------------------------------------------>
      {#if currentQuestion == -1}
        <h1 class="loading">Waiting for Server...</h1>

        <!------------------------------- SCORE DISPLAY ------------------------------------>
      {:else if scoreDisplayCheck}
        <h1>Score Display</h1>
        {#each Object.entries(sessionScores) as [idx, ps], i}
        <div class="player-item {i === 0 ? 'first-place' : i === 1 ? 'second-place' : i === 2 ? 'third-place' : ''}">
          <img src={`/avatars/${AVATARS[ps.avatarIndex]}`} alt="Player Avatar" class="player-avatar" />
          <p class="player-name">
            {ps.name} score: {playerScore(ps.scores)}
          </p>
        </div>
        {/each}
      
        <h1>Next Question in {scoreDisplayTimer} seconds</h1>

        <!------------------------------- QUESTION DISPLAY (HOST)--------------------------------->
      {:else if quiz}
        {#if isHost}
          <h1 id="host-question" class="inside-box container2">
            {quiz[currentQuestion].question}

            {#if quiz[currentQuestion].imageUrl}
            <img src={quiz[currentQuestion].imageUrl} class="image-preview" alt={`Image for Question ${currentQuestion + 1}`} />
            {/if}
            <!-- button for pausing the timer -->
            {#if ispauseTimer}
              <button
                class="btn btn-secondary btn-block"
                id="createQuiz"
                on:click={() => {
                  ispauseTimer = false;
                  resumeTimer();
                }}>Resume Timer</button
              >

            {:else}
              <button
                class="btn btn-secondary btn-block"
                id="createQuiz"
                on:click={() => {
                  ispauseTimer = true;
                  pauseTimer();
                }}>Pause Timer</button
              >

            {/if}
            <button
              class="btn btn-secondary btn-block"
              id="createQuiz"
              on:click={() => {
                restartConnection();
              }}>Leave Room</button
            >
          </h1>
          <h2>Players Answered: {playersAnsweredSoFar} / {numPlayers}</h2>

          <!------------------------------- ANSWER DISPLAY (PLAYER)--------------------------------->
        {:else if $timeLeft >= 0}
        
          <!-- <p>Time Left: {timeLeft}</p> -->
          <h2 id="chooseOpt" class="inside-option container2">
            <p id="choose" style="color: #c49eff">Choose one</p>
            {#each quiz[currentQuestion].choices as choice, idx}
              <button
                class="btn1 btn-tertiary btn-block"
                id="chooseAnswer"
                on:click={() => sendAnswer(idx, currentQuestion)}
                >{choice}</button
              >
            {/each}
            <p id="answer">You chose:</p>
            <p id="real-answer" style="color: white;">{answerSubmitted}</p>
          </h2>
          
          {#if displayQuestionForPlayers}
          <h1 id="host-question" class="inside-box container2">
            {quiz[currentQuestion].question}
          </h1>
          {/if}


          <h1>Time Left: {secondsLeft}</h1>
        

          <!------------------------------- TIMEOUT DISPLAY --------------------------------->
        {:else if $timeLeft == -100}
          <h2>You ran out of time for this question</h2>
        {/if}
      {/if}
    </div>
  </body>
</main>

<style>
  body {
    margin: 0;
    padding: 0;
    height: 100vh;
    background: #7801a8;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "JejuGothic", sans-serif;
    flex-direction: column;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80%;
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #018198;
    color: #7801a8;
    border-radius: 2rem;
    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.2);
  }

  .inside-box,
  .inside-option {
    width: 100%;
    max-width: 40rem;
    background: #c49eff;
    border-radius: 3rem;
    padding: 4rem;
    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.25);
    text-align: center;
    justify-content: center;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  .btn,
  .btn1 {
    padding: 1rem 2rem;
    margin: 2rem;
    border: none;
    border-radius: 1rem;
    font-size: 1.25rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .btn-secondary {
    background: #c70000;
    color: white;
  }

  .btn-tertiary {
    background: #7801a8;
    color: white;
  }

  .btn:hover,
  .btn1:hover {
    background-color: #018198;
  }

  #choose {
    font-size: 1.5rem;
  }

  #answer,
  #real-answer {
    font-size: 1.25rem;
    color: #00a59b;
  }

  @media (max-width: 768px) {
    .container,
    .inside-box,
    .inside-option {
      padding: 2rem;
      margin: 2rem 2rem;
    }

    .btn,
    .btn1 {
      font-size: 1rem;
      padding: 1rem 1.5rem;
    }

    #choose,
    #answer,
    #real-answer {
      font-size: 1rem;
    }
    #host-question {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    #choose,
    #answer,
    #real-answer {
      font-size: 0.75rem;
    }
  }

  @media (min-width: 768px) and (max-width: 991px) {
    .container,
    .inside-box,
    .inside-option {
      padding: 1.5rem;
      margin: 1.5rem auto;
    }

    .btn,
    .btn1 {
      font-size: 1rem;
      padding: 0.75rem 1.5rem;
    }

    #choose,
    #answer,
    #real-answer,
    #host-question {
      font-size: 1rem;
    }
  }

  @media (min-width: 992px) {
    .container,
    .inside-box,
    .inside-option {
      padding: 2rem;
      margin: 2rem auto;
    }

    .btn,
    .btn1 {
      font-size: 1.25rem;
      padding: 1rem 2rem;
    }

    #choose,
    #answer,
    #real-answer,
    #host-question {
      font-size: 1.5rem;
    }
  }
  .container2 {
    flex-direction: column;
    align-items: center;
    border-radius: 15px;
    background-color: #018198;
    color: #c49eff;
    border: none;
  }


  .image-preview {
    flex-grow: 1;
    max-width: 50%;
    height: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  }






  .player-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.18); /* Optional: adds a subtle border */
  }

  .player-name {
    margin: 0; 
    color: rgb(0, 0, 0); 
  }

  .player-avatar {
    width: 50px; 
    height: 50px; 
    border-radius: 50%; /* Optional: makes the avatar circular */
  }


  .first-place {
  background: rgba(255, 255, 255, 0.4); /* More opaque */
}

  .second-place {
    background: rgba(255, 255, 255, 0.3); /* Medium opacity */
  }

  .third-place {
    background: rgba(255, 255, 255, 0.2); /* More transparent */
  }
</style>
