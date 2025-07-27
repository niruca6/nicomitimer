let endTime = undefined;
let isActivated = false;
let backgroundTimer = undefined;


self.onmessage = (ev) => {
  endTime = ev.data[0];
  isActivated = ev.data[1];
  const isReset = ev.data[2] ? ev.data[2] : false;

  if (isReset) {
    clearInterval(backgroundTimer);
    backgroundTimer = null;

  } else if (!backgroundTimer) {

    backgroundTimer = setInterval(() => {

      if (!isActivated) return;
      const realTime = Date.now();
      const remainingSeconds = Math.floor((endTime - realTime) / 1000);

      self.postMessage(remainingSeconds);
    }, 1000);

  }
}
