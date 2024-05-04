<script>

    //What data you will be given

    //for player, DISPLAY overall game stats : average score, average response time
    let gamePlayerHistory = [
        { name: "Player1", scores: [1, 0, 1, 1, 1], responseTimes: [4, 21, 24, 1, 2]}, //quiz1 - game1
        { name: "Player1", scores: [0, 1, 1, 0, 1], responseTimes: [23, 21, 9, 3, 2]}, //quiz2 - game2
        { name: "Player1", scores: [1, 1, 1, 1, 1, 0, 1, 0, 1, 1], responseTime:[6, 26, 8, 8, 1, 18, 13, 23, 12, 24]} //quiz3 - game3
    ]

    //for host, DISPLAY stats for EACH game: average score, average response time
    //NOTE: each entry in the array is a game, and each game has an array of players
    let gameHostHistory = [
        [
            { name: "Player1", scores: [1, 0, 1, 1, 1], responseTimes: [4, 21, 24, 1, 2]}, //quiz1 - game1
            { name: "Player2", scores: [0, 1, 1, 0, 1], responseTimes: [23, 21, 9, 3, 2]},
            { name: "Player3", scores: [1, 1, 1, 1, 1], responseTimes: [12, 5, 1, 7, 5]},
            { name: "Player4", scores: [0, 0, 1, 1, 0], responseTimes: [12, 21, 15, 5, 2]},
            { name: "Player5", scores: [1, 0, 1, 0, 1], responseTimes: [3, 21, 2, 3, 2]},
        ],
        [
            { name: "Player2", scores: [1, 1, 0, 0, 1], responseTimes:  [21, 19, 10, 7, 21]}, //quiz2 - game2
            { name: "Player1", scores: [0, 1, 1, 0, 1], responseTimes: [2, 2, 5, 21, 4]},
            { name: "Player4", scores: [1, 1, 1, 0, 0], responseTimes: [2, 30, 6, 5, 24]},
            { name: "Player3", scores: [0, 1, 1, 1, 1], responseTimes: [9, 29, 8, 21, 15]},
            { name: "Player5", scores: [1, 1, 1, 0, 1], responseTimes: [28, 28, 10, 16, 3]},
        ],
        [
            { name: "Player3", scores: [1, 1, 1, 1, 1, 0, 1, 0, 1, 1], responseTime:[6, 26, 8, 8, 1, 18, 13, 23, 12, 24]}, //quiz3 - game3
            { name: "Player1", scores: [1, 1, 0, 0, 1, 1, 1, 1, 1, 0], responseTime:[16, 23, 22, 15, 4, 5, 18, 10, 9, 1]},
            { name: "Player2", scores: [1, 1, 1, 1, 1, 0, 1, 0, 1, 1], responseTime:[3, 18, 23, 26, 17, 16, 1, 15, 24, 3]},
            { name: "Player4", scores: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0], responseTime:[30, 11, 20, 21, 21, 5, 20, 15, 10, 26]},
            { name: "Player5", scores: [1, 1, 1, 0, 1, 1, 0, 0, 1, 1], responseTime:[15, 29, 24, 11, 24, 2, 2, 17, 8, 20]},
        ],
    ];

</script>