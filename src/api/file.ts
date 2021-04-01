import fetch from 'node-fetch'
import * as config from '@/utils/config'
import { serializeQuery } from '@/utils/web'
import { siteConfig } from '@/api/site'
import path from 'path'
import fs from 'fs'
import { getHeaders } from './utils'


type UploadToken = {
    token: string
    policy: string
}

export async function createUploadRequest(fileName: string, filePath: string): Promise<UploadToken> {
    const query = serializeQuery({
        path: filePath,
        size: 50,
        name: fileName,
        type: 'remote',
    })

    const res = await fetch(`${config.get('site:url')}/api/v3/file/upload/credential?${query}`, {
        headers: getHeaders(),
    })

    const body = await res.json()

    if (body.code !== 0) {
        throw new Error(body.msg)
    }

    return body.data
}


export async function uploadFile(
    token: UploadToken, file: string,
    progressHook?: (total: number, cur: number) => void): Promise<null> {
    const {policy} = (await siteConfig()).user

    if (policy.saveType !== 'remote') {
        throw new Error('Upload only support "remote" now.')
    }

    const stream = fs.createReadStream(file)
    const fileInfo = await fs.promises.stat(file)
    let cur = 0;

    if (progressHook) {
        stream.on('data', buffer => {
            cur += buffer.length
            progressHook(fileInfo.size, cur)
        })
    }

    const res = await fetch(`${policy.upUrl}`, {
        headers: {
            'x-filename': encodeURIComponent(path.basename(file)),
            'x-policy': token.policy,
            'authorization': token.token,
            'Content-Type': 'application/octet-stream',
        },
        method: 'POST',
        body: stream,
        timeout: 0,
    })

    const data = await res.json()

    if (data.code !== 0) {
        throw new Error(data.msg)
    }

    return null
}

type TreeType = 'file' | 'dir'

type Tree = {
    id: string
    name: string
    path: string
    pic: string
    size: number
    type: TreeType
    date: string
}

type ListResponse = {
    objects: Tree[]
    parent: string
}

export async function listDir(dir: string): Promise<ListResponse> {
    const res = await fetch(`${config.get('site:url')}/api/v3/directory${encodeURIComponent(dir)}`, {
        headers: getHeaders(),
    })

    const data = await res.json()

    if (data.code !== 0) {
        throw new Error(data.msg)
    }

    return data.data
}

export async function findTreeById(filePath: string, type?: TreeType): Promise<Tree | null> {
    try {
        console.log(filePath)
        const {objects} = await listDir(path.dirname(filePath))

        console.log(objects)
        const obj = objects
            .filter(it => (type ? it.type === type : true))
            .filter(it => it.name === path.basename(filePath))

        const data = obj.pop()

        if (!data) {
            return null
        }

        return data
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function getDownloadLink(fileId: string): Promise<string> {
    const res = await fetch(`${config.get('site:url')}/api/v3/file/download/${fileId}`, {
        headers: getHeaders(),
        method: 'put',
    })

    const data = await res.json()

    if (data.code !== 0) {
        throw new Error(data.msg)
    }

    return data.data
}

export async function deleteTreeById(tree: Tree): Promise<void> {
    const res = await fetch(`${config.get('site:url')}/api/v3/object`, {
        headers: getHeaders(),
        method: 'delete',
        body: JSON.stringify({
            items: tree.type === 'file' ? [tree.id] : [],
            dirs: tree.type === 'dir' ? [tree.id] : [],
        }),
    })

    const data = await res.json()

    if (data.code !== 0) {
        throw new Error(data.msg)
    }
}

export async function mkdir(dir: string): Promise<void> {
    const doc = await findTreeById(path.dirname(dir), 'dir')

    console.log(path.dirname(dir))
    console.log(doc)
    if (path.dirname(dir) !== '/' && !doc) {
        await mkdir(path.dirname(dir))
    }

    const res = await fetch(`${config.get('site:url')}/api/v3/directory`, {
        headers: getHeaders(),
        method: 'put',
        body: JSON.stringify({path: dir}),
    })

    const data = await res.json()

    console.log(data)

    if (data.code !== 0) {
        throw new Error(data.msg)
    }
}
