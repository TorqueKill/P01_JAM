<script lang="js">
  // @ts-nocheck

  import { goto } from "$app/navigation";
  import { quiz1, quiz2, quiz3 } from "$lib/dummyQuiz.js";
  import { onMount } from "svelte";
  import { user } from "$lib/userStore.js";

  let quizzes;
  let displayQuizCheck;
  let quizToDisplay = [];
  let quizChosen;
  let quizIdx;

  onMount(() => {
    let savedQuizzes = JSON.parse(localStorage.getItem("Quiz")) || [];
    if (savedQuizzes.length > 7) {
      savedQuizzes = savedQuizzes.slice(0, 6);
      localStorage.setItem("Quiz", JSON.stringify(savedQuizzes));
    }
    quizzes = [quiz1, quiz2, quiz3, ...savedQuizzes];
    displayQuizCheck = false;
    console.log("Loaded quizzes:", quizzes);
  });

  // onMount(() => {
  //   //append more from local storage if any
  //   const savedQuizzes = JSON.parse(localStorage.getItem("Quiz")) || [];
  //   console.log(savedQuizzes);
  //   // localStorage.setItem("Quiz", JSON.stringify(savedQuizzes));

  //   quizzes = [...savedQuizzes];
  //   displayQuizCheck = false;
  //   console.log(quizzes);
  // });

  //need to sugar quiz if its in the format of quiz1,2,3
  //which is [{question,answer,choices:[choice1,choice2,choice3,choice4]}, ...]
  const sugarQuiz = (quiz) => {
    //wrap each question in []
    let newQuiz = [];
    for (let x in quiz) {
      //also wrap choices in []
      let newChoices = [];
      for (let y in quiz[x].choices) {
        newChoices.push(quiz[x].choices[y]);
      }
      newQuiz.push({
        question: quiz[x].question,
        answer: quiz[x].answer,
        options: newChoices,
        timeLimit: quiz[x].timeLimit,
      });
    }
    return newQuiz;
  };

  function displayQuiz(quiz, idx) {
    //console.log(quizzes);
    quizToDisplay = sugarQuiz(quiz);
    displayQuizCheck = true;
    quizIdx = idx;
  }

  const closeQuiz = () => {
    displayQuizCheck = false;
  };

  //MAKE SURE TO SAVE QUIZ FROM THE OG QUIZ ARRAY
  const chooseQuiz = () => {
    $user.hostQuiz = quizzes[quizIdx];
    quizChosen = true;
    displayQuizCheck = false;
  };

  // update questions, answers, options, and time limits
  function updateQuizDetails(quizIdx, questionIdx, field, value, optionIdx) {
    if (field === "question") {
      quizzes[quizIdx][questionIdx].question = value;
    } else if (field === "answer") {
      quizzes[quizIdx][questionIdx].answer = value;
    } else if (field === "options") {
      quizzes[quizIdx][questionIdx].choices[optionIdx] = value;
    } else if (field === "timeLimit") {
      quizzes[quizIdx][questionIdx].timeLimit = parseInt(value, 10);
    }
    // quizzes = [...quizzes];
  }

  // function escapeCSS(str) {
  //   return str.replace(/("|;|\n)/g, "\\$1");
  // }

  // function downloadQuizAsCSS(quiz, idx) {
  //   let cssContent =
  //     "/* Quiz format: question { answer: value; choices: value; time-limit: value; image-url: value; } */\n\n";

  //   // convert each quiz to CSS structure
  //   quiz.forEach((item, questionIndex) => {
  //     cssContent += `.question-${questionIndex + 1} {\n`;
  //     cssContent += `  question: "${escapeCSS(item.question)}";\n`;
  //     cssContent += `  answer: "${escapeCSS(item.answer)}";\n`;
  //     cssContent += `  choices: "${item.options
  //       .map(escapeCSS)
  //       .join(" | ")}";\n`; // a | b | c | d
  //     cssContent += `  time-limit: "${item.timeLimit}";\n`;
  //     if (item.imageUrl) {
  //       cssContent += `  image-url: "${escapeCSS(item.imageUrl)}";\n`;
  //     }
  //     cssContent += `}\n\n`;
  //   });
  //   console.log(cssContent);

  //   // Blob and URL.createObjectURL for download
  //   const blob = new Blob([cssContent], { type: "text/css;charset=utf-8;" });
  //   const url = URL.createObjectURL(blob);

  //   // temporary link to trigger download
  //   const link = document.createElement("a");
  //   link.setAttribute("href", url);
  //   link.setAttribute("download", `quiz_${idx + 1}.css`);
  //   document.body.appendChild(link);
  //   link.click();

  //   // clean url after download
  //   document.body.removeChild(link);
  //   URL.revokeObjectURL(url);
  // }

  // function importQuiz(event) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       const content = e.target.result;
  //       const parsedQuiz = parseCSVToQuiz(content);
  //       quizzes.set([...$quizzes, ...parsedQuiz]);
  //     };
  //     reader.readAsText(file);
  //   }
  // }

  // function parseCSSQuiz(cssText) {
  //   let newQuizzes = [];

  //   // regex to match the quiz format
  //   const quizRegex =
  //     /\.question-\d+ {\s*question: "([^"]+)";\s*answer: "([^"]+)";\s*choices: "([^"]+)";\s*time-limit: "(\d+)";\s*}/g;
  //   let match;

  //   while ((match = quizRegex.exec(cssText)) !== null) {
  //     const [, question, answer, choices, timeLimit] = match;

  //     const choicesArray = choices.split(" | ");

  //     const quiz = {
  //       question,
  //       answer,
  //       choices: choicesArray,
  //       timeLimit: parseInt(timeLimit, 10),
  //     };
  //     newQuizzes.push(quiz);
  //   }

  //   quizzes = quizzes.concat(
  //     newQuizzes.filter(
  //       (newQuiz) =>
  //         !quizzes.some(
  //           (existingQuiz) => existingQuiz.question === newQuiz.question
  //         )
  //     )
  //   );
  //   console.log(newQuizzes);

  //   saveQuizzes();
  //   quizToDisplay = quizzes[quizzes.length - newQuizzes.length];
  //   displayQuizCheck = true;
  // }

  function downloadQuizAsCSV(idx) {
    let quiz = quizzes[idx];

    // Check if any quiz item has an imageUrl
    const hasImageUrl = quiz.some((item) => "imageUrl" in item);

    // Start with the header for the CSV file
    let csvHeader = "Question,Answer,Choice1,Choice2,Choice3,Choice4,TimeLimit";
    if (hasImageUrl) {
      csvHeader += ",ImageUrl";
    }
    let csvContent = csvHeader + "\n";

    // Iterate through each quiz question
    quiz.forEach((item) => {
      // Add the question and answer
      let row = `"${item.question}","${item.answer}"`;

      // Add the choices
      item.choices.forEach((choice) => {
        row += `,"${choice}"`;
      });

      // Add the time limit
      row += `,${item.timeLimit}`;

      // Add the image URL if it exists
      if (hasImageUrl) {
        row += `,"${item.imageUrl || ""}"`;
      }

      // Add the row to the CSV content
      csvContent += row + "\n";
    });

    // Blob and URL.createObjectURL for download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Temporary link to trigger download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quiz_${idx + 1}.csv`);
    document.body.appendChild(link);
    link.click();

    // Clean URL after download
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importQuiz(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const parsedQuiz = parseCSVToQuiz(content);
        console.log("Parsed: \n");
        console.log(parsedQuiz)

        //save to quizzes
        quizzes.push(parsedQuiz);
        //force svelte to update
        quizzes = [...quizzes];

        // displayQuiz(
        //   quizzes[quizzes.length - parsedQuiz.length],
        //   quizzes.length - parsedQuiz.length
        // );
      };
      reader.readAsText(file);
    }
  }

  function parseCSVToQuiz(csvData) {
    // Split the CSV data into lines
    const lines = csvData.trim().split("\n");

    // Remove the header line
    lines.shift();

    // Map each line to a quiz question object
    const quiz = lines.map((line) => {
      // Split the line by commas, considering quotes
      const [
        question,
        answer,
        choice1,
        choice2,
        choice3,
        choice4,
        timeLimit,
        imageUrl,
      ] = line
        .match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        .map((field) => field.replace(/(^"|"$)/g, ""));

      return {
        question,
        answer,
        choices: [choice1, choice2, choice3, choice4],
        timeLimit: parseInt(timeLimit),
        imageUrl: imageUrl || null,
      };
    });

    // If imgUrl is null, remove it
    quiz.forEach((item) => {
      if (item.imageUrl === null) {
        delete item.imageUrl;
      }
    });

    return quiz;
  }
