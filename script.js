// აუცილებლად ჩასვი შენი API ბმული!!!
const API_URL = "https://script.google.com/macros/s/AKfycbySJut6mp98TXzG8yPyTyZNAvyqw2CooFsUZxjtCmCNP1u82QbElX2imbN5j6z9raGReg/exec"; 

let groupedData = {}; 
let levels = []; 
let currentLevelIndex = 0;
let currentQuestionIndex = 0;
let score = 0;
let playerName = ""; 

// პერსონაჟის ლოკაციები რუკაზე
const mapCoordinates = {
    "თერჯოლის მერია": { top: "58%", left: "69%" },
    "სოფელი ღვანკითი": { top: "35%", left: "55%" },
    "სოფელი გოგნი": { top: "44%", left: "28%" },
    "სოფელი ჩხარი": { top: "61%", left: "37%" }
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
        // cache-busting პარამეტრით ყოველთვის ახალ მონაცემებს წამოიღებს
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
        alert("გთხოვთ, შეიყვანოთ სახელი და გვარი!");
        return;
    }
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

    if (currentQuestionIndex >= levelQuestions.length) {
        currentLevelIndex++; 
        alert("გილოცავ! შენ წარმატებით გაიარე ეს ეტაპი.");
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
        // გადავცემთ ღილაკის ელემენტს ფუნქციას, რომ ფერი შევუცვალოთ
        button.onclick = (e) => checkAnswer(index, currentData.correctAnswer, e.target);
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedIndex, correctIndex, btnElement) {
    // ვითიშავთ სხვა ღილაკებზე დაჭერას პასუხის არჩევის შემდეგ
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.style.pointerEvents = 'none');

    if (selectedIndex === correctIndex) {
        btnElement.classList.add('correct'); // მწვანე ფერი
        score += 10;
        document.getElementById('score').innerText = score;
        
        // 1 წამში გადადის შემდეგზე
        setTimeout(() => {
            currentQuestionIndex++;
            loadQuestion();
        }, 1000);
        
    } else {
        btnElement.classList.add('wrong'); // წითელი ფერი
        // ვაჩვენებთ რომელი იყო სწორი
        allBtns[correctIndex].classList.add('correct');
        
        // 1.5 წამში აძლევს თავიდან ცდის საშუალებას (ქულა არ ემატება)
        setTimeout(() => {
            allBtns.forEach(b => b.style.pointerEvents = 'auto');
            btnElement.classList.remove('wrong');
            allBtns[correctIndex].classList.remove('correct');
        }, 1500);
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
        await fetch(`${API_URL}?action=save&name=${encodeURIComponent(playerName)}&score=${score}`);
        document.getElementById('save-status').innerText = "✅ შედეგი წარმატებით შეინახა!";
        
        // ვიყენებთ time პარამეტრს ქეშის ასარიდებლად
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