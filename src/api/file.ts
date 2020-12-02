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
