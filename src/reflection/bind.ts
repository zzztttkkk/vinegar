import { inspect } from "bun";
import { ArrayType, MapType, type MetaRegister, ObjectType, SetType, type TypeValue, metainfo } from "./meta_register";
import { dis } from "./internal";

export function __bind<P extends IBindPropOpts>(
	register: MetaRegister<unknown, P, unknown>,
	typev: TypeValue,
	obj: any,
	hint?: any,
): any {
	if (typeof typev === "function") {
		const trans = Reflect.get(typev, Symbol.transform);
		if (trans) {
			return transform(obj, typev as any, hint);
		}
		return bind(register, typev as any, obj);
	}

	if (typev instanceof ArrayType) {
		if (!obj || typeof obj[Symbol.iterator] !== "function") {
			throw new Error(`can not bind to array from a non-iterable object, ${inspect(obj)}`);
		}

		const ary = [] as any[];
		for (const ele of obj) {
			ary.push(__bind(register, typev.eletype, ele, typev.bindhint));
		}
		return ary;
	}

	if (typev instanceof SetType) {
		if (!obj || typeof obj[Symbol.iterator] !== "function") {
			throw new Error(`can not bind to set from a non-iterable object, ${inspect(obj)}`);
		}

		const ary = new Set<any>();
		for (const ele of obj) {
			ary.add(__bind(register, typev.eletype, ele, typev.bindhint));
		}
		return ary;
	}

	let isobj = false;
	if (typev instanceof ObjectType) {
		typev = new MapType(String, typev.eletype, { value: typev.bindhint });
		isobj = true;
	}
	if (!(typev instanceof MapType)) {
		throw new Error(`bad type value: ${typev}`);
	}

	const map = new Map<any, any>();

	function add(k: any, v: any) {
		map.set(
			__bind(register, (typev as MapType).keytype, k, (typev as MapType).keybindhint),
			__bind(register, (typev as MapType).eletype, v, (typev as MapType).bindhint),
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

	if (isobj) {
		const obj = {};
		for (const [k, v] of map) {
			Reflect.set(obj, k, v);
		}
		return obj;
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
		const srcv = Reflect.get(src, k);
		if (srcv === undefined) continue;
		Reflect.set(ele as object, k, __bind(register, p.opts?.type || p.designtype, srcv, p.opts?.bindhint));
	}
	return ele;
}

dis.bind.inject(bind);
