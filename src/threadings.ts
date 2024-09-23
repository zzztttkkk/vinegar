import { cpus } from "os";
import { Worker, isMainThread, parentPort, threadId } from "worker_threads";

interface Msg<T> {
  id: bigint;
  data: T;
  err?: Error;
  canceled?: boolean;
  timeouted?: boolean;
}

interface Waiter<T> {
  resolve: (v: T) => void;
  reject: (e: Error) => void;
  timeoutHandle?: Timer;
}

interface ExecOptions {
  Timeout?: number;
  GetIdx?: (idx: bigint) => void;
}

export const errors = {
  Timeouted: new Error("Timeouted"),
  Canceled: new Error("Canceled"),
};

export class TypedThread<Input, Output> {
  private worker: Worker;
  private waiters: Map<bigint, Waiter<Output>>;
  private idx: bigint;

  constructor(file: string) {
    this.idx = BigInt(0);
    this.waiters = new Map();
    this.worker = new Worker(file);
    this.worker.on("message", (msg: Msg<Output>) => {
      const waiter = this.waiters.get(msg.id);
      if (!waiter) return;

      clearTimeout(waiter.timeoutHandle);
      this.waiters.delete(msg.id);

      if (msg.err != null) {
        waiter.reject(msg.err);
      } else {
        waiter.resolve(msg.data);
      }
    });
  }

  private get nid(): bigint {
    this.idx++;
    return this.idx;
  }

  private makeTimeoutFunc(idx: bigint): () => void {
    return () => {
      const waiter = this.waiters.get(idx);
      if (!waiter) return;

      this.waiters.delete(idx);

      this.worker.postMessage({
        id: idx,
        timeouted: true,
      } as Msg<Input>);

      waiter.reject(errors.Timeouted);
    };
  }

  exec(msg: Input, opts?: ExecOptions): Promise<Output> {
    return new Promise<Output>((res, rej) => {
      const msgId = this.nid;
      this.worker.postMessage({ id: msgId, data: msg } as Msg<Input>);

      const waiter: Waiter<Output> = { reject: rej, resolve: res };

      this.waiters.set(msgId, waiter);

      if (opts) {
        if (opts.GetIdx) {
          opts.GetIdx(msgId);
        }
        if (opts.Timeout && opts.Timeout > 0) {
          if (opts.Timeout < 300) opts.Timeout = 300;
          waiter.timeoutHandle = setTimeout(
            this.makeTimeoutFunc(msgId),
            opts.Timeout
          );
        }
      }
    });
  }

  cancel(idx: bigint) {
    const fns = this.waiters.get(idx);
    if (!fns) return;
    this.worker.postMessage({
      id: idx,
      canceled: true,
    } as Msg<Input>);
    fns.reject(errors.Canceled);
    this.waiters.delete(idx);
  }

  get busycount(): number {
    return this.waiters.size;
  }

  get idle(): boolean {
    return this.waiters.size < 1;
  }

  async close() {
    await this.worker.terminate();
  }
}

export enum TypedThreadPoolDispatchPolicy {
  Random,
  Blance,
}

export class TypedThreadPool<Input, Output> {
  private workers: TypedThread<Input, Output>[];

  constructor(
    size: number,
    file: string,
    policy?: TypedThreadPoolDispatchPolicy
  ) {
    if (size < 1) size = Threadings.CPU_NUMS;
    this.workers = [];
    for (let i = 0; i < size; i++) {
      this.workers.push(new TypedThread<Input, Output>(file));
    }
    if (this.workers.length < 1) {
      throw new Error(`bad size: ${size}`);
    }
    policy = policy || TypedThreadPoolDispatchPolicy.Random;
    switch (policy) {
      case TypedThreadPoolDispatchPolicy.Blance: {
        this.exec = this.blanceExec.bind(this);
        break;
      }
      default: {
      }
    }
  }

  private blanceExec(msg: Input, opts?: ExecOptions): Promise<Output> {
    this.workers = this.workers.sort((a, b) => a.busycount - b.busycount);
    return this.workers[0].exec(msg, opts);
  }

  exec(msg: Input, opts?: ExecOptions): Promise<Output> {
    const idx = Math.floor(Math.random() * this.workers.length);
    return this.workers[idx].exec(msg, opts);
  }
}

export interface Hooks {
  OnCanceled: (cb: () => void) => void;
  OnTimeouted: (cb: () => void) => void;
}

const threads = new Set<number>();

interface ICallbacks {
  Timeout: null | (() => void);
  Cancele: null | (() => void);
}

export class Threadings {
  static exec<Input, Output>(
    fn: (i: Input, hooks: Hooks) => Promise<Output> | Output
  ) {
    if (threads.has(threadId)) {
      throw new Error(`Thread${threadId} is working`);
    }
    threads.add(threadId);

    const hooksMap = new Map<bigint, ICallbacks>();

    parentPort!.on("message", async (msg: Msg<Input>) => {
      const msgId = msg.id;

      if (msg.timeouted) {
        const hs = hooksMap.get(msgId);
        if (hs && hs.Timeout) hs.Timeout();
        return;
      }

      if (msg.canceled) {
        const hs = hooksMap.get(msgId);
        if (hs && hs.Cancele) hs.Cancele();
        return;
      }

      const cbs: ICallbacks = {
        Timeout: null,
        Cancele: null,
      };
      hooksMap.set(msgId, cbs);

      try {
        const result = await fn(msg.data, {
          OnTimeouted: (cb) => {
            cbs.Timeout = cb;
          },
          OnCanceled: (cb) => {
            cbs.Cancele = cb;
          },
        });
        parentPort!.postMessage({ id: msgId, data: result } as Msg<Output>);
      } catch (e) {
        parentPort!.postMessage({ id: msgId, err: e } as Msg<Output>);
      } finally {
        hooksMap.delete(msgId);
      }
    });
  }

  static ismain(): boolean {
    return isMainThread;
  }

  static id(): number {
    return threadId;
  }

  static CPU_NUMS = cpus().length;
}
