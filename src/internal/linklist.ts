import { Import } from "./import";

export class Node<T> {
	data!: T;
	prev?: Node<T>;
	next?: Node<T>;

	constructor(v: T) {
		this.data = v;
	}
}

export class LinkList<T> {
	_head?: Node<T>;
	_tail?: Node<T>;
	_size: number = 0;

	get length(): number {
		return this._size;
	}

	empty(): boolean {
		return this.length < 1;
	}

	private init(node: Node<T>) {
		this._head = node;
		this._tail = node;
		this._size++;
	}

	private remove_node(node: Node<T>) {
		const np = node.prev;
		const nn = node.next;
		if (np) np.next = nn;
		if (nn) nn.prev = np;
	}

	pushback(v: T): Node<T> {
		const node = new Node(v);
		if (!this.empty()) {
			this._tail!.next = node;
			node.prev = this._tail;

			this._tail = node;
			this._size++;
		} else {
			this.init(node);
		}
		return node;
	}

	pushfront(v: T): Node<T> {
		const node = new Node(v);
		if (!this.empty()) {
			this._head!.prev = node;
			node.next = this._head;

			this._head = node;
			this._size++;
		} else {
			this.init(node);
		}
		return node;
	}

	peekhead(): Node<T> | undefined {
		return this._head;
	}

	peektail(): Node<T> | undefined {
		return this._tail;
	}

	movetofront(node: Node<T>): LinkList<T> {
		if (Object.is(node, this._head)) return this;

		this.remove_node(node);

		node.prev = undefined;
		node.next = this._head;
		this._head!.prev = node;
		this._head = node;
		return this;
	}

	movetoback(node: Node<T>): LinkList<T> {
		if (Object.is(node, this._tail)) return this;

		this.remove_node(node);

		node.next = undefined;
		node.prev = this._tail;
		this._tail!.prev = node;
		this._tail = node;
		return this;
	}

	delnode(node: Node<T>): T {
		const np = node.prev;
		const nn = node.next;
		if (np) np.next = nn;
		if (nn) nn.prev = np;

		if (node === this._head) this._head = nn;
		if (node === this._tail) this._tail = np;

		this._size--;
		return node.data;
	}

	popfront(): T {
		if (this.empty()) throw new Error(`empty list`);
		const val = this._head!.data;
		this.delnode(this._head!);
		return val;
	}

	popback(): T {
		if (this.empty()) throw new Error(`empty list`);
		const val = this._tail!.data;
		this.delnode(this._tail!);
		return val;
	}

	[Symbol.iterator]() {
		const self = this;
		function* newiter() {
			let cursor = self._head;
			while (true) {
				if (cursor == null) break;
				yield cursor.data;
				cursor = cursor.next;
			}
		}
		return newiter();
	}
}

if (Import.ismain(import.meta)) {
	const list = new LinkList<number>();
	list.pushback(12);
	list.pushfront(1);
	list.pushback(13);
	list.pushfront(3);

	list.popfront();
	list.popback();

	for (const element of list) {
		console.log(element);
	}

	console.log(Array.from(list));
}
