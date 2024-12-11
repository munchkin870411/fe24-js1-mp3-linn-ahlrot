const API_URL = "https://opentdb.com/api.php";
const CATEGORY_URL = "https://opentdb.com/api_category.php";
const TOKEN_URL = "https://opentdb.com/api_token.php";
let sessionToken = null; // To store the session token

const settings = document.querySelector("form");
const quizContainer = document.querySelector("#quiz");
const resultContainer = document.querySelector("#result");
const categorySelect = document.querySelector("#category");

let quizData = [];
let score = 0;

// Fetch categories and populate the dropdown
async function fetchCategories() {
  const response = await fetch(CATEGORY_URL);
  const data = await response.json();
  const categories = data.trivia_categories;

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  }
}

// Fetch a session token when the app starts
async function fetchSessionToken() {
  const response = await fetch(`${TOKEN_URL}?command=request`);
  const data = await response.json();
  sessionToken = data.token;
}

// Reset the session token when needed
async function resetSessionToken() {
  if (sessionToken) {
    await fetch(`${TOKEN_URL}?command=reset&token=${sessionToken}`);
  }
}

// Start quiz event
settings.addEventListener("submit", async (event) => {
  event.preventDefault();
  const questionCount = document.querySelector("#questionCount").value;
  const category = categorySelect.value;
  const difficulty = document.querySelector("#difficulty").value;

  const response = await fetch(
    `${API_URL}?amount=${questionCount}&category=${category}&difficulty=${difficulty}&type=multiple&encode=url3986&token=${sessionToken}`
  );
  const data = await response.json();

  // Check response code
  if (data.response_code === 0) {
    quizData = data.results;
    score = 0;
    startQuiz();
  } else if (data.response_code === 4) {
    // Token exhausted, reset it
    await resetSessionToken();
    alert(
      "No more unique questions available. The token has been reset. Please try again."
    );
  } else {
    console.error(
      "Error fetching questions. Response code:",
      data.response_code
    );
    alert("An error occurred while fetching questions. Please try again.");
  }
});

// Start the quiz
function startQuiz() {
  settings.style.display = "none";
  quizContainer.style.display = "block";
  quizContainer.innerHTML = "";

  quizData.forEach((questionData, index) => {
    const questionElement = document.createElement("div");
    questionElement.classList.add("question");

    const questionText = document.createElement("p");
    questionText.textContent = `Question ${index + 1}: ${decodeHTML(
      questionData.question
    )}`;
    questionElement.appendChild(questionText);

    const answers = shuffleArray([
      ...questionData.incorrect_answers,
      questionData.correct_answer,
    ]);

    for (const answer of answers) {
      const answerButton = document.createElement("button");
      answerButton.textContent = decodeHTML(answer);
      answerButton.addEventListener("click", () =>
        handleAnswerClick(answerButton, questionData.correct_answer)
      );
      questionElement.appendChild(answerButton);
    }

    quizContainer.appendChild(questionElement);
  });

  const submitButton = document.createElement("button");
  submitButton.textContent = "Submit Quiz";
  submitButton.addEventListener("click", showResults);
  quizContainer.appendChild(submitButton);
}

function handleAnswerClick(button, correctAnswer) {
  if (button.textContent === decodeHTML(correctAnswer)) {
    button.style.backgroundColor = "#266f29";
    button.style.color = "#fff";
    score++;
  } else {
    button.style.backgroundColor = "#87241d";
    button.style.color = "#fff";
  }
  // Disable all buttons for this question
  const siblingButtons = button.parentElement.querySelectorAll("button");
  siblingButtons.forEach((btn) => (btn.disabled = true));
}

function showResults() {
  quizContainer.style.display = "none";
  resultContainer.style.display = "block";

  resultContainer.innerHTML = `
        <h2>Results</h2>
        <p>You got ${score} out of ${quizData.length} questions correct!</p>
        <button id="restartQuiz">Restart Quiz</button>
    `;

  document.querySelector("#restartQuiz").addEventListener("click", restartQuiz);
}

function restartQuiz() {
  resultContainer.style.display = "none";
  settings.style.display = "block";
  quizData = [];
  score = 0;
}

// Updated decodeHTML function to handle URL encoding
function decodeHTML(html) {
  return decodeURIComponent(html);
}

// Shuffle array
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Fetch categories and session token on page load
window.onload = async () => {
  await fetchCategories();
  await fetchSessionToken();
};