</script>

<main>
  <body>
    <h2 class="create-quiz">Create Quiz</h2>
    {#if displayQuizCheck}
      <h5>SCROLL DOWN TO VIEW</h5>
    {:else}
      <h5>Note: Only saves 1 quiz (quiz 4)</h5>
      <h5>Quiz 1,2,3 are dummy quizzes</h5>
    {/if}

    <div id="quizChosen">
      {#if quizChosen}
        <p>You choose quiz: {quizIdx + 1}</p>
      {/if}
    </div>

    <div class="container">
      <div id="inside-box">
        {#if quizzes}
          {#each quizzes as quiz, idx}
            <button
              class="btn btn-primary btn-block"
              id="quizNo"
              on:click={() => displayQuiz(quiz, idx)}>Quiz {idx + 1}</button
            >
          {/each}
        {/if}
        <button
          class="btn btn-tertiary btn-block"
          id="createNew"
          on:click={() => {
            goto("/CreateQuestion");
          }}>Create new Quiz</button
        >
        <input type="file" accept=".csv" on:change={importQuiz} />

        <button
          class="btn btn-secondary btn-block"
          id="goBack"
          on:click={() => {
            goto("/hostOrPlayer");
          }}>Go back</button
        >
      </div>
    </div>
    <div class="quiz-editor">
      {#if displayQuizCheck}
        <h2>Choose or edit the quiz</h2>
        {#each quizToDisplay as question, qIdx}
          <div class="question-block">
            <input
              class="question-input"
              type="text"
              bind:value={question.question}
              on:input={(e) =>
                updateQuizDetails(quizIdx, qIdx, "question", e.target.value)}
            />

            <div class="answer-block">
              <label class="answer-label" for={`answer-${qIdx}`}>Answer:</label>
              <input
                class="answer-input"
                type="text"
                bind:value={question.answer}
                on:input={(e) =>
                  updateQuizDetails(quizIdx, qIdx, "answer", e.target.value)}
              />
            </div>

            <div class="options-block">
              {#each question.options as option, oIdx}
                <div class="option-item">
                  <label class="option-label" for={`option-${qIdx}-${oIdx}`}
                    >Option {oIdx + 1}:</label
                  >
                  <input
                    class="option-input"
                    type="text"
                    bind:value={option}
                    on:input={(e) =>
                      updateQuizDetails(
                        quizIdx,
                        qIdx,
                        "options",
                        e.target.value,
                        oIdx
                      )}
                  />
                </div>
              {/each}
            </div>

            <div class="time-limit-block">
              <label class="time-limit-label" for={`timeLimit-${qIdx}`}
                >Time Limit:</label
              >
              <input
                class="time-limit-input"
                type="number"
                bind:value={question.timeLimit}
                on:input={(e) =>
                  updateQuizDetails(quizIdx, qIdx, "timeLimit", e.target.value)}
              />
            </div>
          </div>
        {/each}
        <button class="btn btn-tertiary" on:click={() => chooseQuiz()}
          >Choose</button
        >
        <button
          class="btn btn-tertiary"
          on:click={() => downloadQuizAsCSV(quizIdx)}>Download</button
        >
        <button class="btn btn-secondary" on:click={() => closeQuiz()}
          >Close</button
        >
      {/if}
    </div>
  </body>
</main>

<style>
  body {
    background: #7801a8;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .container {
    width: 20rem;
    height: 26rem;
    background: #c49eff;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 51px;
    padding: 2rem;
    margin: 1rem auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .create-quiz,
  h5,
  #quizChosen p,
  .quiz-editor h2 {
    color: red;
    text-align: center;
  }

  #inside-box {
    width: 20rem;
    height: 26rem;
    border-radius: 51px;
    padding-top: 2rem;
    margin-bottom: 8rem;
    margin-left: 1.25rem;
  }
  .btn {
    margin-right: 6rem;
    width: 5rem;
    border: None;
    font-family: JejuGothic, sans-serif;
    border-radius: 12px;
    height: 2.76rem;
    font-size: 20px;
  }
  .btn-tertiary:active {
    background-color: #005550;
    color: #f0e9e9;
    border: None;
  }
  .btn-primary {
    background: #00a59b;
    border: None;
    font-size: 20px;
    color: white;
    font-family: JejuGothic, sans-serif;
  }
  #quizNo {
    margin-top: 0.75rem;
    margin-left: 7.5rem;
  }
  .btn-secondary {
    background: #c70000;
    border: None;
    margin-top: 3rem;
    margin-left: 6.75rem;
    font-size: 20px;
    color: white;
    width: 6.5rem;
    font-family: JejuGothic, sans-serif;
  }
  .btn-secondary:active {
    background-color: #850101;
    color: white;
    border: None;
  }
  h2 {
    color: white;
    font-family: JejuGothic, sans-serif;
    font-size: 45px;
    margin-left: 29rem;
    margin-top: 2rem;
  }
  .create-quiz {
    color: white;
    font-family: JejuGothic, sans-serif;
    font-size: 45px;
    margin-left: -2rem;
    margin-top: 2rem;
    text-align: center;
  }
  h5 {
    color: rgb(216, 53, 53);
    font-family: JejuGothic, sans-serif;
    text-align: center;
  }
  .btn-tertiary {
    background: #00a59b;
    border: None;
    margin-top: 1rem;
    margin-left: 4.5rem;
    font-size: 20px;
    color: white;
    width: 12rem;
    font-family: JejuGothic, sans-serif;
  }
  #quizChosen {
    color: rgb(216, 53, 53);
    font-family: JejuGothic, sans-serif;
    margin-left: 39.5rem;
  }

  .question-block {
    margin-bottom: 20px;
  }

  .answer-block,
  .options-block,
  .time-limit-block {
    margin-top: 10px;
  }

  .option-item {
    margin-top: 5px;
  }

  .question-input {
    display: block;
    width: 80rem;
    margin-bottom: 5px;
    height: 2rem;
    padding-left: 1rem;
    font-size: 20px;
    font-family: JejuGothic, sans-serif;
    font-size: 20px;
    color: #7801a8;
    background: white;
    border-radius: 12rem;
  }
  .answer-input {
    display: block;
    width: 10rem;
    margin-bottom: 5px;
    margin-top: 1rem;
    text-align: center;
    padding-left: -3rem;
    color: #c49eff;
    font-family: JejuGothic, sans-serif;
    font-size: 15px;
    border-radius: 12rem;
  }
  .option-input {
    display: block;
    width: 10rem;
    margin-bottom: 5px;
    font-family: JejuGothic, sans-serif;
    font-size: 15px;
    border-radius: 12rem;
    padding-left: 1rem;
    color: #7801a8;
  }

  .time-limit-input {
    color: red;
    font-family: JejuGothic, sans-serif;
    border-radius: 5rem;
    text-align: center;
  }
  .answer-label {
    display: block;
    margin-top: 10px;
    padding-top: 0.5rem;
    font-family: JejuGothic, sans-serif;
  }
  .option-label,
  .time-limit-label {
    display: block;
    margin-top: 10px;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    font-family: JejuGothic, sans-serif;
  }

  @media screen and (max-width: 768px) {
    .btn {
      padding: 5px;
      font-size: 14px;
    }

    .create-quiz {
      font-size: 30px;
      margin-left: 5rem;
      display: flex;
      justify-content: center;
    }

    h5 {
      margin-left: 5rem;
      display: flex;
      justify-content: center;
    }
    .question-input {
      margin-left: 12%;
    }

    h2 {
      color: red;
      font-size: 1.25rem;
      text-align: center;
      display: flex;
      justify-content: center;
      width: 80%;
      margin-top: 2%;
      margin-left: 14%;
    }
    .question-input,
    .answer-block,
    .options-block,
    .time-limit-block {
      width: 120%;
      margin-left: 8%;
    }
  }

  @media screen and (min-width: 769px) {
    .btn {
      padding: 10px;
      font-size: 18px;
    }
    h2 {
      color: red;
      font-size: 2rem;
      margin-left: 1rem;
    }
  }
</style>
