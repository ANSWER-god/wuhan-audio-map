import type { CorpusItem } from '@/types'

const DB_NAME = 'wuhan-audio-corpus'
const STORE = 'clips'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('district', 'district', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      }),
  )
}

export async function getAllClips(): Promise<CorpusItem[]> {
  const clips = await tx<CorpusItem[]>('readonly', (store) => store.getAll() as IDBRequest<CorpusItem[]>)
  return clips.sort((a, b) => a.createdAt - b.createdAt)
}

export function saveClip(clip: CorpusItem): Promise<IDBValidKey> {
  return tx('readwrite', (store) => store.put(clip))
}

export function deleteClip(id: string): Promise<undefined> {
  return tx('readwrite', (store) => store.delete(id))
}
