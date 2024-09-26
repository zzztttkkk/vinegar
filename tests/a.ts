import { sleep } from "bun";
import * as lib from "../index";
import "reflect-metadata";

console.json(lib.threadings.errors);

process.RegisterBeforeShutdownAction(async () => {
	await sleep(1000);
});

function As(): ClassDecorator {
	return (target: Function) => {
		console.log(target);
	};
}

@As()
class A {}

console.log(transform("false", Boolean));
