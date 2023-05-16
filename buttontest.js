import { ButtonManager } from "./src/ButtonManager.js";
import { timeout } from "./src/utils.js";

const manager = new ButtonManager();

manager
  .on("press", (pin) => {
    console.log(`${pin}: pressed`);
  })
  .on("release", (pin) => {
    console.log(`${pin}: released`);
  })
  .on("click", (pin) => {
    console.log(`${pin}: clicked`);
  })
  .on("long_press", (pin, time) => {
    console.log(`${pin}: long press ${time}`);
  });

(async () => {
  manager.update(1, true);
  await timeout(50);
  manager.update(1, false);

  await timeout(200);

  manager.update(1, true);
  await timeout(350);
  manager.update(1, false);
})();
