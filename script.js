// აქ ჩასვი Apps Script-ის დროს დაკოპირებული URL
const API_URL = "https://script.google.com/macros/s/AKfycbx2WV7xl5errtux2ANq0ElcxaNwnBEQ6JnepoQ8_XZ6AB1EoA3Xb1tCN3uZI-G10JQ0dA/exec"; 

let groupedData = {}; 
let levels = []; 
let currentLevelIndex = 0;
let currentQuestionIndex = 0;
let score = 0;

// საბეჭდი მანქანის ეფექტის ცვლადები
const introTextString = "მოგესალმებით! ეს არ არის უბრალო თამაში, ეს არის თავგადასავალი... შენი მიზანია შემოიარო ჩვენი მუნიციპალიტეტი, ამოხსნა საიდუმლოებები და მოიპოვო 'თერჯოლის მცოდნის' ტიტული. მზად ხარ დაიწყო მოგზაურობა?";
let typeIndex = 0;
const typingSpeed = 40; // ბეჭდვის სისწრაფე

const screens = document.querySelectorAll('.screen');
const locationName = document.getElementById('location-name');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const scoreDisplay = document.getElementById('score');
const levelTitle = document.getElementById('level-title');

// ეკრანების ცვლის ფუნქცია
function showScreen(screenId) {
    screens.forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'flex'; // flex რომ ცენტრში გაჩერდეს
    if(screenId !== 'intro-screen' && screenId !== 'loading') {
        document.getElementById(screenId).style.display = 'block';
    }
}

// მონაცემების წამოღება Google Sheets-დან
async function fetchQuestions() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        // ვაჯგუფებთ ლოკაციების მიხედვით
        rawData.forEach(item => {
            const levelKey = item.location;
            if (!groupedData[levelKey]) {
                groupedData[levelKey] = [];
                levels.push(levelKey);
            }
            groupedData[levelKey].push(item);
        });

        // მონაცემები ჩაიტვირთა - ვაჩვენებთ ინტროს
        showScreen('intro-screen');
        typeWriterEffect(); 

    } catch (error) {
        console.error("შეცდომა:", error);
        document.getElementById('loading').innerHTML = "<h2>შეცდომა ჩატვირთვისას. შეამოწმე API ბმული.</h2>";
    }
}

// ტექსტის ბეჭდვის ანიმაცია
function typeWriterEffect() {
    if (typeIndex < introTextString.length) {
        document.getElementById('intro-text').innerHTML += introTextString.charAt(typeIndex);
        typeIndex++;
        setTimeout(typeWriterEffect, typingSpeed);
    } else {
        document.getElementById('start-journey-btn').style.display = 'inline-block';
    }
}

// ინტროდან პირველ ეტაპზე (რუკაზე) გადასვლა
function startJourney() {
    document.body.style.backgroundColor = "#eaddc5"; // ვცვლით ფონს თამაშის ფერზე
    showMapScreen();
}

// რუკის ჩვენება კონკრეტული ეტაპისთვის
function showMapScreen() {
    if (currentLevelIndex >= levels.length) {
        finishGame();
        return;
    }
    const currentLoc = levels[currentLevelIndex];
    levelTitle.innerText = `ეტაპი ${currentLevelIndex + 1}: ${currentLoc}`;
    showScreen('map-screen');
}

// ეტაპის დაწყება და კითხვებზე გადასვლა
function startLevelQuestions() {
    currentQuestionIndex = 0; 
    showScreen('game-content');
    loadQuestion();
}

// კითხვის ჩატვირთვა
function loadQuestion() {
    const currentLoc = levels[currentLevelIndex];
    const levelQuestions = groupedData[currentLoc];

    // თუ ამ ეტაპის კითხვები დასრულდა
    if (currentQuestionIndex >= levelQuestions.length) {
        currentLevelIndex++; 
        alert("გილოცავ! შენ წარმატებით გაიარე ეს ეტაპი. გადავდივართ შემდეგ წერტილზე!");
        showMapScreen();
        return;
    }

    const currentData = levelQuestions[currentQuestionIndex];
    locationName.innerText = currentData.location;
    document.getElementById('current-q-num').innerText = currentQuestionIndex + 1;
    document.getElementById('total-q-num').innerText = levelQuestions.length;
    
    questionText.innerText = currentData.question;
    optionsContainer.innerHTML = ''; 
    
    currentData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.onclick = () => checkAnswer(index, currentData.correctAnswer);
        optionsContainer.appendChild(button);
    });
}

// პასუხის შემოწმება
function checkAnswer(selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
        score += 10;
        currentQuestionIndex++;
        loadQuestion();
    } else {
        alert("არასწორია. სცადე თავიდან!");
    }
    scoreDisplay.innerText = score;
}

// მინიშნება
function showHint() {
    const currentLoc = levels[currentLevelIndex];
    const hint = groupedData[currentLoc][currentQuestionIndex].hint;
    alert("მინიშნება: " + hint);
}

// თამაშის დასასრული
function finishGame() {
    document.getElementById('game-container').innerHTML = `
        <div class="screen" style="background: #fffdf9; padding: 40px; border-radius: 12px; text-align: center; border: 2px solid #8b5a2b;">
            <h2>გილოცავთ!</h2>
            <p>თქვენ დაასრულეთ რუკის ყველა ეტაპი და მოიპოვეთ 'თერჯოლის მცოდნის' ტიტული!</p>
            <h3>საბოლოო ქულა: ${score}</h3>
            <button onclick="location.reload()" style="background: #8b5a2b; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">თავიდან დაწყება</button>
        </div>
    `;
}

// ეგრევე ვიწყებთ მონაცემების წამოღებას
fetchQuestions();