import { sleep } from "bun";
import { Import, Secrets } from "../internal";
import { type Node, LinkList } from "../internal/linklist";

interface IPair<K, V> {
	val: V;
	key: K;
}

export class LRUCache<K extends {}, V extends {}> {
	#map: Map<K, Node<IPair<K, V>>>;
	#list: LinkList<IPair<K, V>>;
	#cap: number;

	constructor(cap: number) {
		this.#map = new Map();
		this.#list = new LinkList();
		this.#cap = cap;
		if (this.#cap < 1) throw new Error(`bad cap: ${cap}`);
	}

	get(key: K): V | undefined {
		const node = this.#map.get(key);
		if (node == null) return undefined;
		const val = node.data.val;
		this.#list.movetofront(node);
		return val;
	}

	set(key: K, val: V) {
		const prevnode = this.#map.get(key);
		if (prevnode != null) {
			prevnode.data.val = val;
			this.#list.movetofront(prevnode);
			return;
		}
		const node = this.#list.pushfront({ key, val });
		this.#map.set(key, node);

		while (this.#list.length > this.#cap) {
			const pair = this.#list.popback();
			this.#map.delete(pair.key);
		}
	}

	del(key: K): V | undefined {
		const node = this.#map.get(key);
		if (node == null) return undefined;
		this.#list.delnode(node);
		this.#map.delete(key);
		return node.data.val;
	}

	clear() {
		this.#map.clear();
		this.#list = new LinkList();
	}

	recap(ncap: number) {
		if (ncap < 1) throw new Error(`bad cap: ${ncap}`);
		this.#cap = ncap;
	}

	get size(): number {
		return this.#map.size;
	}
}

if (Import.ismain(import.meta)) {
	const jsc = await import("bun:jsc");
	const cache = new LRUCache<string, number>(1000);
	while (true) {
		await sleep(1);
		cache.set(Secrets.randstrings(10), Math.random());
		Bun.gc(true);
		console.log(`${Math.floor(jsc.memoryUsage().current / 1024)}KB ${cache.size}`);
	}
}
