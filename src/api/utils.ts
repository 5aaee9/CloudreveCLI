import * as config from '@/utils/config'

export function getHeaders(): { [key: string]: string } {
    return {
        'content-type': 'application/json',
        'Cookie': config.get('site:session'),
    }
}
