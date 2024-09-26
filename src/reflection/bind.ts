import { inspect } from "bun";
import { ArrayType, MapType, type MetaRegister, SetType, type TypeValue, metainfo } from "./meta_register";
import { dis } from "./internal";

export function __bind(typev: TypeValue, obj: any, hint?: any): any {
	if (typeof typev === "function") return transform(obj, typev as any, hint);

	if (typev instanceof ArrayType) {
		if (!obj || typeof obj[Symbol.iterator] !== "function") {
			throw new Error(`can not bind to array from a non-iterable object, ${inspect(obj)}`);
		}

		const ary = [] as any[];
		for (const ele of obj) {
			ary.push(__bind(typev.eletype, ele, typev.bindhint));
		}
		return ary;
	}

	if (typev instanceof SetType) {
		if (!obj || typeof obj[Symbol.iterator] !== "function") {
			throw new Error(`can not bind to set from a non-iterable object, ${inspect(obj)}`);
		}

		const ary = new Set<any>();
		for (const ele of obj) {
			ary.add(__bind(typev.eletype, ele, typev.bindhint));
		}
		return ary;
	}

	if (!(typev instanceof MapType)) {
		throw new Error(`bad type value: ${typev}`);
	}

	const map = new Map<any, any>();

	function add(k: any, v: any) {
		map.set(
			__bind((typev as MapType).keytype, k, (typev as MapType).keybindhint),
			__bind((typev as MapType).eletype, v, (typev as MapType).bindhint),
		);
	}

	if (obj instanceof Map) {
		for (const [k, v] of obj) {
			add(k, v);
		}
		return map;
	}

	if (obj && typeof obj[Symbol.iterator] === "function") {
		for (const ele of obj) {
			if (Array.isArray(ele) && ele.length === 2) {
				add(ele[0], ele[1]);
			} else {
				throw new Error(`can not bind to map, because the ${inspect(obj)}'s ele is not array or length !== 2`);
			}
		}
		return map;
	}
	for (const [k, v] of obj) {
		add(k, v);
	}
	return map;
}

export interface IBindPropOpts {
	type?: TypeValue;
	bindhint?: any;
}

// T's constructor must has empty params
export function bind<T, P extends IBindPropOpts>(
	register: MetaRegister<unknown, P, unknown>,
	cls: ClassOf<T>,
	src: any,
): T {
	if (typeof (cls as any)[Symbol.transform] === "function") {
		return transform(src, cls);
	}

	const meta = metainfo(register, cls);

	const props = meta.props();
	if (!props) {
		throw new Error(`empty refleaction metadata, [class ${cls.name}]`);
	}

	const ele = new cls();

	for (const [k, p] of props) {
		if (p.accessorstatus && !p.accessorstatus.canset) {
			continue;
		}
		const srcv = src[k];
		if (typeof srcv === "undefined") continue;

		const typev = p.opts?.type || p.designtype;
		(ele as any)[k] = __bind(typev, srcv, p.opts?.bindhint);
	}
	return ele;
}

dis.bind.inject(bind);
