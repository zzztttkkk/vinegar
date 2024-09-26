import * as path from "path";
import * as url from "url";

export class LazyDepend<T> {
	private static insmap = new Map<string, LazyDepend<any>>();

	private readonly name: string;
	private val: T | undefined = undefined;

	constructor(meta: ImportMeta, name: string) {
		const dir = path
			.relative(process.cwd(), url.fileURLToPath(meta.url))
			.replaceAll(path.sep, "/");
		this.name = `./${dir}#${name}`;
		LazyDepend.insmap.set(this.name, this);
	}

	inject(v: T) {
		this.val = v;
	}

	expose(): T {
		if (this.val == null) {
			throw new Error(`unfilled lazydi: ${this.name}`);
		}
		return this.val;
	}

	get content(): T {
		return this.expose();
	}

	static check() {
		for (const ins of this.insmap.values()) {
			ins.expose();
		}
	}
}
