// შენი Google Sheets API ბმული
const API_URL = "https://script.google.com/macros/s/AKfycbyAWsmn5_b-p32vObFafi7cKZSBKKXllCwwedeJIluUhgWmZjdrONb1BIeH9Nb6EYrdPA/exec"; 

let groupedData = {}; 
let levels = []; 
let currentLevelIndex = 0;
let currentQuestionIndex = 0;
let score = 0;
let playerName = ""; // მოთამაშის სახელის შესანახად

// ლოკაციების კოორდინატები რუკაზე (პროცენტებში)
// *შენიშვნა: ეს პროცენტები შეგიძლია შეცვალო შენი map.png-ის მიხედვით*
const mapCoordinates = {
    "თერჯოლის მერია": { top: "60%", left: "65%" },
    "სოფელი ღვანკითი": { top: "35%", left: "45%" },
    "სოფელი გოგნი": { top: "45%", left: "25%" },
    "სოფელი ჩხარი": { top: "65%", left: "35%" }
};

// ინტროს ანიმაციის პარამეტრები
const introTextString = "ეს არ არის უბრალო თამაში, ეს არის თავგადასავალი... შენი მიზანია შემოიარო ჩვენი მუნიციპალიტეტი, ამოხსნა საიდუმლოებები და მოიპოვო 'თერჯოლის მცოდნის' ტიტული. მზად ხარ დაიწყო მოგზაურობა?";
let typeIndex = 0;
const typingSpeed = 80; // გაიზარდა დრო, რომ უფრო ნელა დაიბეჭდოს

const screens = document.querySelectorAll('.screen');
const characterImg = document.getElementById('character-img');

function showScreen(screenId) {
    screens.forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex'; 
    if(screenId !== 'intro-screen' && screenId !== 'loading' && screenId !== 'welcome-screen') {
        document.getElementById(screenId).style.display = 'block';
    }
}

// 1. მონაცემების წამოღება
async function fetchQuestions() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        rawData.forEach(item => {
            const levelKey = item.location;
            if (!groupedData[levelKey]) {
                groupedData[levelKey] = [];
                levels.push(levelKey);
            }
            groupedData[levelKey].push(item);
        });

        // ჩატვირთვის მერე ვაჩვენებთ სახელის შესაყვან ეკრანს
        showScreen('welcome-screen'); 

    } catch (error) {
        console.error("შეცდომა:", error);
        document.getElementById('loading').innerHTML = "<h2>შეცდომა ჩატვირთვისას. შეამოწმე API ბმული.</h2>";
    }
}

// 2. თამაშის დაწყება და მუსიკის ჩართვა (ღილაკზე დაჭერით)
function startGame() {
    const nameInput = document.getElementById('player-name').value;
    if (nameInput.trim() === "") {
        alert("გთხოვთ, შეიყვანოთ სახელი და გვარი!");
        return;
    }
    
    playerName = nameInput; // ვიმახსოვრებთ სახელს
    
    // მუსიკის ჩართვა
    const bgMusic = document.getElementById('bg-music');
    bgMusic.volume = 0.4; 
    bgMusic.play();

    // ინტროს დაწყება
    showScreen('intro-screen');
    document.getElementById('intro-text').innerHTML = `მოგესალმებით, ${playerName}! `;
    setTimeout(typeWriterEffect, 500); 
}

// 3. ტექსტის ბეჭდვა
function typeWriterEffect() {
    if (typeIndex < introTextString.length) {
        document.getElementById('intro-text').innerHTML += introTextString.charAt(typeIndex);
        typeIndex++;
        setTimeout(typeWriterEffect, typingSpeed);
    } else {
        document.getElementById('start-journey-btn').style.display = 'inline-block';
    }
}

// 4. რუკაზე გადასვლა ინტროდან
function startJourney() {
    document.body.style.backgroundColor = "#eaddc5"; 
    showMapScreen();
}

// 5. რუკის და პერსონაჟის ლოკაციის განახლება
function showMapScreen() {
    if (currentLevelIndex >= levels.length) {
        finishGame();
        return;
    }
    const currentLoc = levels[currentLevelIndex];
    document.getElementById('level-title').innerText = `ეტაპი ${currentLevelIndex + 1}: ${currentLoc}`;
    
    // პერსონაჟის გადაადგილება კოორდინატების მიხედვით
    if (mapCoordinates[currentLoc]) {
        characterImg.style.top = mapCoordinates[currentLoc].top;
        characterImg.style.left = mapCoordinates[currentLoc].left;
        characterImg.style.opacity = 1; // ვაჩენთ პერსონაჟს
    }

    showScreen('map-screen');
}

// 6. კითხვებზე გადასვლა
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

// 7. თამაშის დასრულება (სახელით და ქულით)
function finishGame() {
    document.getElementById('game-container').innerHTML = `
        <div class="screen" style="background: #fffdf9; padding: 40px; border-radius: 12px; text-align: center; border: 2px solid #8b5a2b; box-shadow: 0 8px 25px rgba(0,0,0,0.5);">
            <h2>გილოცავთ, ${playerName}!</h2>
            <p>თქვენ დაასრულეთ რუკის ყველა ეტაპი!</p>
            <h3>თქვენი საბოლოო ქულაა: ${score}</h3>
            <p style="color: green; font-weight: bold; margin-top: 15px;">მონაცემები შენახულია ერთიან ბაზაში.</p>
            <button onclick="location.reload()" style="background: #8b5a2b; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; font-size: 16px;">თავიდან დაწყება</button>
        </div>
    `;
}

// აპლიკაციის ჩართვა
fetchQuestions();