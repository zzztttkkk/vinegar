import { reflection } from "../index";

const register = new reflection.MetaRegister<unknown, reflection.IBindPropOpts>(Symbol.for("testa"));

class Address {
	@register.prop()
	city: string = "";
}

class User {
	@register.prop()
	name: string = "";

	@register.prop({ type: reflection.ArrayOf(reflection.ArrayOf(Address)) })
	address: Address[][] = [];
}

const ins = register.bind(User, { name: "zxxx", address: [[{ city: "a" }, { city: "v" }]] });

console.log(JSON.stringify(ins, null, 2));
