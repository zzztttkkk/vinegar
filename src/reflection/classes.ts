export function IsClass(v: Function): boolean {
	if (typeof v !== "function") return false;
	const ins = Bun.inspect(v, { colors: false, sorted: false, depth: 1 });
	if (!ins.startsWith(`[class ${v.name}`) || !ins.endsWith("]")) {
		return false;
	}
	const ts = v.toString();
	return ts.startsWith(`class ${v.name} `) && ts.endsWith("}");
}

export function IsSubClassOf(sub: Function, base: Function): boolean {
	return sub.prototype instanceof base;
}

export function IsPureObject(v: any): boolean {
	switch (typeof v) {
		case "object": {
			if (v == null) return false;
			return Object.getPrototypeOf(v).constructor === Object;
		}
		default: {
			return false;
		}
	}
}

export function classof<T>(obj: T): ClassOf<T> {
	return Object.getPrototypeOf(obj).constructor;
}
