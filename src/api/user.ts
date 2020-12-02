import fetch from 'node-fetch'
import * as config from '@/utils/config'

type UserProfile = {
    anonymous: boolean
    avatar: string
    id: string
    nickname: string
}

export async function doLogin(): Promise<UserProfile | string> {
    const res = await fetch(`${config.get('site:url')}/api/v3/user/session`, {
        method: 'POST',
        body: JSON.stringify({
            captchaCode: '',
            Password: config.get('site:password'),
            userName: config.get('site:email'),
        }),
        headers: {
            'content-type': 'application/json',
        },
    })

    const {code, data, msg} = await res.json()

    if (code !== 0) {
        return msg
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await config.set('site:session', res.headers.get('set-cookie')!)

    return data
}
