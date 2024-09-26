import { Glob, type GlobScanOptions } from "bun";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const ProcessEntry = path.resolve(process.argv[1]);

export class Import {
	static ismain(meta: ImportMeta): boolean {
		return path.resolve(url.fileURLToPath(meta.url)) === ProcessEntry;
	}

	static source(meta: ImportMeta): string {
		return path.resolve(url.fileURLToPath(meta.url));
	}

	static sourcedir(meta: ImportMeta): string {
		return path.dirname(this.source(meta));
	}

	static async projectroot(meta: ImportMeta): Promise<string> {
		let cursor = this.sourcedir(meta);
		const self = this;

		function next() {
			const cd = path.dirname(cursor);
			if (cd === cursor) {
				throw new Error(`Cannot find package.json by ${self.sourcedir(meta)}`);
			}
			cursor = path.dirname(cursor);
		}

		while (true) {
			try {
				const stat = await fs.stat(`${cursor}/package.json`);
				if (stat.isFile()) {
					return cursor;
				}
				next();
			} catch (e) {
				next();
			}
		}
	}

	static async require(
		patterns: string[],
		cb: (module: any) => void | Promise<void>,
		opts?: GlobScanOptions,
	) {
		if (!opts) opts = {};
		opts.absolute = true;
		for (const pattern of patterns) {
			const glob = new Glob(pattern);
			for await (const element of glob.scan(opts)) {
				const module = await import(element);
				const crv = cb(module);
				if (crv instanceof Promise) {
					await crv;
				}
			}
		}
	}
}
