const inputName = document.querySelector(".start_input");
const startBtn = document.querySelector(".start_button");

const userForm = document.querySelector(".name_form");
const category = document.querySelector(".allcards");
const firstSection = document.querySelector(".start_section");

const geographyCategory = document.querySelector(".geography");
const moviesCategory = document.querySelector(".movies");
const musicCategory = document.querySelector(".music");
const randomCategory = document.querySelector(".random");

const easy = document.querySelector(".easy");
const medium = document.querySelector(".medium");
const hard = document.querySelector(".hard");

const difficultyLevel = document.querySelector(".difficultlevel");

const questionDiv = document.querySelector(".questiondiv");
const questionBtn = document.querySelector(".question_button");
const questionCounter = document.querySelector(".question_counter");
const question = document.querySelector(".question_h2");
const answers = document.querySelector(".question");
const timer = document.querySelector(".timer");
const timeOut = document.querySelector(".timeOut");

const leaderboard = document.querySelector('.leaderboard-container');
const leaderNext = document.querySelector('.leaderNext');

const desktopVersion = document.querySelector(".desktop_version");

import { shuffle } from "./shuffle.js";
import { createBar} from "./createBar.js";
import {start, end} from "./timer.js";
import { saveScore, displayLeaderboard } from "./leaderboard.js";

let categoryChoice = "";
let difficulty = "";
let roundTracker = 0;
let quizData;
let pointsTracker = 0;
let difficultyPoints;
let myTimer;
let activeTracker = false;

window.addEventListener('resize', () => {

    if (activeTracker == false) {
        if (window.innerWidth < 1024) {
            desktopVersion.style.display = 'none';
        }
        if (window.innerWidth > 1024) {
            desktopVersion.style.display = 'block';
        }
    }
})

inputName.addEventListener("keyup", () => {
    if (inputName.value.length > 0) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
})

leaderNext.addEventListener('click', () => {
    leaderboard.style.display = 'none';
    firstSection.style.display = 'block';
    startBtn.disabled = true;
    if (window.innerWidth > 1024) {
    desktopVersion.style.display = 'block';
    }
    inputName.value = '';
    activeTracker = false;
})

userForm.addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem("name", inputName.value);
    firstSection.style.display = "none";
    category.style.display = "flex";
    
});

geographyCategory.addEventListener("click", () => {
    difficultyLevel.style.display = "flex";
    category.style.display = "none";
    categoryChoice = "22";
});

moviesCategory.addEventListener("click", () => {
    difficultyLevel.style.display = "flex";
    category.style.display = "none";
    categoryChoice = "11";

});
musicCategory.addEventListener("click", () => {
    difficultyLevel.style.display = "flex";
    category.style.display = "none";
    categoryChoice = "12";

});
randomCategory.addEventListener("click", () => {
    difficultyLevel.style.display = "flex";
    category.style.display = "none";
    categoryChoice = "0";
});

easy.addEventListener("click", () => {
    difficultyPoints = 1000;
    difficulty = "easy";

    start();
    runner(categoryChoice, difficulty);

});
medium.addEventListener("click", () => {
    difficultyPoints = 1500;
    difficulty = "medium";

    start();
    runner(categoryChoice, difficulty);

});
hard.addEventListener("click", () => {
    difficultyPoints = 2000;
    difficulty = "hard";

    start();
    runner(categoryChoice, difficulty);

});

questionBtn.addEventListener("click", () => {

    if (roundTracker < 9) {
    roundTracker++;
    createBar();
    quizDisplay(quizData.results);
    }
    else {
        
        const endTime = end();
        pointsTracker = Math.floor(pointsTracker / endTime);
        localStorage.setItem('points', pointsTracker);

        saveScore();
        displayLeaderboard();

        questionDiv.style.display = 'none';
        leaderboard.style.display = 'block';
    }
    
});

async function quizGetter(categoryChoice, difficulty) {
    const quizAPI = `https://opentdb.com/api.php?amount=10&category=${categoryChoice}&type=multiple&difficulty=${difficulty}`;
    try {
        const quiz = await fetch(quizAPI);

        if (!quiz.ok) {
            throw new Error("HTTP ERROR status: " + quiz.status);
        }
        const data = await quiz.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

async function runner(categoryChoice, difficulty) {

    roundTracker = 0;
    desktopVersion.style.display = "none";
    difficultyLevel.style.display = "none";
    questionDiv.style.display = "flex";
    activeTracker = true;
    quizData = await quizGetter(categoryChoice, difficulty);
    createBar();
    quizDisplay(quizData.results);

}

function quizDisplay(data) {
    questionBtn.disabled = true;
    const processedData = data;

    question.innerHTML = processedData[roundTracker].question;
    let correctAnswer = processedData[roundTracker].correct_answer;

    correctAnswer = answerDecoder(correctAnswer);

    questionCounter.textContent = `Question ${roundTracker + 1}/10`;

    const randomizer = [
        processedData[roundTracker].correct_answer,
        processedData[roundTracker].incorrect_answers[0],
        processedData[roundTracker].incorrect_answers[1],
        processedData[roundTracker].incorrect_answers[2],
    ];

    shuffle(randomizer);

    answers.innerHTML = `
                        <li class="answerBox">${randomizer[0]}</li>
                        <li class="answerBox">${randomizer[1]}</li>
                        <li class="answerBox">${randomizer[2]}</li>
                        <li class="answerBox">${randomizer[3]}</li>
                        `;

    myTimer = setTimeout(() => {
        slowPoke('not', 'not', correctAnswer, randomizer)
    }, 10000)
    const liList = document.querySelectorAll(".answerBox");

    liList.forEach((element) => {
        element.addEventListener("click", (event) => {

            produceResult(element, event, correctAnswer, randomizer)

        });
    });
}

function colorizer(newLiList, correctAnswer) {
    for (let i = 0; i < newLiList.length; i++) {
        
        newLiList[i].classList.add("newOpacity");
        if (newLiList[i].textContent === correctAnswer) {
            newLiList[i].style.background = "green";
        } else {
            newLiList[i].style.background = "red";
        }
    }
}

function produceResult (element, event, correctAnswer, randomizer) {
    timeOut.innerHTML = `<div class="hiddenTimer"></div>`;
    questionBtn.disabled = false;

    clearTimeout(myTimer);
    answers.innerHTML = `
                        <li class="answerBox box1">${randomizer[0]}</li>
                        <li class="answerBox box1">${randomizer[1]}</li>
                        <li class="answerBox box1">${randomizer[2]}</li>
                        <li class="answerBox box1">${randomizer[3]}</li>
    `;
    const newLiList = document.querySelectorAll(".answerBox");

    for (let i = 0; i < newLiList.length; i++) {
        if (newLiList[i].textContent === element.textContent) {
            newLiList[i].classList.add("highOpacity");
        }
    }

colorizer(newLiList, correctAnswer);
    if (event !== "not") {
    if (event.target.textContent === correctAnswer) {
        console.log(`${correctAnswer} is correct!`);
        pointsTracker += difficultyPoints;
    } else {
        console.log(`Filip > Emil!`);
    }
}}

function slowPoke (element, event, answer, randomizer) {

    timer.classList.remove("timer");

    produceResult(element, event, answer, randomizer)
    timeOut.innerHTML = `<div class="hiddenTimer"><h2>Too slow!</h2></div>`
}

function answerDecoder (answer) {

    const divDecoder = document.createElement('div');
    divDecoder.innerHTML = answer;

    const newAnswer = divDecoder.innerHTML;
    
    return newAnswer;
} 