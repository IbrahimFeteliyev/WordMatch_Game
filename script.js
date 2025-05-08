
let timer;
let timeLeft = 10;
let answered = false;
let correctCount = 0;
let wrongCount = 0;
let selectedQuestions = [];
let currentIndex = 0;
let score = 0;
let lastCategory = null;
let lastLevel = null;
let username = "";
let globalStartTime;
let globalTimerInterval;
let wrongAnswers = [];

const questions = {
  fruits: {
    easy: [
      { word: "Apple", correctImage: "apple.jpg", options: ["apple.jpg", "banana.jpg", "grape.jpg"] },
      { word: "Banana", correctImage: "banana.jpg", options: ["pear.jpg", "banana.jpg", "lemon.jpg"] }
    ],
    medium: [
      { word: "Pineapple", correctImage: "pineapple.jpg", options: ["pineapple.jpg", "orange.jpg", "melon.jpg"] }
    ],
    hard: [
      { word: "Pomegranate", correctImage: "pomegranate.jpg", options: ["pomegranate.jpg", "plum.jpg", "fig.jpg"] }
    ]
  },
  animals: {
    easy: [
      { word: "Dog", correctImage: "dog.jpg", options: ["dog.jpg", "cat.jpg", "cow.jpg"] },
      { word: "Cat", correctImage: "cat.jpg", options: ["cat.jpg", "tiger.jpg", "lion.jpg"] }
    ],
    medium: [
      { word: "Elephant", correctImage: "elephant.jpg", options: ["elephant.jpg", "rhino.jpg", "hippo.jpg"] }
    ],
    hard: [
      { word: "Chameleon", correctImage: "chameleon.jpg", options: ["chameleon.jpg", "iguana.jpg", "frog.jpg"] }
    ]
  },
  colors: {
    easy: [
      { word: "Red", correctImage: "red.jpg", options: ["red.jpg", "blue.jpg", "green.jpg"] },
      { word: "Blue", correctImage: "blue.jpg", options: ["purple.jpg", "blue.jpg", "orange.jpg"] }
    ],
    medium: [
      { word: "Turquoise", correctImage: "turquoise.jpg", options: ["turquoise.jpg", "cyan.jpg", "aqua.jpg"] }
    ],
    hard: [
      { word: "Magenta", correctImage: "magenta.jpg", options: ["magenta.jpg", "maroon.jpg", "crimson.jpg"] }
    ]
  }
};

function startGame(useLastSettings = false) {
  username = document.getElementById("username").value.trim();
  if (!username) username = "Player";

  const category = useLastSettings ? lastCategory : document.getElementById("category").value;
  const level = useLastSettings ? lastLevel : document.getElementById("level").value;

  lastCategory = category;
  lastLevel = level;

  selectedQuestions = questions[category][level];
  shuffleArray(selectedQuestions);
  currentIndex = 0;
  score = 0;
  correctCount = 0;
  wrongCount = 0;
  answered = false;
  wrongAnswers = [];
  document.getElementById("score").textContent = score;

  document.getElementById("setup-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
  document.getElementById("result-section").style.display = "none";

  loadWord();

  globalStartTime = Date.now();
  if (globalTimerInterval) clearInterval(globalTimerInterval);
  globalTimerInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - globalStartTime) / 1000);
    const timerDisplay = document.getElementById("global-time");
    if (timerDisplay) {
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      timerDisplay.textContent = `${mins}:${secs}`;
    }
  }, 1000);
}

function loadWord() {
  answered = false;
  const current = selectedQuestions[currentIndex];
  const wordDisplay = document.getElementById("word-display");
  const feedback = document.getElementById("feedback");
  const level = document.getElementById("level").value;
  const isTypedLevel = level === "hard";
  const imageOptions = document.getElementById("image-options");

  feedback.textContent = "";
  feedback.className = "feedback";

  wordDisplay.innerHTML = `
    <div class="word-card">
      <span class="word-text">${isTypedLevel ? "What is this?" : `Find: <strong>${current.word}</strong>`}</span>
      <button id="play-audio" class="btn-audio" aria-label="Play pronunciation">
        <i class="fas fa-volume-up"></i>
      </button>
      <div id="timer" class="timer">Time left: 10s</div>
    </div>
  `;

  playAudio(current.word);
  document.getElementById("play-audio").addEventListener("click", () => playAudio(current.word));

  imageOptions.innerHTML = "";

  if (isTypedLevel) {
    document.getElementById("typed-answer").style.display = "block";
    imageOptions.style.display = "flex";
    imageOptions.classList.add("single-image");
    imageOptions.innerHTML = `<img src="images/${current.correctImage}" alt="Question image" />`;
    document.getElementById("answer-input").value = "";
    document.getElementById("answer-input").focus();
  } else {
    document.getElementById("typed-answer").style.display = "none";
    imageOptions.style.display = "grid";
    imageOptions.classList.remove("single-image");
    const shuffledOptions = [...current.options];
    shuffleArray(shuffledOptions);
    shuffledOptions.forEach((img) => {
      const imageElement = document.createElement("img");
      imageElement.src = "images/" + img;
      imageElement.alt = img.replace(".jpg", "");
      imageElement.addEventListener("click", () => {
        if (!answered) {
          clearInterval(timer);
          handleSelection(img);
        }
      });
      imageOptions.appendChild(imageElement);
    });
  }

  startTimer();
}

