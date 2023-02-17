import DBG from "debug"
const debug = DBG("david-herron-node-course:notes-store")
const dbgerror = DBG("david-herron-node-course:error-store")

let _NotesStore

export async function useModel(model) {
    try {
        const NotesStoreModule = await import(`./notes-${model}.mjs`)
        const NotesStoreClass = NotesStoreModule.default
        _NotesStore = new NotesStoreClass()
        return _NotesStore
    } catch (e) {
        throw new Error(`No recognized NotesStore in ${model} because ${e}`)
    }
}

export {_NotesStore as NotesStore}
