<script lang="js">
  // @ts-nocheck
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import {SESSION_TIMEOUT} from "$lib/config.js";
  import {BACKEND_URL} from "$lib/config.js";
  import { user } from "$lib/userStore.js";

  let signupVisible = false;
  let signinVisible = false;
  let loadingUserSession = false;

  function toggleSignup() {
    // signupVisible = !signupVisible;
    // signinVisible = false;
    goto("/signUp");
  }

  function toggleSignin() {
    goto("/signIn");
    // signinVisible = !signinVisible;
    // signupVisible = false;
  }

  async function loginUserSession(email, password) {
    //call api to login the user (async)
    //if successful, redirect to the appropriate page
    try {
        const response = await fetch(`${BACKEND_URL}/auth/signup`, {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            email: email,
            password: password,
          }),
          // mode: "no-cors",
        });

        console.log(response);
        const data = await response.json();
        console.log(data);

        if (data.error) {
          let error = data.error;
          console.log(error);
          loadingUserSession = false;
          return;
        } else {
          $user.email = email;
          //redirect to the appropriate page
          goto("/hostOrPlayer");
        }
      } catch (err) {
        console.log(err);
        loadingUserSession = false;
        return;
      }
  }


  onMount(() => {
    console.log("Landing page mounted");
    loadingUserSession = true;
    //try to load user from local storage
    let user = JSON.parse(localStorage.getItem("user-session"));
    console.log(user);
    if (user) {
      //check if the user is still valid
      let currentTime = Date.now();
      let timeElapsed = currentTime - user.timestamp;
      if (timeElapsed > SESSION_TIMEOUT) {
        //clear the user from local storage
        localStorage.removeItem("user-session");
        loadingUserSession = false;
      } else {
        //call api to login the user (async)
        //if successful, redirect to the appropriate page
        loginUserSession(user.email, user.password);
      }
    } else {
      loadingUserSession = false;
    }
  });
</script>

<main>
  <body>
    <div class="landing-page">
    {#if !loadingUserSession}
      <h1>Welcome to JAM!</h1>
      <!-- <p>A brief description of your app and its benefits.</p> -->

      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <div class="buttons">
        <button on:click={toggleSignup}>Sign Up</button>
        <button on:click={toggleSignin}>Sign In</button>
        <button
          on:click={() => {
            goto("/hostOrPlayer");
          }}>Annonymous</button
        >
      </div>

      {#if signupVisible}
        <div class="signup-form" />
      {/if}

      {#if signinVisible}
        <div class="signin-form" />
      {/if}

    {:else}
      <p>Loading...</p>
    {/if}
    </div>
    
  </body>
</main>

<style>
  .landing-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: JejuGothic, sans-serif;
  }
  body {
    background: #7801a8;
  }
  h1 {
    color: #c49eff;
  }

  .buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
    border-radius: 20rem;
  }

  .signup-form,
  .signin-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-family: JejuGothic, sans-serif;
  }
  .landing-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: JejuGothic, sans-serif;
  }

  @media (max-width: 768px) {
    .buttons {
      flex-direction: column;
    }

    .landing-page {
      padding: 0 20px;
      font-family: JejuGothic, sans-serif;
    }
  }

  @media (min-width: 769px) {
    .buttons button {
      padding: 10px 20px;
      font-size: 1rem;
      border-radius: 20rem;
      border: None;
      font-family: JejuGothic, sans-serif;
    }
  }
</style>
