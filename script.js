// აუცილებლად ჩასვი ახალი Apps Script ბმული!!!
const API_URL = "https://script.google.com/macros/s/AKfycbxEAFtjYsVy7Z9OjNzkhyZLgfddKDy9CcZeAlr44kdfulAdz9LW9cjK5irbbWKUZctc5A/exec"; 

let groupedData = {}; 
let levels = []; 
let currentLevelIndex = 0;
let currentQuestionIndex = 0;
let score = 0;
let playerName = ""; 

// პერსონაჟის ლოკაციები
const mapCoordinates = {
    "თერჯოლის მერია": { top: "60%", left: "65%" },
    "სოფელი ღვანკითი": { top: "35%", left: "45%" },
    "სოფელი გოგნი": { top: "45%", left: "25%" },
    "სოფელი ჩხარი": { top: "65%", left: "35%" }
};

const introTextString = "ეს არ არის უბრალო თამაში, ეს არის თავგადასავალი... შენი მიზანია შემოიარო ჩვენი მუნიციპალიტეტი, ამოხსნა საიდუმლოებები და მოიპოვო 'თერჯოლის მცოდნის' ტიტული. მზად ხარ დაიწყო მოგზაურობა?";
let typeIndex = 0;
const typingSpeed = 80; 

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
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        rawData.forEach(item => {
            const levelKey = item.location.trim(); // ვასუფთავებთ ზედმეტი სფეისებისგან
            if (!groupedData[levelKey]) {
                groupedData[levelKey] = [];
                levels.push(levelKey);
            }
            groupedData[levelKey].push(item);
        });
        showScreen('welcome-screen'); 
    } catch (error) {
        console.error("შეცდომა:", error);
        document.getElementById('loading').innerHTML = "<h2>შეცდომა ჩატვირთვისას. შეამოწმე API ბმული.</h2>";
    }
}

function startGame() {
    const nameInput = document.getElementById('player-name').value;
    if (nameInput.trim() === "") {
        alert("გთხოვთ, შეიყვანოთ სახელი და გვარი!");
        return;
    }
    playerName = nameInput; 
    
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
    
    // ვეძებთ კოორდინატებს
    if (mapCoordinates[currentLoc]) {
        characterImg.style.top = mapCoordinates[currentLoc].top;
        characterImg.style.left = mapCoordinates[currentLoc].left;
        characterImg.style.opacity = 1; 
    } else {
        console.log(`გაფრთხილება: კოორდინატები '${currentLoc}'-თვის ვერ მოიძებნა.`);
        characterImg.style.top = "50%";
        characterImg.style.left = "50%";
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

    if (currentQuestionIndex >= levelQuestions.length) {
        currentLevelIndex++; 
        alert("გილოცავ! შენ წარმატებით გაიარე ეს ეტაპი. გადავდივართ შემდეგ წერტილზე!");
        showMapScreen();
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
        button.onclick = () => checkAnswer(index, currentData.correctAnswer);
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
        score += 10;
        currentQuestionIndex++;
        document.getElementById('score').innerText = score;
        loadQuestion();
    } else {
        alert("არასწორია. სცადე თავიდან!");
    }
}

function showHint() {
    const currentLoc = levels[currentLevelIndex];
    const hint = groupedData[currentLoc][currentQuestionIndex].hint;
    alert("მინიშნება: " + hint);
}

async function finishGame() {
    showScreen('leaderboard-screen');
    document.getElementById('final-message').innerText = `გილოცავთ, ${playerName}!`;
    document.getElementById('final-score-display').innerText = `შენი საბოლოო ქულაა: ${score}`;
    
    try {
        // ვაგზავნით მონაცემებს
        await fetch(`${API_URL}?action=save&name=${encodeURIComponent(playerName)}&score=${score}`);
        document.getElementById('save-status').innerText = "✅ შედეგი წარმატებით შეინახა!";
        
        // ვიძახებთ ლიდერბორდს
        const response = await fetch(`${API_URL}?action=leaderboard`);
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

// თამაშის ინიციალიზაცია
fetchQuestions();