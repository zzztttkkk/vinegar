import { Import } from "./import";

const defaultRandStringsPool = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export class Secrets {
	public static randstrings(length: number, opts?: { pool?: string[] }): string {
		if (length < 1) return "";

		const pool = opts?.pool || defaultRandStringsPool;

		const tmp = [] as string[];
		let tmplen = 0;

		while (true) {
			const ele = pool[Math.floor(Math.random() * pool.length)];
			tmplen += ele.length;
			if (tmplen < length) {
				tmp.push(ele);
				continue;
			}
			tmp.push(ele.slice(0, tmplen - length + 1));
			break;
		}
		return tmp.join("");
	}
}

if (Import.ismain(import.meta)) {
	console.log(Secrets.randstrings(18));
}
