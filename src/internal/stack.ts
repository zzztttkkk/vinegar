class Node<T> {
	val: T;
	next?: Node<T>;

	constructor(v: T) {
		this.val = v;
	}
}

export class Stack<T> {
	private _top?: Node<T>;
	private _tail?: Node<T>;
	private _depth = 0;

	get depth(): number {
		return this._depth;
	}

	empty(): boolean {
		return this._depth == 0;
	}

	peek(): T {
		if (this.empty()) {
			throw new Error("empty stack");
		}
		return this._top!.val;
	}

	push(v: T) {
		this._depth++;
		const node = new Node(v);
		if (this._tail) {
			this._tail.next = node;
		} else {
			this._top = node;
		}
		this._tail = node;
	}

	pop(): T {
		if (!this._top) {
			throw new Error("empty stack");
		}
		this._depth--;
		const val = this._top.val;
		this._top = this._top.next;
		if (!this._top) this._tail = undefined;
		return val;
	}
}
