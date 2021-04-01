import fs from 'fs'
import path from 'path'

export async function *walk(dir: string): AsyncGenerator<string> {
    for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);

        if (d.isDirectory()) yield* walk(entry);
        else if (d.isFile()) yield entry;
    }
}

export async function exist(f: string): Promise<boolean> {
    return fs.promises.access(f)
        .then(() => true)
        .catch(() => false)
}
