import { inspect } from "bun";

export { Stack } from "./stack";
export { Import } from "./import";
export { LazyDepend } from "./lazydi";

// https://stackoverflow.com/a/1997811/6683474
const UniqueIdSymbal = Symbol("pkgs:internal:unique_id");
let UniqueIdSeq = BigInt(Math.floor(Math.random() * 10000));

export function UniqueId(v: object): BigInt {
  switch (typeof v) {
    case "object":
    case "function": {
      if (v == null) return BigInt(0);

      let pid: BigInt | undefined = (v as any)[UniqueIdSymbal];
      if (pid != null) {
        return pid;
      }
      pid = UniqueIdSeq++;
      Object.defineProperty(v, UniqueIdSymbal, {
        value: pid,
        enumerable: false,
        writable: false,
        configurable: false,
      });
      return pid;
    }
    default: {
      throw new Error(`${inspect(v)} is not an object`);
    }
  }
}
