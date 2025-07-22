const body = document.getElementById("body");
const tabIcon = document.getElementById("icon");


const timerEl = {
  title: document.getElementById("title"),
  clock: document.getElementById("time"),
  bar: document.getElementById("time-bar"),
  alart: document.getElementById("alart"),
  guide: document.querySelectorAll(".guide"),

  quickStartDiv: document.getElementById("shortcuts"),
  quickStartButtons: document.getElementsByClassName("quick-start"),
  pauseButton: document.getElementById("pause"),
  resumeButton: document.getElementById("resume"),
  resetButton: document.getElementById("reset"),
  startButton: document.getElementById("start"),

  autoStopCheckbox: document.getElementById("auto-stop"),
  volumeBar: document.getElementById("volume-bar"),
  volumeBarLabel: document.getElementById("volume-bar-label")
}


const timerInputEl = {
  field: document.getElementById("input-custom-length"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds")
}


let timerSt = {
  isActivated: false,
  isAutoStopEnabled: false,
  remainingSeconds: 0,
  maxSeconds: 0,
  startedTime: Date.now(),
  errorCount: 0
}


const alarm = new Audio("audio/alarm.m4a");
alarm.volume = 1;


setInterval(Timer, 1000);
setInterval(setVolume, 20);
setInterval(setAutoStopMode, 20);


window.onload = ()=> {
  hideGuide();
}


document.body.addEventListener(
  "keydown",
  () => {
    if ((timerSt.remainingSeconds < 1) && (timerSt.isActivated)) reset();
  },
  { once: false }
);


//タイマーの処理
function Timer() {
  if (!timerSt.isActivated) {
    if (timerSt.remainingSeconds > 0) timerSt.startedTime = timerSt.startedTime+1000;
    return
  };

  timerSt.remainingSeconds--;
  const realTimeSeconds = new Date().getSeconds();


  if (timerSt.remainingSeconds > 0) {
    const minutesStr = String(Math.floor(timerSt.remainingSeconds / 60)).padStart(2, '0');
    const secondsStr = String(timerSt.remainingSeconds % 60).padStart(2, '0');

    if ((timerSt.remainingSeconds % 5 == 0) && (timerSt.remainingSeconds > 0)) checkDifference();
    updateClockDisplay(minutesStr, secondsStr, realTimeSeconds);

    return; //残り時間が1秒以上ならここで終了

  } else {
    playAlarm(realTimeSeconds);
  }
}


function checkDifference() {
  const currentTime = Date.now();
  passedSeconds = (timerSt.startedTime - currentTime) / 1000;
  const difference = Math.floor(timerSt.remainingSeconds - passedSeconds) - timerSt.maxSeconds;

  if (Math.abs(difference) > 2) {
    timerSt.errorCount++;
    timerSt.remainingSeconds = timerSt.remainingSeconds - difference;
  }
}


function updateClockDisplay(minutesStr, secondsStr, realTimeSeconds) {
  const clockText = minutesStr + "<span class='colon' id='colon'>:</span>" + secondsStr;

  const titleText = (minutesStr + ":" + secondsStr + " Left");
  timerEl.clock.innerHTML = clockText;
  timerEl.title.innerHTML = (timerSt.errorCount > 1) ? ("⚠️"+titleText) : titleText;

  if (timerSt.errorCount > 1) {
    alart.innerHTML = "Your timer is not working properly. Please refresh the page.";
    tabIcon.href = "icon_red.ico";
  }

  timerEl.bar.style.width = ((timerSt.remainingSeconds / timerSt.maxSeconds) * 500) + "px";
  const colon = document.getElementById("colon");

  if (realTimeSeconds % 2 == 0) {
    colon.style.color = "#ffffffff";
  } else {
    colon.style.color = "#ffffff98";
  }
}


function playAlarm(realTimeSeconds) {
  timerEl.clock.innerHTML = "00:00";
  timerEl.bar.style.width = "0px";

  if (realTimeSeconds % 2 == 0) {
    body.style.backgroundColor = "white";
    timerEl.clock.style.filter = "invert(100%)";
    timerEl.bar.style.filter = "invert(100%)";
    timerEl.title.innerHTML = "■■■■■■■■■■■■■■■";
    tabIcon.href = "icon_magenta.ico";

    alarm.play();
    if (timerSt.isAutoStopEnabled) reset();

  } else {
    body.style.backgroundColor = "#505050";
    timerEl.clock.style.filter = "invert(0%)";
    timerEl.bar.style.filter = "invert(0%)";
    timerEl.title.innerHTML = "□□□□□□□□□□□□□□□";
    tabIcon.href = "icon.ico";
  }
}





/**
 * タイマーを開始する
 * @param {number} timeLeft 
 */
function start(timeLeft) {
  timerSt.remainingSeconds = timeLeft;
  timerSt.maxSeconds = timeLeft;
  timerSt.isActivated = true;
  timerSt.startedTime = Date.now();

  const minutesStr = String(Math.floor(timeLeft / 60));
  const secondsStr = String(timeLeft % 60).padStart(2, '0');

  timerEl.clock.innerHTML = minutesStr.padStart(2, '0') + ":" + secondsStr;
  timerEl.title.innerHTML = minutesStr.padStart(2, '0') + ":" + secondsStr + " Left";
  timerEl.bar.style.width = 500 + "px";
  timerEl.clock.style.display = "flex";
  timerInputEl.field.style.display = "none";

  for (let i = 0; i < timerEl.quickStartButtons.length; i++) {
    timerEl.quickStartButtons[i].style.color = "transparent";
    timerEl.quickStartButtons[i].style.filter = "blur(10px)";
  }
  setTimeout(() => {
    timerEl.quickStartDiv.style.display = "none";
  }, 300);

  timerEl.startButton.style.display = "none";
  timerEl.pauseButton.style.display = "inline-block";
}



//指定入力された時間でタイマーを開始する
function startFromInput() {
  const newTime = ((Number(timerInputEl.minutes.value) * 60) + Number(timerInputEl.seconds.value));
  if (newTime == 0) {
    return;
  }

  start(newTime)
}



//一時停止
function pause() {
  timerSt.isActivated = false;
  tabIcon.href = "icon_gray.ico";

  if (timerSt.remainingSeconds < 1) { //タイマーが鳴っていれば終了する
    reset();
    return;
  }

  timerEl.resumeButton.style.display = "inline-block";
  timerEl.resetButton.style.display = "inline-block";
  timerEl.pauseButton.style.display = "none";

  const minutesStr = String(Math.floor(timerSt.remainingSeconds / 60)).padStart(2, '0');
  const secondsStr = String(timerSt.remainingSeconds % 60).padStart(2, '0');
  timerEl.title.innerHTML = minutesStr + ":" + secondsStr + " ■PAUSED■";
}



//再開
function resume() {
  timerSt.isActivated = true;
  tabIcon.href = "icon.ico";

  timerEl.resumeButton.style.display = "none";
  timerEl.resetButton.style.display = "none";
  timerEl.pauseButton.style.display = "inline-block";
}



//タイマーを終了
function reset() {
  timerSt.isActivated = false;
  timerSt.remainingSeconds = 0;

  timerEl.title.innerHTML = "Timer";
  timerEl.clock.innerHTML = "00:00";
  timerEl.bar.style.width = "0px";

  body.style.backgroundColor = "#505050";
  timerEl.clock.style.filter = "invert(0%)";
  timerEl.bar.style.filter = "invert(0%)";
  timerEl.quickStartDiv.style.display = "flex";
  tabIcon.href = "icon.ico";

  for (let i = 0; i < timerEl.quickStartButtons.length; i++) {
    timerEl.quickStartButtons[i].style.color = "white";
    timerEl.quickStartButtons[i].style.filter = "blur(0px)";
  }
  timerEl.clock.style.display = "none";
  timerInputEl.field.style.display = "flex";

  setTimeout(() => {
    timerEl.pauseButton.removeAttribute("style");
    timerEl.resumeButton.removeAttribute("style");
    timerEl.resetButton.removeAttribute("style");

    timerEl.startButton.style.display = "inline-block";
  }, 1);
}


//自動でタイマーを止める　を切り替える
function setAutoStopMode() {
  if (timerEl.autoStopCheckbox.checked) {
    timerSt.isAutoStopEnabled = true;
  } else {
    timerSt.isAutoStopEnabled = false;
  }
}



//音量を変更する
function setVolume() {
  const volume = timerEl.volumeBar.value;
  timerEl.volumeBarLabel.innerHTML = ("Volume: " + volume + "%");
  alarm.volume = volume * 0.01;
}



//ガイドを非表示
function hideGuide() {
  console.log(timerEl.guide);
  setTimeout(() => {
    timerEl.guide.forEach(el => {
      el.style.color = "transparent";

      setTimeout(() => {
        el.style.display = "none";
      }, 1500);

    });
  }, 10000);
}
