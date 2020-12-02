import path from 'path'
import os from 'os'
import nconf from 'nconf'
import { ensureDir } from 'fs-extra'

const configPath = path.join(os.homedir(), '.config/cloudreve')
const configFile = path.join(configPath, 'config.json')

nconf.env()
nconf.file(configFile)

type JsonType = string | number | boolean

export function get<T>(key: string): T {
    return nconf.get(key)
}

export async function set(key: string, value: JsonType): Promise<void> {
    await ensureDir(configPath)
    nconf.set(key, value)

    return new Promise((res, reject) => {
        nconf.save(err => {
            if (err) {
                reject(err)
            } else {
                res()
            }
        })
    })
}
