
type Obj = { [key: string]: any }

export function parseQuery(query: string): Obj {
    if (query.startsWith('?')) {
        query = query.substr(1)
    }

    const result = {}

    for (const item of query.split('&')) {
        const [key, value] = item.split('=')

        result[key] = value
    }

    return result
}

export function serializeQuery(query: Obj): string {
    return Object.keys(query).map(it => `${it}=${encodeURIComponent(query[it])}`).join('&')
}
