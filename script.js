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
let matchSelectedWord = null;
let matchCurrentPairs = [];
let selectedWord = null;
let selectedImage = null;
let connections = [];
let currentMatches = new Map();

const questions = {
  fruits: {
    easy: [
      {
        word: "Apple",
        correctImage: "apple.jpg",
        options: ["apple.jpg", "banana.jpg", "grape.jpg"],
      },
      {
        word: "Banana",
        correctImage: "banana.jpg",
        options: ["pear.jpg", "banana.jpg", "lemon.jpg"],
      },
    ],
    medium: [
      {
        word: "Pineapple",
        correctImage: "pineapple.jpg",
        options: ["pineapple.jpg", "orange.jpg", "melon.jpg"],
      },
    ],
    hard: [
      {
        word: "Pomegranate",
        correctImage: "pomegranate.jpg",
        options: ["pomegranate.jpg", "plum.jpg", "fig.jpg"],
      },
    ],
  },
  animals: {
    easy: [
      {
        word: "Dog",
        correctImage: "dog.jpg",
        options: ["dog.jpg", "cat.jpg", "cow.jpg"],
      },
      {
        word: "Cat",
        correctImage: "cat.jpg",
        options: ["cat.jpg", "tiger.jpg", "lion.jpg"],
      },
    ],
    medium: [
      {
        word: "Elephant",
        correctImage: "elephant.jpg",
        options: ["elephant.jpg", "rhino.jpg", "hippo.jpg"],
      },
    ],
    hard: [
      {
        word: "Chameleon",
        correctImage: "chameleon.jpg",
        options: ["chameleon.jpg", "iguana.jpg", "frog.jpg"],
      },
    ],
  },
  colors: {
    easy: [
      {
        word: "Red",
        correctImage: "red.jpg",
        options: ["red.jpg", "blue.jpg", "green.jpg"],
      },
      {
        word: "Blue",
        correctImage: "blue.jpg",
        options: ["purple.jpg", "blue.jpg", "orange.jpg"],
      },
    ],
    medium: [
      {
        word: "Turquoise",
        correctImage: "turquoise.jpg",
        options: ["turquoise.jpg", "cyan.jpg", "aqua.jpg"],
      },
    ],
    hard: [
      {
        word: "Magenta",
        correctImage: "magenta.jpg",
        options: ["magenta.jpg", "maroon.jpg", "crimson.jpg"],
      },
    ],
  },
};

function startGame(useLastSettings = false) {
  username = document.getElementById("username").value.trim();
  if (!username) username = "Player";

  const category = useLastSettings
    ? lastCategory
    : document.getElementById("category").value;
  const level = useLastSettings
    ? lastLevel
    : document.getElementById("level").value;

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

  // Always start global timer for all levels
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

  if (level === "medium") {
    loadMatchTask();
    return;
  }
  loadWord();
}

