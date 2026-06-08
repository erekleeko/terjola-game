// აქ ჩასვი Apps Script-ის დროს დაკოპირებული URL
const API_URL = "https://script.google.com/macros/s/AKfycbx2WV7xl5errtux2ANq0ElcxaNwnBEQ6JnepoQ8_XZ6AB1EoA3Xb1tCN3uZI-G10JQ0dA/exec"; 

let gameData = [];
let currentQuestionIndex = 0;
let score = 0;

const loadingDiv = document.getElementById('loading');
const gameContentDiv = document.getElementById('game-content');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const locationName = document.getElementById('location-name');
const scoreDisplay = document.getElementById('score');

// Google Sheets-იდან კითხვების წამოღება
async function fetchQuestions() {
    try {
        const response = await fetch(API_URL);
        gameData = await response.json();
        
        // როცა ჩაიტვირთება, ვმალავთ loading-ს და ვაჩვენებთ თამაშს
        loadingDiv.style.display = 'none';
        gameContentDiv.style.display = 'block';
        
        loadQuestion();
    } catch (error) {
        console.error("შეცდომა მონაცემების წამოღებისას:", error);
        loadingDiv.innerText = "შეცდომა მონაცემების ჩატვირთვისას. სცადეთ მოგვიანებით.";
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= gameData.length) {
        finishGame();
        return;
    }

    const currentData = gameData[currentQuestionIndex];
    locationName.innerText = currentData.location;
    questionText.innerText = currentData.question;
    
    optionsContainer.innerHTML = ''; // ვასუფთავებთ წინა პასუხებს
    
    currentData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.onclick = () => checkAnswer(index);
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedIndex) {
    const correctIndex = gameData[currentQuestionIndex].correctAnswer;
    
    if (selectedIndex === correctIndex) {
        score += 10;
        alert("სწორია! შენ იპოვე გასაღები 🗝️");
        currentQuestionIndex++;
        loadQuestion();
    } else {
        alert("არასწორია. დაფიქრდი და სცადე თავიდან!");
    }
    scoreDisplay.innerText = score;
}

function showHint() {
    alert("მინიშნება: " + gameData[currentQuestionIndex].hint);
}

function finishGame() {
    gameContentDiv.innerHTML = `
        <h2>გილოცავთ!</h2>
        <p>თქვენ დაასრულეთ მოგზაურობა. საბოლოო ქულა: ${score}</p>
        <button onclick="location.reload()">თავიდან დაწყება</button>
    `;
}

// თამაშის ჩართვისთანავე ვიწყებთ მონაცემების წამოღებას
fetchQuestions();