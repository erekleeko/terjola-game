// აუცილებლად ჩასვი შენი API ბმული!!!
const API_URL = "https://script.google.com/macros/s/AKfycbySJut6mp98TXzG8yPyTyZNAvyqw2CooFsUZxjtCmCNP1u82QbElX2imbN5j6z9raGReg/exec"; 

let groupedData = {}; 
let levels = []; 
let currentLevelIndex = 0;
let currentQuestionIndex = 0;
let score = 0;
let playerName = ""; 
let questionStartTime = 0; // დროის ასათვლელად

const mapCoordinates = {
    "თერჯოლის მერია": { top: "60%", left: "65%" },
    "სოფელი ღვანკითი": { top: "35%", left: "45%" },
    "სოფელი გოგნი": { top: "45%", left: "25%" },
    "სოფელი ჩხარი": { top: "65%", left: "35%" }
};

const introTextString = "ეს არ არის უბრალო თამაში, ეს არის თავგადასავალი... შენი მიზანია შემოიარო ჩვენი მუნიციპალიტეტი, ამოხსნა საიდუმლოებები და მოიპოვო 'თერჯოლის მცოდნის' ტიტული. მზად ხარ დაიწყო მოგზაურობა?";
let typeIndex = 0;
const typingSpeed = 70; 

const screens = document.querySelectorAll('.screen');
const characterImg = document.getElementById('character-img');

function showScreen(screenId) {
    screens.forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex'; 
    if(screenId !== 'intro-screen' && screenId !== 'loading' && screenId !== 'welcome-screen' && screenId !== 'leaderboard-screen') {
        document.getElementById(screenId).style.display = 'block';
    }
}

async function fetchQuestions() {
    try {
        const response = await fetch(`${API_URL}?t=${Date.now()}`);
        const rawData = await response.json();
        
        rawData.forEach(item => {
            const levelKey = item.location.trim();
            if (!groupedData[levelKey]) {
                groupedData[levelKey] = [];
                levels.push(levelKey);
            }
            groupedData[levelKey].push(item);
        });
        showScreen('welcome-screen'); 
    } catch (error) {
        console.error("შეცდომა:", error);
        document.getElementById('loading').innerHTML = "<h2>შეცდომა კავშირისას. გთხოვთ გადაამოწმოთ ინტერნეტი.</h2>";
    }
}

function startGame() {
    const nameInput = document.getElementById('player-name').value;
    if (nameInput.trim() === "") {
        document.getElementById('name-error').style.display = 'block';
        return;
    }
    document.getElementById('name-error').style.display = 'none';
    playerName = nameInput.trim(); 
    
    const bgMusic = document.getElementById('bg-music');
    bgMusic.volume = 0.4; 
    bgMusic.play().catch(e => console.log("აუდიო დაიბლოკა:", e));

    showScreen('intro-screen');
    document.getElementById('intro-text').innerHTML = `მოგესალმებით, ${playerName}! `;
    setTimeout(typeWriterEffect, 500); 
}

function typeWriterEffect() {
    if (typeIndex < introTextString.length) {
        document.getElementById('intro-text').innerHTML += introTextString.charAt(typeIndex);
        typeIndex++;
        setTimeout(typeWriterEffect, typingSpeed);
    } else {
        document.getElementById('start-journey-btn').style.display = 'inline-block';
    }
}

function startJourney() {
    document.body.style.backgroundColor = "#eaddc5"; 
    showMapScreen();
}

function showMapScreen() {
    if (currentLevelIndex >= levels.length) {
        finishGame();
        return;
    }
    const currentLoc = levels[currentLevelIndex];
    document.getElementById('level-title').innerText = `ეტაპი ${currentLevelIndex + 1}: ${currentLoc}`;
    
    if (mapCoordinates[currentLoc]) {
        characterImg.style.top = mapCoordinates[currentLoc].top;
        characterImg.style.left = mapCoordinates[currentLoc].left;
        characterImg.style.opacity = 1; 
    }

    showScreen('map-screen');
}

function startLevelQuestions() {
    currentQuestionIndex = 0; 
    showScreen('game-content');
    loadQuestion();
}

