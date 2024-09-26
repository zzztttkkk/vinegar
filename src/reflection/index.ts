import { containers } from "./meta_register";

export {
	IsClass,
	IsSubClassOf,
	IsPureObject as IsPureDataObject,
	classof,
} from "./classes";
export {
	PropInfo,
	MetaRegister,
	metainfo,
	containers,
	type TypeValue,
} from "./meta_register";

export { bind, type IBindPropOpts } from "./bind";
export { merge, type IMergePropOpts } from "./merge";

export const ArrayOf = containers.array;
export const SetOf = containers.set;
export const MapOf = containers.map;
export const ObjectOf = containers.object;
