import 'reflect-metadata'

import flush from '@oclif/command/flush'
import errorHandle from '@oclif/errors/handle'

import { run } from '@oclif/command'

async function main() {
    try {
        await run().then(flush)
    } catch (err) {
        errorHandle(err)
    }
}

main()
