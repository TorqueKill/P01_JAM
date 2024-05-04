<script>
  // @ts-nocheck

  import { goto } from "$app/navigation";
  import { user } from "$lib/userStore.js";

  function makeid(length) {
    let result = "";
    let characters = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  function handleSignIn() {
    $user.email = email;
    sessionStorage.setItem("user", JSON.stringify($user));
    goto("/viewHistory");
  }

  let email = makeid(5) + "@gmail.com";
</script>

<main>
  <body>
    <div class="container">
      <h1>Dummy Login</h1>
      <input type="text" bind:value={email} placeholder="email" />
      
      <button on:click={handleSignIn}>Sign In</button>
      
    </div>
  </body>
</main>

<style>
  body {
    padding: 0;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #7801a8;
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    border-radius: 15px;
    background-color: #018198;
    color: #c49eff;
    border: none;
    margin-top: 20rem;
  }

  input {
    width: 100%;
    padding: 10px;
    margin-bottom: 1rem;
    font-family: JejuGothic, sans-serif;
    font-size: 18px;
    border-radius: 4px;
    border: 1px solid #ccc;
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
    input,
    button {
      padding: 8px;
      font-size: 12px;
      border-radius: 15px;
    }
  }

  @media (min-width: 769px) {
    button {
      padding: 10px 25px;
      font-size: 18px;
      border-radius: 20px;
    }
  }
</style>
