import { Cookie, parseCookie, stringCookie } from '@/utils/cookie'
import fetch from 'node-fetch'

export async function getSession(u: string, share: string, password: string | null): Promise<Cookie> {
    const res = await fetch(`${u}/api/v3/share/info/${share}${password !== null ? `?password=${password}` : ''}`)

    const body = await res.json()

    if (body.data.locked) {
        throw new Error('Request share session error, may wrong password')
    }

    return parseCookie(res.headers.get('set-cookie') as string)
}

export async function listDir(u: string, share: string, session: Cookie, dir: string): Promise<any> {
    const res = await fetch(`${u}/api/v3/share/list/${share}${encodeURIComponent(dir)}`, {
        headers: {
            cookie: stringCookie(session),
        },
    })

    const data = await res.json()

    return data.data
}

export async function requestDownload(u: string, share: string, session: Cookie, file: string): Promise<string> {
    const res = await fetch(`${u}/api/v3/share/download/${share}?path=${file}`, {
        headers: {
            cookie: stringCookie(session),
        },
        method: 'put',
    })

    return (await res.json()).data
}
