const firstPlace = document.querySelector('.first');
const secondPlace = document.querySelector('.second');
const thirdPlace = document.querySelector('.third');
const playersList = document.querySelector('.players-List');

const p1 = document.createElement('p');
const p2 = document.createElement('p');
const p3 = document.createElement('p');

firstPlace.append(p1);
secondPlace.append(p2);
thirdPlace.append(p3);

let newObject;
let tempArr;


export function saveScore () {
    const pointsArray = [];
    const player = {
        name: localStorage.name,
        points: localStorage.points 
    }

    const oldPlayers = JSON.parse(localStorage.getItem('all'));

    if (oldPlayers !== null) {
        oldPlayers.forEach(element => {
    
            pointsArray.push(element);

        })
    }
    
    pointsArray.push(player);

    localStorage.setItem('all', JSON.stringify(pointsArray));

    newObject = JSON.parse(localStorage.getItem('all'));
    console.log(newObject);

    newObject.sort((a,b) => b.points - a.points );
    newObject.splice(7);
    console.log(newObject)
}

export function displayLeaderboard () {
    const arrayLength = newObject.length;

    
    switch (arrayLength) {
        case 7:
            displayYes(7)
            break;
        case 6:
            displayYes(6)
            break;
        case 5:
            displayYes(5)
            break;
        case 4:
            displayYes(4)
            break;
        case 3:
            displayYes(3)
            break;
        case 2:
            displayYes(2)
            break;
        case 1:
            displayYes(1)
            break;
    }

    function displayYes (value) {
            console.log(value);
            playersList.innerHTML = "";
            p1.textContent = `${newObject[0].name} : ${newObject[0].points}`

            if (value >= 2) {
                p2.textContent = `${newObject[1].name} : ${newObject[1].points}`

            }
            if (value >= 3) {
                p3.textContent = `${newObject[2].name} : ${newObject[2].points}`
            }
            if (value >= 4) {
                tempArr = newObject.filter(player => parseInt(player.points) < parseInt(newObject[2].points));
                playersList.innerHTML = tempArr.map(player => `<p class="top-players">${player.name} : ${player.points} </p>`).join("");
                if (value < 7) { 
                    for (let i = 7 - value; i > 0; i--) {
                        const emptyP = document.createElement("p");
                        emptyP.classList = "top-players";
                        playersList.appendChild(emptyP);
                    }
                }
            } else if (value < 4) {
                    for (let i = 0; i < 4; i++) {
                        const emptyP = document.createElement("p");
                        emptyP.classList = "top-players";
                        playersList.appendChild(emptyP);
                    }
            };
    }
}
