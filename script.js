// აქ ჩასვი Apps Script-ის დროს დაკოპირებული URL
const API_URL = "https://script.google.com/macros/s/AKfycbx2WV7xl5errtux2ANq0ElcxaNwnBEQ6JnepoQ8_XZ6AB1EoA3Xb1tCN3uZI-G10JQ0dA/exec"; 

let groupedData = {}; // კითხვები დაჯგუფებული ლოკაციების მიხედვით
let levels = []; // ლოკაციების თანმიმდევრობა
let currentLevelIndex = 0;
let currentQuestionIndex = 0;
let score = 0;

const screens = document.querySelectorAll('.screen');
const locationName = document.getElementById('location-name');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const scoreDisplay = document.getElementById('score');
const levelTitle = document.getElementById('level-title');

// ეკრანების გადართვა
function showScreen(screenId) {
    screens.forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

async function fetchQuestions() {
    try {
        const response = await fetch(API_URL);
        const rawData = await response.json();
        
        // მონაცემების დაჯგუფება Level/ლოკაციის მიხედვით
        rawData.forEach(item => {
            const levelKey = item.location; // ვიყენებთ ლოკაციის სახელს ეტაპის გასაღებად
            if (!groupedData[levelKey]) {
                groupedData[levelKey] = [];
                levels.push(levelKey); // ვინახავთ ლოკაციების თანმიმდევრობას
            }
            groupedData[levelKey].push(item);
        });

        showMapScreen(); // მონაცემების ჩატვირთვის შემდეგ ვაჩვენებთ რუკას
    } catch (error) {
        console.error("შეცდომა:", error);
        document.getElementById('loading').innerText = "შეცდომა ჩატვირთვისას.";
    }
}

function showMapScreen() {
    if (currentLevelIndex >= levels.length) {
        finishGame();
        return;
    }
    const currentLoc = levels[currentLevelIndex];
    levelTitle.innerText = `ეტაპი ${currentLevelIndex + 1}: ${currentLoc}`;
    showScreen('map-screen');
}

function startLevelQuestions() {
    currentQuestionIndex = 0; // ახალ ეტაპზე კითხვების ათვლა იწყება თავიდან
    showScreen('game-content');
    loadQuestion();
}

function loadQuestion() {
    const currentLoc = levels[currentLevelIndex];
    const levelQuestions = groupedData[currentLoc];

    // შემოწმება: ამოიწურა თუ არა ამ ლოკაციის კითხვები
    if (currentQuestionIndex >= levelQuestions.length) {
        currentLevelIndex++; // გადავდივართ შემდეგ ლოკაციაზე
        alert("გილოცავ! შენ წარმატებით გაიარე ეს ეტაპი. გადავდივართ რუკის შემდეგ წერტილზე!");
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

function showHint() {
    const currentLoc = levels[currentLevelIndex];
    const hint = groupedData[currentLoc][currentQuestionIndex].hint;
    alert("მინიშნება: " + hint);
}

function finishGame() {
    document.getElementById('game-container').innerHTML = `
        <h2>გილოცავთ!</h2>
        <p>თქვენ დაასრულეთ რუკის ყველა ეტაპი!</p>
        <p>საბოლოო ქულა: ${score}</p>
    `;
}

// ინიციალიზაცია
fetchQuestions();