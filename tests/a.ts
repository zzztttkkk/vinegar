import { sleep } from "bun";
import * as lib from "../index";

console.json(lib.threadings.errors);

process.RegisterBeforeShutdownAction(async () => {
  await sleep(1000);
});
