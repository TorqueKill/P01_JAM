<script lang="js">
  // @ts-nocheck

  //------------------------------------PRESISTANCE------------------------------------
  // navigate to main menu if user is disconnected, if user is not logged in, goto login/signup

  import { socket, roomEvents } from "$lib/socketStore.js";
  import { user } from "$lib/userStore.js";
  import { SCREENS,AVATARS } from "$lib/config.js";
  import { goto } from "$app/navigation";

  let playersReady = 0;
  let players = [];

  $: {
    const events = $roomEvents;
    console.log(events);

    if (events.roomDeleted) {
      socket.disconnect();
      socket.connect();
      goto("/");
    }

    if (events.roomCreated) {
      $user.gameid = events.roomCreated;

      //set the event to null
      events.roomCreated = null;
    }

    if (events.roomJoined) {
      playersReady = events.roomJoined.num;
      console.log(playersReady);
      players = events.roomJoined.users;

      //set the event to null
      events.roomJoined = null;
    }

    if (events.roomLeft) {
      playersReady = events.roomLeft.num;
      players = events.roomLeft.names;

      //set the event to null
      events.roomLeft = null;
    }

    if (events.gameStarted) {
      console.log("game started event recieved on front end");
      console.log(events.gameStarted);
      $user.quiz = events.gameStarted.quiz;
      $user.displayQuestion = events?.gameStarted?.options?.displayQuestion;

      console.log($user)

      events.gameStarted = null;
      goto("/gameSession");
    }

    if (events.reconnect) {
      let data = events.reconnect;
      $user.quiz = data.quiz;
      $user.currentSession = SCREENS.GAME;
      $user.reconnected = true;

      //will use data.currentQuestion in the future

      socket.emit("reconnected", $user.gameid);
      goto("/gameSession");
    }

    if (events.lateConnect) {
      
      console.log(events.lateConnect);
      $user.quiz = events.lateConnect.quiz;
      console.log($user.quiz);
      $user.displayQuestion = events?.lateConnect?.options?.displayQuestion;
      $user.currentSession = SCREENS.GAME;
      $user.lateConnected = true;

      socket.emit("late-connected", $user.gameid);

      events.gameStarted = null;

      goto("/gameSession");
    }
  }
</script>

<main>
  <body>
    <div class="container">
      <h1>Loading...</h1>

      <div id="inside-box">
        <div class="player-div">
          <div>
            <p id="players-ready">Players Ready</p>
            <p id="player-number">{playersReady}</p>
          </div>
        </div>
        {#if $user.isHost}
          <!-- <h4>Host id: {$user.gameid}</h4> -->
          <div class="player-div">
            <div>
              <p id="host-id">Host ID</p>
              <p id="game-id">{$user.gameid}</p>
              <!-- <p id="game-id">1234345</p> -->
            </div>
          </div>
        {/if}

        {#each players as {name, avatarIndex}}
        <div class="player-item">
            <p class="player-name">{name}</p>
            <img class="player-avatar" src={`/avatars/${AVATARS[avatarIndex]}`} alt="Avatar" />
        </div>
        {/each}

        <!-- Force start the quiz atleast one player has joined -->
        {#if $user.isHost && playersReady >= 1}
          <button
            class="btn btn-secondary btn-block"
            on:click={() => {
              socket.emit("force-start-game", $user.gameid);
            }}>Start Quiz</button
          >
        {/if}

        <!--Go back to menu, disconnect-->
        <button
          class="btn btn-secondary btn-block"
          id="createQuiz"
          on:click={() => {
            socket.disconnect();
            socket.connect();
            goto("/");
          }}>Leave room</button
        >
      </div>
    </div>
  </body>
</main>

<style>
  body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    background: #7801a8;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    max-width: 20rem;
    padding: 2rem;
    background: #018198;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 51px;
    margin: 1rem auto;
    transition: height 0.3s ease;
  }

  #inside-box {
    width: 80%;
    background: #018198;
    border-radius: 51px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 0.25rem;
  }

  #players-ready {
    color: white;
    font-size: 15px;
    font-family: JejuGothic, sans-serif;
    font-weight: 400;
    margin-left: -4rem;
    transform: translate(0, 75%);
  }
  #player-number {
    text-align: center;
    transform: translate(0, -110%);
    color: white;
    margin-left: 9rem;
    align-content: center;
  }
  .player-div {
    width: 100%;
    background: #c49eff;
    text-align: center;
    border-radius: 12px;
    margin: 0.5rem 0;
    transition: transform 0.3s ease;
  }
  .btn {
    margin-top: 5rem;
    margin-right: 6rem;
    width: 10rem;
    border: None;
    font-family: JejuGothic, sans-serif;
    border-radius: 12px;
    height: 3rem;
    font-size: 20px;
    max-width: 100%;
    padding: 5px;
  }
  .btn:active {
    background-color: #7801a8;
    color: #f0e9e9;
  }
  .btn-secondary {
    background: #c70000;
    color: white;
    border: none;
    margin-top: 1rem;
    width: auto;
    padding: 10px;
    border-radius: 12px;
    transition: background-color 0.3s ease;
  }

  #host-id {
    color: white;
    font-size: 15px;
    font-family: JejuGothic, sans-serif;
    font-weight: 400;
    margin-left: -7rem;
    transform: translate(0, 75%);
  }
  #game-id {
    color: white;
    text-align: center;
    transform: translate(0, -110%);
    margin-left: 7rem;
  }
  h1 {
    color: white;
    font-size: 36px;
    font-family: JejuGothic;
    font-weight: 400;
    font-weight: bold;
    text-align: center;
    justify-content: center;
  }




  .player-item {
    display: flex;
    align-items: center; 
    gap: 10px; 
  }

  .player-name {
    margin: 0; 
    color: white; 
  }

  .player-avatar {
    width: 50px; 
    height: 50px; 
    border-radius: 50%; /* Optional: makes the avatar circular */
  }

  @media screen and (max-width: 768px) {
    .container {
      margin: 0;
      padding: 0.2rem;
      width: 50%;
      max-width: none;
    }

    .btn {
      padding: 5px;
      font-size: 0.8em;
      margin: 0.5rem 0;
    }
  }

  @media screen and (min-width: 769px) {
    .container {
      max-width: 20rem;
    }

    .btn {
      padding: 10px 28px;
      font-size: 1em;
      margin-left: 6rem;
      text-align: center;
      justify-content: center;
    }
  }
</style>
