import { inspect, sleep } from "bun";
import { Import, Stack } from "../internal";

type Waiter = () => void;

export const ErrLockIsFree = new Error("the lock is free");

export class Lock implements Disposable {
	private locked = false;
	private readonly waiters: Stack<Waiter>;

	constructor() {
		this.waiters = new Stack();
	}

	async acquire() {
		if (this.locked) {
			await new Promise<void>((resolve) => this.waiters.push(resolve));
		} else {
			this.locked = true;
		}
		return this;
	}

	release() {
		if (!this.locked) throw ErrLockIsFree;

		if (this.waiters.empty()) {
			this.locked = false;
			return;
		}
		this.waiters.pop()();
	}

	[Symbol.dispose](): void {
		this.release();
	}

	[inspect.custom]() {
		return `[Lock locked: ${this.locked}, waiters: ${this.waiters.depth}]`;
	}
}

if (Import.ismain(import.meta)) {
	const lock = new Lock();

	async function test_routine(idx: number) {
		using _ = await lock.acquire();

		await sleep(Math.random() * 10);
		console.log(idx, Date.now(), lock);
	}

	const ps = [] as Array<Promise<void>>;

	for (let i = 0; i < 100; i++) {
		ps.push(test_routine(i));
	}

	await Promise.all(ps);

	console.log(lock);
}
