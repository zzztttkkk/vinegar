declare global {
	interface Console {
		json(v: unknown): void;
	}
}

Object.defineProperty(console, "json", {
	value: (v: unknown) => {
		console.log(JSON.stringify(v, null, 2));
	},
});
