declare global {
	interface ClassOf<T> {
		new (...args: any): T;
	}

	type Action = () => void | Promise<void>;

	type KeysOnly<T, V> = keyof {
		[P in keyof T as T[P] extends V ? P : never]: P;
	};
}
