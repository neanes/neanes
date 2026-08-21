type BrowserFileSystemFileHandle = {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<File>;
  isSameEntry?(other: BrowserFileSystemFileHandle): Promise<boolean>;
  queryPermission?(descriptor?: { mode?: 'read' }): Promise<PermissionState>;
  requestPermission?(descriptor?: { mode?: 'read' }): Promise<PermissionState>;
};

type WindowWithFilePicker = Window & {
  showOpenFilePicker?: (options?: {
    excludeAcceptAllOption?: boolean;
    multiple?: boolean;
    types?: {
      accept: Record<string, string[]>;
      description?: string;
    }[];
  }) => Promise<BrowserFileSystemFileHandle[]>;
};

export interface BrowserRecentFile {
  id: string;
  name: string;
}

interface StoredBrowserRecentFile extends BrowserRecentFile {
  handle: BrowserFileSystemFileHandle;
  lastOpened: number;
}

const dbName = 'neanes-browser-recent-files';
const dbVersion = 1;
const storeName = 'recentFiles';
const maxRecentFiles = 20;

export class BrowserRecentFilesService {
  public isSupported() {
    return (
      window.isSecureContext &&
      'indexedDB' in window &&
      typeof (window as WindowWithFilePicker).showOpenFilePicker === 'function'
    );
  }

  public async showOpenFilePicker() {
    const [handle] =
      (await (window as WindowWithFilePicker).showOpenFilePicker?.({
        excludeAcceptAllOption: false,
        multiple: false,
        types: [
          {
            description: 'Neanes score files',
            accept: {
              'application/octet-stream': ['.byz', '.byzx'],
            },
          },
        ],
      })) ?? [];

    return handle ?? null;
  }

  public async list(): Promise<BrowserRecentFile[]> {
    if (!this.isSupported()) {
      return [];
    }

    const files = await this.getAll();
    return files
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .map(({ id, name }) => ({ id, name }));
  }

  public async add(handle: BrowserFileSystemFileHandle) {
    if (!this.isSupported()) {
      return;
    }

    const files = await this.getAll();
    const matchingFile = await this.findMatchingFile(files, handle);
    const recentFile = {
      id: matchingFile?.id ?? this.createId(),
      name: handle.name,
      handle,
      lastOpened: Date.now(),
    };

    await this.replaceAll([
      recentFile,
      ...files.filter((file) => file.id !== recentFile.id),
    ]);
  }

  public async open(id: string) {
    if (!this.isSupported()) {
      return null;
    }

    const recentFile = await this.get(id);

    if (recentFile == null) {
      return null;
    }

    const permitted = await this.requestReadPermission(recentFile.handle);

    if (!permitted) {
      return null;
    }

    try {
      const file = await recentFile.handle.getFile();
      await this.touch(recentFile);
      return { file, filePath: recentFile.name };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        await this.remove(id);
        return null;
      }

      throw error;
    }
  }

  private async requestReadPermission(handle: BrowserFileSystemFileHandle) {
    const descriptor = { mode: 'read' } as const;

    if (handle.queryPermission == null || handle.requestPermission == null) {
      return true;
    }

    if ((await handle.queryPermission(descriptor)) === 'granted') {
      return true;
    }

    return (await handle.requestPermission(descriptor)) === 'granted';
  }

  private async touch(recentFile: StoredBrowserRecentFile) {
    await this.put({ ...recentFile, lastOpened: Date.now() });
  }

  private async findMatchingFile(
    files: StoredBrowserRecentFile[],
    handle: BrowserFileSystemFileHandle,
  ) {
    for (const file of files) {
      try {
        if (await file.handle.isSameEntry?.(handle)) {
          return file;
        }
      } catch {
        // Fall back to name matching below if the stored handle is stale.
      }
    }

    return files.find((file) => file.name === handle.name);
  }

  private async get(id: string) {
    const db = await this.openDb();

    try {
      return await this.requestToPromise<StoredBrowserRecentFile | undefined>(
        db.transaction(storeName, 'readonly').objectStore(storeName).get(id),
      );
    } finally {
      db.close();
    }
  }

  private async getAll() {
    const db = await this.openDb();

    try {
      return await this.requestToPromise<StoredBrowserRecentFile[]>(
        db.transaction(storeName, 'readonly').objectStore(storeName).getAll(),
      );
    } finally {
      db.close();
    }
  }

  private async put(file: StoredBrowserRecentFile) {
    const db = await this.openDb();

    try {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(file);
      await this.transactionToPromise(transaction);
    } finally {
      db.close();
    }
  }

  private async remove(id: string) {
    const db = await this.openDb();

    try {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(id);
      await this.transactionToPromise(transaction);
    } finally {
      db.close();
    }
  }

  private async replaceAll(files: StoredBrowserRecentFile[]) {
    const db = await this.openDb();

    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();

      for (const file of files
        .sort((a, b) => b.lastOpened - a.lastOpened)
        .slice(0, maxRecentFiles)) {
        store.put(file);
      }

      await this.transactionToPromise(transaction);
    } finally {
      db.close();
    }
  }

  private openDb() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private requestToPromise<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private transactionToPromise(transaction: IDBTransaction) {
    return new Promise<void>((resolve, reject) => {
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  private createId() {
    return globalThis.crypto.randomUUID();
  }
}
