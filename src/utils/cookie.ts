export type Cookie = Record<string, string>

export function parseCookie(cookie: string): Record<string, string> {
    return cookie.split(', ')
        .map(it => it.split('; ')[0].trim().split('='))
        .filter(it => it[1])
        .reduce((pre, cur) => {
            const [k, v] = cur

            pre[k] = v
            return pre
        }, {})
}

export function stringCookie(cookie: Record<string, string>): string {
    return Object.keys(cookie).map(it => `${it}=${cookie[it]}`)
        .join('; ')
}