function handleSelection(selectedImg) {
  if (answered) return;
  answered = true;
  clearInterval(timer);
  const current = selectedQuestions[currentIndex];
  const feedback = document.getElementById("feedback");
  const imageOptions = document.getElementById("image-options");

  if (selectedImg === current.correctImage) {
    score += 10;
    correctCount++;
    feedback.textContent = "✅ Correct!";
    feedback.className = "feedback correct";
  } else {
    wrongCount++;
    feedback.textContent = "❌ Wrong!";
    feedback.className = "feedback incorrect";
    wrongAnswers.push({
      question: current.word,
      correct: current.correctImage.replace(".jpg", ""),
      selected: selectedImg.replace(".jpg", "")
    });
  }

  document.getElementById("score").textContent = score;
  const allImages = imageOptions.querySelectorAll("img");
  allImages.forEach((img) => {
    img.style.pointerEvents = "none";
    if (img.src.includes(current.correctImage)) {
      img.style.borderColor = "var(--success-color)";
    } else if (img.src.includes(selectedImg)) {
      img.style.borderColor = "var(--error-color)";
    }
  });

  currentIndex++;
  setTimeout(nextOrEndGame, 1500);
}

function checkTypedAnswer() {
  if (answered) return;
  answered = true;
  clearInterval(timer);
  const current = selectedQuestions[currentIndex];
  const input = document.getElementById("answer-input").value.trim().toLowerCase();
  const correct = current.word.toLowerCase();
  const feedback = document.getElementById("feedback");

  if (input === correct) {
    score += 10;
    correctCount++;
    feedback.textContent = "✅ Correct!";
    feedback.className = "feedback correct";
  } else {
    wrongCount++;
    feedback.textContent = `❌ Wrong! The correct answer was: ${current.word}`;
    feedback.className = "feedback incorrect";
    wrongAnswers.push({
      question: current.word,
      correct: current.word,
      selected: input
    });
  }

  document.getElementById("score").textContent = score;
  currentIndex++;
  setTimeout(nextOrEndGame, 1500);
}

function nextOrEndGame() {
  if (currentIndex < selectedQuestions.length) {
    loadWord();
  } else {
    document.getElementById("word-display").textContent = "Game Over!";
    document.getElementById("typed-answer").style.display = "none";
    document.getElementById("image-options").innerHTML = "";
    document.getElementById("game-section").style.display = "none";
    document.getElementById("result-section").style.display = "block";

    document.getElementById("total-questions").textContent = selectedQuestions.length;
    document.getElementById("correct-answers").textContent = correctCount;
    document.getElementById("wrong-answers").textContent = wrongCount;
    document.getElementById("final-score").textContent = score;
    document.getElementById("player-name").textContent = username + "'s";
    clearInterval(globalTimerInterval);

    const reviewList = document.getElementById("review-list");
    reviewList.innerHTML = "";
    if (wrongAnswers.length === 0) {
      const li = document.createElement("li");
      li.textContent = "🎉 You had no mistakes!";
      reviewList.appendChild(li);
    } else {
      wrongAnswers.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `❌ You answered '${item.selected}' instead of '${item.correct}' for "${item.question}"`;
        reviewList.appendChild(li);
      });
    }

    const elapsed = Math.floor((Date.now() - globalStartTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    const result = {
      username: username,
      score: score,
      correct: correctCount,
      wrong: wrongCount,
      time: `${minutes}:${seconds}`,
      date: new Date().toLocaleString()
    };

    let allResults = JSON.parse(localStorage.getItem("wordMatchResults")) || [];
    allResults.push(result);
    localStorage.setItem("wordMatchResults", JSON.stringify(allResults));
  }
}

function startTimer() {
  timeLeft = 10;
  const timerDisplay = document.getElementById("timer");
  const feedback = document.getElementById("feedback");

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `Time left: ${timeLeft}s`;
    timerDisplay.style.color = timeLeft <= 3 ? "var(--error-color)" : "var(--text-color)";
    if (timeLeft <= 0) {
      clearInterval(timer);
      feedback.textContent = "⏳ Time's up!";
      feedback.className = "feedback incorrect";
      currentIndex++;
      setTimeout(nextOrEndGame, 1500);
    }
  }, 1000);
}

function playAudio(word) {
  const audio = new Audio("sounds/" + word.toLowerCase() + ".mp3");
  audio.play();
}

function restartGame() {
  startGame(true);
}

function goToMainMenu() {
  document.getElementById("setup-section").style.display = "block";
  document.getElementById("game-section").style.display = "none";
  document.getElementById("result-section").style.display = "none";
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
