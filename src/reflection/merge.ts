import { __bind } from "./bind.js";
import { classof } from "./classes.js";
import { dis } from "./internal.js";
import { type MetaRegister, type PropInfo, type TypeValue, metainfo } from "./meta_register";

export interface IMergePropOpts {
	type?: TypeValue;
}

type CanOverWriteFn<P> = (dest: any, src: any, cls: Function, key: string, prop: PropInfo<P>) => boolean;

export interface IMergeOptions<P> {
	overwrite?: boolean | CanOverWriteFn<P>;
}

interface _MergeOption<P> extends IMergeOptions<P> {
	crefset?: Set<any>;
}

function _merge<T, P extends IMergePropOpts>(
	register: MetaRegister<unknown, P, unknown>,
	dest: T,
	src: T,
	opts?: _MergeOption<P>,
) {
	const cls = classof(dest);
	const props = metainfo(register, cls).props();
	if (!props) {
		throw new Error(`empty refleaction metadata, [class ${cls.name}]`);
	}

	for (const [k, p] of props) {
		if (p.accessorstatus && !p.accessorstatus.canset) {
			continue;
		}
		const sv = (src as any)[k];
		if (typeof sv === "undefined") {
			continue;
		}

		const typev = p.opts?.type || p.designtype;
		const stv = __bind(typev, sv);

		const dv = (dest as any)[k];

		if (typeof dv === "undefined") {
			(dest as any)[k] = stv;
			continue;
		}

		let overwrite = opts?.overwrite;

		if (typeof overwrite === "function") {
			overwrite = overwrite(dv, sv, cls, k, p);
		}
		if (!overwrite) continue;
		(dest as any)[k] = __bind(typev, sv);
	}
}

export function merge<T, P extends IMergePropOpts>(
	register: MetaRegister<unknown, P, unknown>,
	dest: T,
	src: any[],
	opts?: IMergeOptions<P>,
): T {
	for (const ele of src) {
		_merge(register, dest, ele, opts);
	}
	return dest;
}

dis.merge.inject(merge);
