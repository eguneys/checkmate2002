import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

export const makePersistedNamespaced = <T>(def: T, name: string, version?: number) => makePersisted(createSignal(def), { name: `.checkmate2002.v${version??0}.${name}` })