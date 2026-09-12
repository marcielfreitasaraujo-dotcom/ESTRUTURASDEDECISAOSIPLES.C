import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface ObjectStorage {
  put(key: string, bytes: Buffer, contentType: string): Promise<string>;
  get(key: string): Promise<Buffer>;
}

class LocalDiskStorage implements ObjectStorage {
  constructor(private readonly root = path.join(process.cwd(), ".storage")) {}

  async put(key: string, bytes: Buffer): Promise<string> {
    const full = path.join(this.root, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
    return `/storage/${key}`;
  }

  async get(key: string): Promise<Buffer> {
    return readFile(path.join(this.root, key));
  }
}

export function getObjectStorage(): ObjectStorage {
  return new LocalDiskStorage();
}
