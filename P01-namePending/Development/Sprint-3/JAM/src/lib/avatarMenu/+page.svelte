<script>
    // @ts-nocheck
  
    const avatars =[
        'man1.png',
        'woman1.png',
        'man2.png',
        'woman2.png',
        'man3.png',
        'woman3.png',
        'man4.png',
        'woman4.png',
        'man5.png',
        'woman5.png'
    ]

    export let selectAvatar;

    function select(index) {
        selectAvatar(index);
    }
   
</script>
  
<main>
    <body>
        <h2 class = 'choose-avatar'>Choose your player</h2>
        <div class='avatar-list'>
            {#each avatars as avatar, index (index)}
                <img
                src={`/avatars/${avatar}`}
                alt={`Avatar ${index + 1}`}
                on:click={() => select(index)}
                />
            {/each}
        </div>
    </body>
</main>
  
<style>
    body {
        align-items: center;
        background: #7801a8;
    }


    .choose-avatar,
    h2{
        color: #c49eff;
        text-align: center;
        margin-bottom: 20px;
        font-family: JejuGothic, sans-serif;
        margin-top: 1rem;
    }

    .avatar-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 1rem;
  }

  .avatar-list img {
    width: 100px; 
    height: 100px; 
    border-radius: 50%; 
    margin: 20px;
    cursor: pointer;
    transition: transform 0.2s ease-in-out;
    background-color: #c49eff;
    
  }

  .avatar-list img:hover {
    transform: scale(1.2);
  }
</style>
  