<script>
  // @ts-nocheck

  import { goto } from "$app/navigation";
  // importing userStore.js
  import { user } from "$lib/userStore.js";
  import {BACKEND_URL} from "$lib/config.js";

  let email = "";
  let password = "";
  let error = "";

  async function handleSignIn() {
    console.log("Sign in clicked!");

    if (email === "" || password === "") {
      error = "Please fill in all fields.";
      //   } else if (email !== "valid@email.com") {
      //     error = "Invalid email or password.";
    } else {
      // Api call to sign in

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
          error = data.error;
          return;
        } else {
          // console.log(data);
          // console.log(data.token);

          $user.email = email;
          //$user.password = password;
          //save user to session storage but incoorporate timestamps to determine staleness/ timeout for session
          sessionStorage.setItem("user", JSON.stringify($user));

          //create obj to store email, password, timestamp and user data
          let userObj = {
            email: email,
            password: password,
            timestamp: Date.now(),
            userData: {},
          };

          //save user to local storage
          localStorage.setItem("user-session", JSON.stringify(userObj));

          goto("/hostOrPlayer");
        }
      } catch (err) {
        error = "There was an error. Please try gain!";
        return;
      }

      // console.log("Sign in successful!");
    }
  }
</script>

<main>
  <body>
    <div class="container">
      <h1>Sign In</h1>
      <form on:submit={handleSignIn}>
        <label for="email">Email:</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          placeholder="Enter your email"
        />

        <label for="password">Password:</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          placeholder="Enter your password"
        />

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <button type="submit">Sign In</button>
      </form>
    </div>
  </body>
</main>

<style>
  body {
    background: #7801a8;
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 10px;
    font-family: JejuGothic, sans-serif;
    color: #c49eff;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 4rem;
    border-radius: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    font-family: JejuGothic, sans-serif;
    font-size: 18px;
    background-color: #018198;
    color: #c49eff;
    border: None;
    margin-bottom: 2rem;
  }

  input {
    max-width: 100%;
    font-family: JejuGothic, sans-serif;
    font-size: 18px;
    border-radius: 5rem;
    padding-left: 0.5rem;
    border: None;
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
  }

  button:hover {
    background-color: #c49eff;
  }
  

  @media (max-width: 768px) {
    form {
      width: 90%;
      padding: 1rem;
    }

    input,
    button {
      padding: 8px;
      font-size: 12px;
      border-radius: 15px;
    }
  }

  @media (min-width: 769px) {
    form {
      padding: 2rem;
    }

    button {
      padding: 10px 25px;
      font-size: 18px;
      border-radius: 20px;
    }
  }
</style>
