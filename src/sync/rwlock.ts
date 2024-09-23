import { inspect } from "util";
import { Stack } from "../internal";
import { Lock } from "./lock";

interface Waiter {
  w: boolean;
  resolve: () => void;
}

class ReleaseHandle implements AsyncDisposable {
  #fn: () => Promise<void>;

  constructor(v: () => Promise<void>) {
    this.#fn = v;
  }

  [Symbol.asyncDispose](): PromiseLike<void> {
    return this.#fn();
  }
}

export class RwLock {
  private readonly lock: Lock;
  private writing = false;
  private readings = 0;
  private readonly waiters: Stack<Waiter>;

  constructor() {
    this.lock = new Lock();
    this.waiters = new Stack();
  }

  [inspect.custom]() {
    return `[RwLock w: ${this.writing}, r: ${this.readings}, waiters: ${
      this.waiters.depth
    }, internal: ${inspect(this.lock)}]`;
  }

  private async releasew() {
    using _ = await this.lock.acquire();

    if (this.waiters.empty()) {
      this.writing = false;
      return;
    }

    const top = this.waiters.pop();
    if (top.w) {
      top.resolve();
      return;
    }

    this.writing = false;
    this.readings++;
    top.resolve();
  }

  private async releaser() {
    using _ = await this.lock.acquire();

    if (this.waiters.empty()) {
      this.readings--;
      return;
    }

    if (this.waiters.peek().w) {
      this.readings--;
      if (this.readings < 1) {
        this.writing = true;
        this.waiters.pop().resolve();
      }
      return;
    }

    this.waiters.pop().resolve();
  }

  async acquirew(): Promise<ReleaseHandle> {
    await this.lock.acquire();

    if (this.writing || this.readings) {
      await new Promise<void>((resolve) => {
        this.waiters.push({ resolve, w: true });
        this.lock.release();
      });
    } else {
      this.writing = true;
      this.lock.release();
    }
    return new ReleaseHandle(this.releasew.bind(this));
  }

  async acquirer(): Promise<ReleaseHandle> {
    await this.lock.acquire();

    if (this.writing) {
      await new Promise<void>((resolve) => {
        this.waiters.push({ resolve, w: false });
        this.lock.release();
      });
    } else {
      this.readings++;
      this.lock.release();
    }
    return new ReleaseHandle(this.releaser.bind(this));
  }
}
