//import {timerSt} from "./main.js";

self.onmessage = (ev) => {
  const endTime = ev.data;

  const realTime = Date.now();
  const remainingTime = Math.floor((endTime-realTime)/1000);

  self.postMessage(remainingTime);

}