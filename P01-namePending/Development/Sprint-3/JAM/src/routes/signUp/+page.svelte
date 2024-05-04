<script lang="js">
  import { goto } from "$app/navigation";
  import {BACKEND_URL} from "$lib/config.js"

  let email = "";
  let password = "";
  let error = "";

  async function handleSignUp() {
    // Implement your sign-up logic here
    // e.g., sending a POST request to your API
    // and checking the response for successful registration
    console.log("Sign up clicked!");

    // Mock error for demonstration
    if (email === "" || password === "") {
      //   error = "Please fill in all fields.";
      // } else if (password.length < 8) {
      //   error = "Password must be at least 8 characters long.";
    } else {
      // Api call to sign up

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

          goto("/");
        }
      } catch (err) {
        error = "There was an error. Please try gain!";
        return;
      }
      // console.log("Sign up successful!");
    }
  }

  function navigateToSignIn() {
    goto("/signIn");
  }
</script>

<main>
  <body>
    <div class="container">
      <div class="logo">
        <!-- <img src="logo.png" alt="Logo" /> -->
      </div>
      <h1>Sign Up</h1>
      <form on:submit={handleSignUp}>
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

        <button class="buttons" type="submit">Sign Up</button>
      </form>

      <!-- <p>Already have an account? <a href={navigateToSignIn}>Sign In</a></p> -->
      <button on:click={navigateToSignIn} class="buttons"
        >Already have an account? Sign In</button
      >
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

  .logo {
    margin-bottom: 2rem;
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
    border: None;
    background-color: #018198;
    margin-bottom: 2rem;
  }
  ::placeholder {
    padding-left: 0.5rem;
  }

  input {
    max-width: 100%;
    font-family: JejuGothic, sans-serif;
    font-size: 18px;
    border-radius: 5rem;
    padding-left: 0.5rem;
    border: None;
  }

  .error {
    color: red;
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

    .buttons button {
      padding: 10px 25px;
      font-size: 18px;
      border-radius: 20px;
    }
  }
</style>
