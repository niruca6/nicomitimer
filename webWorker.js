let endTime = undefined;
let isActivated = false;
setInterval(backgroundTimer, 1000);


self.onmessage = (ev) => {
  endTime = ev.data[0];
  isActivated = ev.data[1];
}


function backgroundTimer() {
  if(!isActivated) return;
  const realTime = Date.now();
  const remainingTime = Math.floor((endTime-realTime)/1000);

  self.postMessage(remainingTime);
}
