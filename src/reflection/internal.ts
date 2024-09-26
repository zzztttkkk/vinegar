import { LazyDepend } from "../internal";

export const dis = {
	bind: new LazyDepend<(...args: any[]) => any>(import.meta, "bind"),
	merge: new LazyDepend<(...args: any[]) => any>(import.meta, "merge"),
};