function loadWord() {
  answered = false;
  const current = selectedQuestions[currentIndex];
  const wordDisplay = document.getElementById("word-display");
  const feedback = document.getElementById("feedback");
  const level = document.getElementById("level").value;

  // ⬇️ A2 (medium) səviyyəsi üçün xüsusi tapşırıq yönləndirməsi
  if (level === "medium") {
    loadMatchTask();
    return;
  }

  const isTypedLevel = level === "hard";
  const imageOptions = document.getElementById("image-options");

  feedback.textContent = "";
  feedback.className = "feedback";

  wordDisplay.innerHTML = `
    <div class="word-card">
      <span class="word-text">${
        isTypedLevel
          ? "What is this?"
          : `Find: <strong>${current.word}</strong>`
      }</span>
      <button id="play-audio" class="btn-audio" aria-label="Play pronunciation">
        <i class="fas fa-volume-up"></i>
      </button>
      <div id="timer" class="timer">Time left: 10s</div>
    </div>
  `;

  playAudio(current.word);
  document
    .getElementById("play-audio")
    .addEventListener("click", () => playAudio(current.word));

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
      selected: selectedImg.replace(".jpg", ""),
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
  const input = document
    .getElementById("answer-input")
    .value.trim()
    .toLowerCase();
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
      selected: input,
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
      wrongAnswers.forEach((item) => {
        if (item.question === "Matching task" && item.details) {
          const div = document.createElement("div");
          div.innerHTML = `<i class='fas fa-exchange-alt'></i> <strong>Matching task:</strong><ul style='margin:0.5em 0 0 1.5em;padding:0;'>${item.details.map(d => `<li style='margin-bottom:0.25em;'><span style='font-weight:600;'>${d.word}:</span> ${d.isCorrect ? "<span style='color:#059669;'>✅ Correct!</span>" : `❌ You chose '<span style='color:#dc2626;'>${d.selected}</span>', correct is '<span style='color:#059669;'>${d.correct}</span>'`}</li>`).join("")}</ul>`;
          reviewList.appendChild(div);
        } else {
          const li = document.createElement("li");
          li.textContent = `❌ You answered '${item.selected}' instead of '${item.correct}' for "${item.question}"`;
          reviewList.appendChild(li);
        }
      });
    }

    // Calculate and display total time
    const elapsed = Math.floor((Date.now() - globalStartTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    const totalTime = `${minutes}:${seconds}`;
    const globalTimeElem = document.getElementById("global-time");
    if (globalTimeElem) {
      globalTimeElem.textContent = totalTime;
    }

    // Save result with correct time
    const result = {
      username: username,
      score: score,
      correct: correctCount,
      wrong: wrongCount,
      time: totalTime,
      date: new Date().toLocaleString(),
      level: lastLevel,
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
    timerDisplay.style.color =
      timeLeft <= 3 ? "var(--error-color)" : "var(--text-color)";
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

function loadMatchTask() {
  answered = false;
  const matchTask = document.getElementById("match-task");
  const imageOptions = document.getElementById("image-options");
  const typedAnswer = document.getElementById("typed-answer");
  const wordDisplay = document.getElementById("word-display");
  const feedback = document.getElementById("feedback");

  if (!matchTask || !imageOptions || !typedAnswer || !wordDisplay || !feedback) {
    console.error("Required elements not found");
    return;
  }

  matchTask.style.display = "block";
  imageOptions.style.display = "none";
  typedAnswer.style.display = "none";
  wordDisplay.style.display = "none";
  feedback.textContent = "";

  // Add or update timer display for medium level
  let matchTimer = document.getElementById("match-timer");
  if (!matchTimer) {
    matchTimer = document.createElement("div");
    matchTimer.id = "match-timer";
    matchTimer.className = "timer";
    matchTask.insertBefore(matchTimer, matchTask.firstChild.nextSibling); // after the title
  }
  matchTimer.textContent = "Time left: 30s";

  let matchTimeLeft = 30;
  if (window.matchTimerInterval) clearInterval(window.matchTimerInterval);
  window.matchTimerInterval = setInterval(() => {
    matchTimeLeft--;
    matchTimer.textContent = `Time left: ${matchTimeLeft}s`;
    matchTimer.style.color = matchTimeLeft <= 5 ? "var(--error-color)" : "var(--text-color)";
    if (matchTimeLeft <= 0) {
      clearInterval(window.matchTimerInterval);
      if (!answered) {
        answered = true;
        // Show time's up feedback
        feedback.textContent = "⏳ Time's up!";
        feedback.className = "feedback incorrect";
        // Auto-submit (will mark as incorrect if not all matched)
        submitMatches();
      }
    }
  }, 1000);

  const current = selectedQuestions[currentIndex];
  matchCurrentPairs = [...current.options];
  shuffleArray(matchCurrentPairs);
  selectedWord = null;
  selectedImage = null;
  connections = [];
  currentMatches.clear();

  // Clear any existing arrow container
  const existingContainer = document.getElementById("arrow-container");
  if (existingContainer) {
    existingContainer.remove();
  }

  const wordList = document.getElementById("word-list");
  const imageList = document.getElementById("image-list");

  if (!wordList || !imageList) {
    console.error("Word list or image list not found");
    return;
  }

  wordList.innerHTML = "";
  imageList.innerHTML = "";

  // Get unique words and their corresponding images
  const wordImagePairs = [
    { word: current.word, image: current.correctImage },
    ...current.options
      .filter(img => img !== current.correctImage)
      .map(img => ({
        word: img.split(".")[0],
        image: img
      }))
  ].slice(0, 3);

  // Shuffle the pairs
  shuffleArray(wordImagePairs);

  // Create word elements
  wordImagePairs.forEach(({ word }) => {
    const wordItem = document.createElement("div");
    wordItem.className = "match-word";
    wordItem.textContent = word;
    wordItem.dataset.word = word;
    wordItem.onclick = () => handleWordClick(wordItem);
    wordList.appendChild(wordItem);
  });

  // Create image elements
  wordImagePairs.forEach(({ image }) => {
    const imgItem = document.createElement("img");
    imgItem.className = "match-image";
    imgItem.src = "images/" + image;
    imgItem.alt = image.split(".")[0];
    imgItem.dataset.image = image;
    imgItem.onclick = () => handleImageClick(imgItem);
    imageList.appendChild(imgItem);
  });

  // Create match content container if it doesn't exist
  let matchContent = document.querySelector(".match-content");
  if (!matchContent) {
    matchContent = document.createElement("div");
    matchContent.className = "match-content";
    matchTask.appendChild(matchContent);
  }

  // Create SVG container for arrows
  const svgContainer = document.createElement("div");
  svgContainer.id = "arrow-container";
  svgContainer.style.position = "absolute";
  svgContainer.style.top = "0";
  svgContainer.style.left = "0";
  svgContainer.style.width = "100%";
  svgContainer.style.height = "100%";
  svgContainer.style.pointerEvents = "none";
  svgContainer.style.zIndex = "1";
  matchContent.appendChild(svgContainer);

  // Add submit button
  const existingSubmitButton = document.querySelector(".submit-matches");
  if (existingSubmitButton) {
    existingSubmitButton.remove();
  }
  
  const submitButton = document.createElement("button");
  submitButton.className = "btn-primary submit-matches";
  submitButton.innerHTML = '<i class="fas fa-check"></i> Submit Matches';
  submitButton.onclick = submitMatches;
  submitButton.disabled = true;
  matchTask.appendChild(submitButton);

  startTimer();
}

function handleWordClick(wordElement) {
  if (answered || wordElement.classList.contains("matched")) return;
  
  // Remove previous selection
  document.querySelectorAll(".match-word").forEach(el => {
    el.classList.remove("selected");
  });
  
  wordElement.classList.add("selected");
  selectedWord = wordElement.dataset.word;
  
  // If we have both selections, create a match
  if (selectedWord && selectedImage) {
    createMatch();
  }
}

function handleImageClick(imageElement) {
  if (answered || imageElement.classList.contains("matched")) return;
  
  // Remove previous selection
  document.querySelectorAll(".match-image").forEach(el => {
    el.classList.remove("selected");
  });
  
  imageElement.classList.add("selected");
  selectedImage = imageElement.dataset.image;
  
  // If we have both selections, create a match
  if (selectedWord && selectedImage) {
    createMatch();
  }
}

function createMatch() {
  const wordElement = document.querySelector(".match-word.selected");
  const imageElement = document.querySelector(".match-image.selected");
  
  if (!wordElement || !imageElement) return;
  
  // Check if this word or image is already matched
  if (currentMatches.has(selectedWord) || Array.from(currentMatches.values()).includes(selectedImage)) {
    return;
  }
  
  // Add the match
  currentMatches.set(selectedWord, selectedImage);
  
  // Draw arrow
  drawArrow(wordElement, imageElement, true);
  
  // Mark elements as matched
  wordElement.classList.add("matched");
  imageElement.classList.add("matched");
  
  // Reset selections
  selectedWord = null;
  selectedImage = null;
  document.querySelectorAll(".match-word, .match-image").forEach(el => {
    el.classList.remove("selected");
  });
  
  // Update submit button state
  const submitButton = document.querySelector(".submit-matches");
  if (submitButton && currentMatches.size === 3) {
    submitButton.disabled = false;
  }
}

function submitMatches() {
  if (answered || currentMatches.size !== 3) return;
  
  answered = true;
  clearInterval(timer);
  if (window.matchTimerInterval) clearInterval(window.matchTimerInterval);
  
  const current = selectedQuestions[currentIndex];
  let correctMatches = 0;
  const matchDetails = [];
  
  // Check each match
  currentMatches.forEach((image, word) => {
    const isCorrect = image.split(".")[0].toLowerCase() === word.toLowerCase();
    if (isCorrect) {
      correctMatches++;
    }
    matchDetails.push({
      word,
      selected: image.split(".")[0],
      correct: word,
      isCorrect
    });
  });
  
  const feedback = document.getElementById("feedback");
  if (feedback) {
    // Update score and feedback
    if (correctMatches === 3) {
      score += 10;
      correctCount++;
      feedback.textContent = "✅ All matches are correct!";
      feedback.className = "feedback correct";
    } else {
      wrongCount++;
      feedback.textContent = `❌ ${correctMatches} out of 3 matches are correct`;
      feedback.className = "feedback incorrect";
      wrongAnswers.push({
        question: "Matching task",
        details: matchDetails
      });
    }
  }
  
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.textContent = score;
  }
  
  // Disable all interactions
  document.querySelectorAll(".match-word, .match-image").forEach(el => {
    el.style.pointerEvents = "none";
  });
  
  // Clear the arrow container and redraw all arrows
  const arrowContainer = document.getElementById("arrow-container");
  if (arrowContainer) {
    arrowContainer.innerHTML = "";
    currentMatches.forEach((image, word) => {
      const wordElement = document.querySelector(`.match-word[data-word="${word}"]`);
      const imageElement = document.querySelector(`.match-image[data-image="${image}"]`);
      if (wordElement && imageElement) {
        const isCorrect = image.split(".")[0].toLowerCase() === word.toLowerCase();
        drawArrow(wordElement, imageElement, isCorrect);
      }
    });
  }
  
  currentIndex++;
  setTimeout(nextOrEndGame, 2000);
}

function drawArrow(fromElement, toElement, isCorrect) {
  const svgContainer = document.getElementById("arrow-container");
  if (!svgContainer) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.position = "absolute";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.pointerEvents = "none";
  svg.style.zIndex = "1";
  
  const fromRect = fromElement.getBoundingClientRect();
  const toRect = toElement.getBoundingClientRect();
  const containerRect = svgContainer.getBoundingClientRect();
  
  const fromX = fromRect.right - containerRect.left;
  const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
  const toX = toRect.left - containerRect.left;
  const toY = toRect.top + toRect.height / 2 - containerRect.top;
  
  // Use solid green for correct, solid red for incorrect
  const color = isCorrect ? '#059669' : '#dc2626';
  
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  // Create curved path
  const midX = (fromX + toX) / 2;
  path.setAttribute("d", `M ${fromX} ${fromY} Q ${midX} ${fromY} ${toX} ${toY}`);
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", "3");
  path.setAttribute("fill", "none");
  path.setAttribute("marker-end", `url(#arrowhead-${isCorrect ? 'green' : 'red'})`);

  // Add arrowhead marker
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", `arrowhead-${isCorrect ? 'green' : 'red'}`);
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "3.5");
  marker.setAttribute("orient", "auto");
  
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
  polygon.setAttribute("fill", color);
  
  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.appendChild(defs);
  svg.appendChild(path);
  svgContainer.appendChild(svg);
}