function loadQuestion() {
    const currentLoc = levels[currentLevelIndex];
    const levelQuestions = groupedData[currentLoc];

    // ვმალავთ წინა შეტყობინებებს
    document.getElementById('hint-display').style.display = 'none';
    document.getElementById('feedback-display').style.display = 'none';

    if (currentQuestionIndex >= levelQuestions.length) {
        currentLevelIndex++; 
        document.getElementById('question-text').innerHTML = "<h3 style='color: #4CAF50;'>გილოცავთ! ეს ეტაპი წარმატებით გაიარეთ. <br>გადავდივართ რუკის შემდეგ წერტილზე...</h3>";
        document.getElementById('options-container').innerHTML = '';
        
        setTimeout(() => {
            showMapScreen();
        }, 2000);
        return;
    }

    const currentData = levelQuestions[currentQuestionIndex];
    document.getElementById('location-name').innerText = currentData.location;
    document.getElementById('current-q-num').innerText = currentQuestionIndex + 1;
    document.getElementById('total-q-num').innerText = levelQuestions.length;
    
    document.getElementById('question-text').innerText = currentData.question;
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; 
    
    currentData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.onclick = (e) => checkAnswer(index, currentData.correctAnswer, e.target);
        optionsContainer.appendChild(button);
    });

    // კითხვის ჩატვირთვისას ვიწყებთ დროის ათვლას
    questionStartTime = Date.now();
}

function checkAnswer(selectedIndex, correctIndex, btnElement) {
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.style.pointerEvents = 'none'); // ვბლოკავთ ღილაკებს პასუხის გაცემის შემდეგ

    // დროის დათვლა და ჯარიმა
    let timeTaken = (Date.now() - questionStartTime) / 1000; // წამებში
    let timePenalty = Math.floor(timeTaken / 5); // ყოველ 5 წამში ვაკლებთ 1 ქულას
    let earnedPoints = 0;
    
    const currentData = groupedData[levels[currentLevelIndex]][currentQuestionIndex];
    const correctText = currentData.options[correctIndex];
    const feedbackDisplay = document.getElementById('feedback-display');

    if (selectedIndex === correctIndex) {
        btnElement.classList.add('correct'); 
        earnedPoints = Math.max(1, 10 - timePenalty); // მაქსიმუმ 10, მინიმუმ 1
        score += earnedPoints;
        
        feedbackDisplay.innerHTML = `✅ სწორია! <br>შეფასება: +${earnedPoints} ქულა <br><span style="font-size:14px; color:#5a3a18;">(ფიქრის დრო: ${Math.round(timeTaken)} წმ)</span>`;
        feedbackDisplay.style.color = '#4CAF50';
    } else {
        btnElement.classList.add('wrong'); 
        allBtns[correctIndex].classList.add('correct'); // ვაჩვენებთ სწორ პასუხს
        
        earnedPoints = Math.max(0, 5 - timePenalty); // მაქსიმუმ 5, მინიმუმ 0
        score += earnedPoints;
        
        feedbackDisplay.innerHTML = `❌ არასწორია! <br><span style="color: #333;">სწორი პასუხია: <b>${correctText}</b></span> <br>შეფასება: +${earnedPoints} ქულა <br><span style="font-size:14px; color:#5a3a18;">(ფიქრის დრო: ${Math.round(timeTaken)} წმ)</span>`;
        feedbackDisplay.style.color = '#f44336';
    }
    
    feedbackDisplay.style.display = 'block';
    document.getElementById('score').innerText = score;
    
    // 3 წამი ვაცდით, რომ მოთამაშემ შეფასება და სწორი პასუხი წაიკითხოს
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 3000);
}

function showHint() {
    const currentLoc = levels[currentLevelIndex];
    const hint = groupedData[currentLoc][currentQuestionIndex].hint;
    
    const hintDisplay = document.getElementById('hint-display');
    hintDisplay.innerText = "💡 მინიშნება: " + hint;
    hintDisplay.style.display = 'block';
}

async function finishGame() {
    showScreen('leaderboard-screen');
    document.getElementById('final-message').innerText = `გილოცავთ, ${playerName}!`;
    document.getElementById('final-score-display').innerText = `შენი საბოლოო ქულაა: ${score}`;
    
    try {
        await fetch(`${API_URL}?action=save&name=${encodeURIComponent(playerName)}&score=${score}`);
        document.getElementById('save-status').innerText = "✅ შედეგი წარმატებით შეინახა!";
        
        const response = await fetch(`${API_URL}?action=leaderboard&t=${Date.now()}`);
        const leaderboardData = await response.json();
        
        const listContainer = document.getElementById('leaderboard-list');
        listContainer.innerHTML = '';
        
        leaderboardData.slice(0, 10).forEach((player, index) => { 
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            item.innerHTML = `<span>${medal} ${player.name}</span> <span>${player.score} ქულა</span>`;
            listContainer.appendChild(item);
        });

    } catch (error) {
        console.error("შეცდომა:", error);
        document.getElementById('save-status').innerText = "❌ შეცდომა მონაცემების შენახვისას.";
    }
}

fetchQuestions();