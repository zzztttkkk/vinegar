import { DEBUG } from "./env";
import "./internal/globals/index";

export * as sync from "./sync";
export * as threadings from "./threadings";
export { Import, LazyDepend } from "./internal";
export * as reflection from "./reflection";
export { LRUCache } from "./lru";
export { env, envdoc, DEBUG } from "./env";

if (DEBUG) {
	const sort = Array.prototype.sort;
	Array.prototype.sort = function (cmp: (a: any, b: any) => number): any[] {
		if (this.length < 1) return this;
		if (cmp == null && typeof this[0] !== "string") {
			console.warn(new Error(`empty cmp function`));
		}
		return sort.bind(this)(cmp);
	};
}
