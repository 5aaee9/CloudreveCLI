import fetch from 'node-fetch'
import * as config from '@/utils/config'
import { serializeQuery } from '@/utils/web'
import { siteConfig } from '@/api/site'
import path from 'path'
import fs from 'fs'


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
        headers: {
            'content-type': 'application/json',
            'Cookie': config.get('site:session'),
        },
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

type Tree = {
    id: string
    name: string
    path: string
    pic: string
    size: number
    type: 'file' | 'dir'
    date: string
}

type ListResponse = {
    objects: Tree[]
    parent: string
}

async function listDir(dir: string): Promise<ListResponse> {
    const res = await fetch(`${config.get('site:url')}/api/v3/directory/${dir}`, {
        headers: {
            'content-type': 'application/json',
            'Cookie': config.get('site:session'),
        },
    })

    const data = await res.json()

    if (data.code !== 0) {
        throw new Error(data.msg)
    }

    return data.data
}

function isFile(item: Tree) {
    return item.type === 'file'
}


export async function findTreeById(filePath: string): Promise<Tree> {
    const {objects} = await listDir(path.dirname(filePath))

    const obj = objects.filter(isFile).filter(it => it.name === path.basename(filePath))

    const data = obj.pop()

    if (!data) {
        throw new Error('File not found')
    }

    return data
}

export async function getDownloadLink(fileId: string): Promise<string> {
    const res = await fetch(`${config.get('site:url')}/api/v3/file/download/${fileId}`, {
        headers: {
            'content-type': 'application/json',
            'Cookie': config.get('site:session'),
        },
        method: 'put',
    })

    const data = await res.json()

    if (data.code !== 0) {
        throw new Error(data.msg)
    }

    return data.data
}
