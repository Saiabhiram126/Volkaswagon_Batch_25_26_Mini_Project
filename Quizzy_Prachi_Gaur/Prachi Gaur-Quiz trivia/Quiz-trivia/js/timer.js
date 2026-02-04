export var startTime, endTime;
export function start() {
    startTime = performance.now();  
};

export function end() {
endTime = performance.now();
    var timeDiff = endTime - startTime; //in ms 
      // strip the ms 
    timeDiff /= 1000; 

      // get seconds 
    var seconds = Math.floor(timeDiff);
    return seconds;
}