import "reflect-metadata";
import { IsClass } from "./classes";
import { inspect } from "bun";
import type { IMergeOptions } from "./merge";
import { dis } from "./internal";

export class PropInfo<T> {
	public readonly designtype: any;
	public readonly accessorstatus?: {
		canget?: boolean;
		canset?: boolean;
	};
	public readonly opts?: T = undefined;

	constructor(designtype: any, opts?: T) {
		this.designtype = designtype;
		this.opts = opts;
	}
}

class MethodInfo<T, A> {
	public paramtypes: any[] | undefined;
	public returntype: any | undefined;
	public opts?: T;
	public readonly paramopts: Map<number, A | undefined>;

	constructor() {
		this.paramopts = new Map();
	}
}

type PropsMetaMap<T> = Map<string, PropInfo<T>>;
type MethodsMetaMap<T, A> = Map<string, MethodInfo<T, A>>;

class MetaInfo<ClsOpts, PropOpts, MethodOpts, ParamOpts> {
	#cls: Function;
	#register: MetaRegister<ClsOpts, PropOpts, MethodOpts, ParamOpts>;

	constructor(register: MetaRegister<ClsOpts, PropOpts, MethodOpts, ParamOpts>, cls: Function) {
		this.#register = register;
		this.#cls = cls;
	}

	cls(): ClsOpts | undefined {
		//@ts-ignore
		return this.#register._clsMetaData.get(this.#cls);
	}

	props(): PropsMetaMap<PropOpts> | undefined {
		//@ts-ignore
		return this.#register._propsMetaData.get(this.#cls);
	}

	methods(): MethodsMetaMap<MethodOpts, ParamOpts> | undefined {
		//@ts-ignore,
		return this.#register._methodsMetaData.get(this.#cls);
	}

	prop(name: string): PropInfo<PropOpts> | undefined {
		return this.props()?.get(name);
	}
}

export function metainfo<ClsOpts, PropOpts, MethodOpts, ParamOpts>(
	register: MetaRegister<ClsOpts, PropOpts, MethodOpts, ParamOpts>,
	cls: Function,
): MetaInfo<ClsOpts, PropOpts, MethodOpts, ParamOpts> {
	if (!IsClass(cls)) {
		throw new Error(`${inspect(cls)} is not a class`);
	}
	return new MetaInfo(register, cls);
}

// const ReflectionRegisterBindHole = tspkgs.holes.ReflectionRegisterBind;
// const ReflectionRegisterMergeHole = tspkgs.holes.ReflectionRegisterMerge;

export class MetaRegister<ClsOpts = unknown, PropOpts = unknown, MethodOpts = unknown, ParamOpts = unknown> {
	public readonly name: symbol;

	private readonly _clsMetaData: Map<Function, ClsOpts>;
	private readonly _propsMetaData: Map<Function, PropsMetaMap<PropOpts>>;
	private readonly _methodsMetaData: Map<Function, MethodsMetaMap<MethodOpts, ParamOpts>>;

	constructor(name: symbol) {
		this.name = name;
		this._clsMetaData = new Map();
		this._propsMetaData = new Map();
		this._methodsMetaData = new Map();
	}

	cls(opts?: ClsOpts): ClassDecorator {
		return (target) => {
			if (opts) {
				this._clsMetaData.set(target, opts);
			}
		};
	}

	prop(opts?: PropOpts): PropertyDecorator {
		return (target, key, desc?: TypedPropertyDescriptor<any>) => {
			if (typeof key === "symbol") {
				throw new Error(`decorator can not on a symbol`);
			}

			const cls: Function = target.constructor;

			const pm: PropsMetaMap<PropOpts> = this._propsMetaData.get(cls) || new Map();

			let designType = Reflect.getMetadata("design:type", target, key);
			if (desc) {
				if (!desc.get) throw new Error(`prop decorator on a method`);
				designType = Reflect.getMetadata("design:returntype", target, key);
			}

			const info = new PropInfo(designType, opts);
			if (desc) {
				//@ts-ignore
				info.accessorstatus = {};
				info.accessorstatus.canget = desc.get != null;
				info.accessorstatus.canset = desc.set != null;
			}
			pm.set(key, info);
			this._propsMetaData.set(cls, pm);
		};
	}

	method(opts?: MethodOpts): MethodDecorator {
		return (target, key, desc) => {
			if (typeof key === "symbol") {
				throw new Error(`decorator can not on a symbol`);
			}
			if (desc.get || desc.set) {
				throw new Error(`method decorator on a accessor`);
			}

			const cls: Function = target.constructor;

			const pm: MethodsMetaMap<MethodOpts, ParamOpts> = this._methodsMetaData.get(cls) || new Map();

			let methodinfo = pm.get(key as string);
			if (!methodinfo) methodinfo = new MethodInfo();

			methodinfo.paramtypes = Reflect.getMetadata("design:paramtypes", target, key);
			methodinfo.returntype = Reflect.getMetadata("design:returntype", target, key);
			methodinfo.opts = opts;

			pm.set(key, methodinfo);
			this._methodsMetaData.set(cls, pm);
		};
	}

	param(opts?: ParamOpts): ParameterDecorator {
		return (target, key, param_idx) => {
			if (typeof key === "symbol") {
				throw new Error(`decorator can not on a symbol`);
			}

			const cls: Function = target.constructor;
			const pm: MethodsMetaMap<MethodOpts, ParamOpts> = this._methodsMetaData.get(cls) || new Map();

			let methodinfo = pm.get(key as string);
			if (!methodinfo) methodinfo = new MethodInfo();
			methodinfo.paramopts.set(param_idx, opts);

			pm.set(key as string, methodinfo);
			this._methodsMetaData.set(cls, pm);
		};
	}

	bind<T>(cls: ClassOf<T>, src: any): T {
		return dis.bind.content(this, cls, src);
	}

	merge<T>(dest: T, srcs: any[], opts?: IMergeOptions<PropOpts>): T {
		return dis.merge.content(this, dest, srcs, opts);
	}
}

export class ContainerType {
	public readonly eletype: TypeValue;
	public readonly bindhint?: any;

	constructor(v: TypeValue, bindhint?: any) {
		this.eletype = v;
		this.bindhint = bindhint;
	}

	[inspect.custom]() {
		return `[${Object.getPrototypeOf(this).constructor.name} of ${inspect(this.eletype)}]`;
	}
}

export type TypeValue = ContainerType | Function;

export class ArrayType extends ContainerType {}

export class SetType extends ContainerType {}

export class MapType extends ContainerType {
	public readonly keytype: TypeValue;
	public readonly keybindhint?: any;

	constructor(k: TypeValue, v: TypeValue, bindhints?: { key?: any; value?: any }) {
		super(v, bindhints?.value);
		this.keytype = k;
		this.keybindhint = bindhints?.key;
	}

	[inspect.custom]() {
		return `[${Object.getPrototypeOf(this).constructor.name} of { k: ${inspect(
			this.keytype,
		)}, v: ${inspect(this.eletype)}]}`;
	}
}

export const containers = {
	array: (v: TypeValue, bindhint?: any) => new ArrayType(v, bindhint),
	set: (v: TypeValue, bindhint?: any) => new SetType(v, bindhint),
	map: (k: TypeValue, v: TypeValue, bindhints?: { key?: any; value?: any }) => new MapType(k, v, bindhints),
};
