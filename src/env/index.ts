import { inspect } from "bun";
import { metainfo, MetaRegister, type IBindPropOpts } from "../reflection";
import { Import } from "../internal";
import "../internal/globals/transform";

interface IProp extends IBindPropOpts {
	key?: string;
	optional?: boolean;
	transformhint?: any;

	desc?: string;
	hideindoc?: boolean;
}

interface ICls {
	prefix?: boolean | string;
}

const register = new MetaRegister<ICls, IProp>(Symbol.for("env"));

export const EnvClass = register.cls.bind(register);
export const EnvProp = register.prop.bind(register);

const upperenvs = {} as { [k: string]: string | undefined };
for (const [k, v] of Object.entries(Bun.env)) {
	upperenvs[k.toUpperCase()] = v;
}

export const DEBUG = transform(upperenvs.DEBUG, Boolean, { directly: false });

export function env<T>(cls: ClassOf<T>): T {
	const meta = metainfo(register, cls);
	const clsopt = meta.cls();
	const props = meta.props();
	if (!props || props.size < 1) {
		throw new Error(`empty props for ${inspect(cls)}`);
	}

	const ins = new cls();
	for (const [k, prop] of props) {
		if (prop.accessorstatus && !prop.accessorstatus.canset) {
			continue;
		}

		const _type = prop.opts?.type || prop.designtype;
		let bv: any;
		const trnas = _type[Symbol.transform];
		if (trnas) {
			let key = prop.opts?.key || k;
			if (clsopt?.prefix) {
				if (typeof clsopt.prefix === "string") {
					key = `${clsopt.prefix}${key}`;
				} else {
					key = `${cls.name}${key}`;
				}
			}
			const val = upperenvs[key.toUpperCase()];
			if (val == null) {
				if (prop.opts?.optional) {
					continue;
				}
				throw new Error(`missing required key: ${k}`);
			}
			bv = transform(val, _type, prop.opts?.transformhint);
		} else {
			bv = env(_type);
		}
		Reflect.set(ins as any, k, bv);
	}
	return ins;
}

export function envdoc<T>(cls: ClassOf<T>): string {
	return ``;
}

if (Import.ismain(import.meta)) {
	@EnvClass({ prefix: true })
	class Server {
		@EnvProp({ optional: true })
		addr: string = "127.0.0.1";

		@EnvProp({ optional: true })
		port: number = 8080;

		static [Symbol.transform](v: string): Server {
			const ins = new Server();
			console.log(v);
			return ins;
		}
	}

	class EnvSettings {
		@EnvProp({ optional: true })
		debug: boolean = false;

		@EnvProp({ key: "ServerAddrPair" })
		server: Server = new Server();
	}

	console.log(env(EnvSettings));
}
