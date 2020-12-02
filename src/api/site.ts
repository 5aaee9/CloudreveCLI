import fetch from 'node-fetch'
import * as config from '@/utils/config'

type RemotePolicy = {
    saveType: 'remote'
    maxSize: string
    allowedType: string[]
    upUrl: string
    allowSource: boolean
}

type Policy = RemotePolicy

type SiteConfig = {
    title: string
    user: {
        id: string
        nickname: string
        policy: Policy
    }
}

export async function siteConfig(): Promise<SiteConfig> {
    const res = await fetch(`${config.get('site:url')}/api/v3/site/config`, {
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
