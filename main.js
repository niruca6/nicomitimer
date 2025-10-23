const body = document.getElementById("body");
const tabIcon = document.getElementById("icon");
const alarm = new Audio("assets/audio/alarm.m4a");
alarm.volume = 1;
const worker = new Worker("./webWorker.js");

let windouWidth = window.innerWidth;
let windowHeight = window.innerHeight;

const timerEl = {
  title: document.getElementById("title"),
  clock: document.getElementById("time"),
  bar: document.getElementById("time-bar"),
  guide: document.querySelectorAll(".guide"),

  quickStartDiv: document.getElementById("shortcuts"),
  quickStartButtons: document.getElementsByClassName("quick-start"),
  pauseButton: document.getElementById("pause"),
  resumeButton: document.getElementById("resume"),
  resetButton: document.getElementById("reset"),
  startButton: document.getElementById("start"),

  autoStopCheckbox: document.getElementById("auto-stop"),
  muteCheckbox: document.getElementById("mute"),
  muteIcon: document.getElementById("mute-icon"),
  volumeBar: document.getElementById("volume-bar"),
  volumeBarLabel: document.getElementById("volume-bar-label")
}


const timerInputEl = {
  field: document.getElementById("input-field"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds")
}


let tst = {
  isActivated: false,
  isAutoStopEnabled: false,
  isFocused: true,
  isAllowShortcutkey: true,

  startedTime: undefined, //ms
  endTime: undefined, //ms
  pausedTime: undefined, //ms
  ringCount: 0,

  yellowTitleTime: 0, //s
  beforeRemainingSeconds: 0
}





document.body.addEventListener(
  "keydown",
  (ev) => {
    if ((getRemainingSeconds() < 1) && (tst.isActivated)) {
      reset();
      return;
    };
    if ((tst.isAllowShortcutkey) && (tst.endTime == undefined) && (ev.code == "Enter")) startWithInput();

    //一時停止/再開[Space]
    if (ev.code == "Space") {
      console.log("Space");
      if ((tst.isActivated) && (!tst.isAllowShortcutkey)) { pause(); }
      else if ((!tst.isActivated) && (tst.endTime)) { resume(); }
    };

    //入力消去[Esc]
    if ((!tst.isActivated) && (tst.endTime == undefined) && (ev.code == "Escape")) {
      timerInputEl.minutes.value = null;
      timerInputEl.seconds.value = null;
    };

    //ミュート[M]
    if (ev.code == "KeyM") {
      if (timerEl.muteCheckbox.checked) {
        timerEl.muteCheckbox.checked = false;
      } else {
        timerEl.muteCheckbox.checked = true;
      }
      asyncMute()
    }
  },
  { once: false }
);



window.onload = () => { hideGuide(); }

setInterval(setVolume, 30);
setInterval(() => { windouWidth = window.innerWidth; windowHeight = window.innerHeight; }, 1000);



worker.onmessage = (ev) => {
  const remainingSeconds = ev.data;

  if (remainingSeconds > 0) {
    updateClockDisplay(remainingSeconds);
    tst.beforeRemainingSeconds = remainingSeconds;

    if (remainingSeconds == 1) {
      asyncAutoStopMode();
      asyncMute();
    }

    return; //残り時間が1秒以上ならここで終了

  } else {
    playAlarm();
  }
}




function updateClockDisplay(remainingSeconds) {
  const minutesStr = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const secondsStr = String(remainingSeconds % 60).padStart(2, '0');
  const realTimeSeconds = new Date().getSeconds();
  const diff = Math.abs(tst.beforeRemainingSeconds - getRemainingSeconds());

  const clockText = minutesStr + "<span class='colon' id='colon'>:</span>" + secondsStr;
  const titleText = (minutesStr + ":" + secondsStr);

  timerEl.clock.innerHTML = clockText;

  if (diff > 3) {
    tst.yellowTitleTime = 8;
    console.log("[" + getRealTimeStr() + "] Restricted background activity: " + (diff - 1) + "s");
  }

  if ((tst.yellowTitleTime > 0) && (remainingSeconds > 0)) {
    timerEl.title.textContent = (titleText + " [Activity resumed]");

    if (tst.yellowTitleTime % 2 == 0) {
      tabIcon.href = "icons/icon_yellow.ico";

    } else {
      tabIcon.href = "icon.ico";
    }

    tst.yellowTitleTime--;
  } else {
    timerEl.title.textContent = titleText + " Left";
    tabIcon.href = "icon.ico";
  }

  timerEl.bar.style.width = (((Math.floor(getRemainingSeconds())) / tst.maxSeconds) * 500) + "px";
  if ((windouWidth < 769) || (windowHeight < 481)) timerEl.bar.style.width = (((Math.floor(getRemainingSeconds())) / tst.maxSeconds) * 300) + "px";

  const colon = document.getElementById("colon");

  if (realTimeSeconds % 2 == 0) {
    colon.style.color = "#ffffffff";
  } else {
    colon.style.color = "#ffffff98";
  }

}


function playAlarm() {
  tst.ringCount++;

  timerEl.clock.textContent = "00:00";
  timerEl.bar.style.width = "0px";

  if (tst.ringCount % 2 == 0) {
    body.style.backgroundColor = "white";
    timerEl.clock.style.filter = "invert(100%)";
    timerEl.pauseButton.style.filter = "invert(100%)";
    timerEl.title.textContent = "■■■■■■■■■■■■■■■";
    tabIcon.href = "icons/icon_magenta.ico";

    if (!timerEl.muteCheckbox.checked) alarm.play();
    if (tst.isAutoStopEnabled) reset();

  } else {
    body.style.backgroundColor = "#505050";
    timerEl.clock.style.filter = "invert(0%)";
    timerEl.pauseButton.style.filter = "invert(0%)";
    timerEl.title.textContent = getRemainingSeconds() < 0 ? "□□□□□□□□□□□□□□□" : "00:00 Left";
    tabIcon.href = "icon.ico";
  }
}













/**
 * タイマーを開始する
 * @param {number} timeLeft 
 */
function start(timeLeft) {
  tst.startedTime = Date.now();
  tst.endTime = Date.now() + (timeLeft * 1000) + 50; //動作が遅れることを想定して終了時刻を0.05秒遅く設定
  worker.postMessage([tst.endTime, true, false]);

  tst.maxSeconds = timeLeft;
  tst.beforeRemainingSeconds = timeLeft;
  tst.isActivated = true;
  tst.isAllowShortcutkey = false;

  const minutesStr = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secondsStr = String(timeLeft % 60).padStart(2, '0');

  timerEl.clock.textContent = minutesStr + ":" + secondsStr;
  timerEl.title.textContent = minutesStr + ":" + secondsStr + " Left";
  timerEl.bar.style.width = ((windouWidth < 769) || (windowHeight < 481)) ? (300 + "px") : (500 + "px");
  timerEl.clock.style.display = "flex";
  timerInputEl.field.style.display = "none";

  for (let i = 0; i < timerEl.quickStartButtons.length; i++) {
    timerEl.quickStartButtons[i].style.opacity = "0%";
    timerEl.quickStartButtons[i].style.filter = "blur(10px)";
  }
  setTimeout(() => {
    timerEl.quickStartDiv.style.display = "none";
  }, 300);

  timerEl.startButton.style.display = "none";
  timerEl.pauseButton.style.display = "inline-block";

  asyncAutoStopMode();
  asyncMute();

  console.log("[" + getRealTimeStr() + "] started\nlength: " + (getRemainingSeconds()));
}



//指定入力された時間でタイマーを開始する
function startWithInput() {
  const newTime = (parseFloat(timerInputEl.minutes.value * 60) + (parseFloat(timerInputEl.seconds.value) ? parseFloat(timerInputEl.seconds.value) : 0));
  if (newTime == 0) {
    return;
  }

  start(newTime)
}



//一時停止
function pause() {
  tst.isActivated = false;
  worker.postMessage([tst.endTime, false]);

  if (Math.floor((tst.endTime - Date.now()) / 1000) < 1) { //タイマーが鳴っていれば終了する
    reset();
    return;
  }

  tst.pausedTime = Date.now();

  tabIcon.href = "icons/icon_gray.ico";

  timerEl.resumeButton.style.display = "inline-block";
  timerEl.resetButton.style.display = "inline-block";
  timerEl.pauseButton.style.display = "none";

  const minutesStr = String(Math.floor(getRemainingSeconds() / 60)).padStart(2, '0');
  const secondsStr = String(getRemainingSeconds() % 60).padStart(2, '0');
  timerEl.title.textContent = minutesStr + ":" + secondsStr + " ■PAUSED■";

}



//再開
function resume() {
  tst.isActivated = true;
  const now = Date.now();
  tst.endTime += ((now - tst.pausedTime));
  worker.postMessage([tst.endTime, true]);

  setTimeout(() => {
    updateClockDisplay(getRemainingSeconds());
  }, getRemainingSeconds(true) % 1000 + 10);

  const remainingSeconds = getRemainingSeconds();
  const minutesStr = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const secondsStr = String(remainingSeconds % 60).padStart(2, '0');

  tabIcon.href = "icon.ico";
  timerEl.resumeButton.style.display = "none";
  timerEl.resetButton.style.display = "none";
  timerEl.pauseButton.style.display = "inline-block";
  timerEl.title.textContent = (minutesStr + ":" + secondsStr + " Left");


  asyncAutoStopMode();
  asyncMute();

}



//タイマーを終了
function reset() {
  tst.isActivated = false;
  tst.ringCount = 0;
  worker.postMessage([undefined, false, true]);

  timerEl.title.textContent = "NicomiTimer";
  timerEl.clock.textContent = "00:00";
  timerEl.bar.style.width = "0px";

  body.style.backgroundColor = "#505050";
  timerEl.clock.style.filter = "invert(0%)";
  timerEl.quickStartDiv.style.display = "flex";
  tabIcon.href = "icon.ico";

  for (let i = 0; i < timerEl.quickStartButtons.length; i++) {
    timerEl.quickStartButtons[i].style.opacity = "100%";
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

  tst.endTime = undefined;
  tst.startedTime = undefined;

  setTimeout(() => {
    tst.isAllowShortcutkey = true;
  }, 100);

}


function asyncAutoStopMode() {

  setTimeout(() => {

    if (timerEl.autoStopCheckbox.checked) {
      tst.isAutoStopEnabled = true;
    } else {
      tst.isAutoStopEnabled = false;
    }

  }, 30);

}



//音量を変更する
function setVolume() {
  const volume = timerEl.volumeBar.value;
  timerEl.volumeBarLabel.textContent = ("Volume: " + volume + "%");

  if (timerEl.muteCheckbox.checked) {
    alarm.volume = 0;
  } else {
    alarm.volume = volume * 0.01;
  }
}


function asyncMute() {

  setTimeout(() => {

    if (timerEl.muteCheckbox.checked) {
      timerEl.volumeBar.style.opacity = "20%";
      timerEl.volumeBarLabel.style.opacity = "20%";
      timerEl.muteIcon.src = "img/muted.png"
      timerEl.muteIcon.alt = "Muted";
    } else {
      timerEl.volumeBar.style.opacity = "100%";
      timerEl.volumeBarLabel.style.opacity = "65%";
      timerEl.muteIcon.src = "img/unmuted.png";
      timerEl.muteIcon.alt = "Unmuted";
    }

  }, 30);
}



//ガイドを非表示
function hideGuide() {
  setTimeout(() => {

    timerEl.guide.forEach(el => {
      el.style.color = "transparent";

      setTimeout(() => {
        el.style.display = "none";
      }, 1500);

    });
  }, 10000);
}




/**
 * 
 * @returns {number}
 */
function getRemainingSeconds(includeMilliseconds) {
  if (includeMilliseconds) {
    return Math.floor((tst.endTime - (Date.now())) / 1000) + (((tst.endTime - (Date.now())) % 1000) * 0.0001);
  } else {
    return Math.floor((tst.endTime - (Date.now())) / 1000);
  }
}


/**
 * 
 * @returns {text}
 */
function getRealTimeStr(includeMilliseconds) {
  const realTime = new Date();
  const hoursStr = String(Math.floor(realTime.getHours())).padStart(2, '0');
  const minutesStr = String(Math.floor(realTime.getMinutes())).padStart(2, '0');
  const secondsStr = String(realTime.getSeconds()).padStart(2, '0');
  if (includeMilliseconds) { return (hoursStr + ":" + minutesStr + ":" + secondsStr + "." + realTime.getMilliseconds()); }
  else { return (hoursStr + ":" + minutesStr + ":" + secondsStr); }
}