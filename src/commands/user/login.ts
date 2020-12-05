import { Command, flags } from '@oclif/command'
import * as config from '@/utils/config'
import { ask } from '@/utils/cli'
import { doLogin } from '@/api/user'
import ora from 'ora'

export default class LoginCommand extends Command {
    static description = 'Login to cloudreve website'

    static examples = [
        '$ cloudreve-cli user:login https://example.com\n' +
        'Login to cloudreve running at https://example.com',

        '$ cloudreve-cli user:login -r\n' +
        'Re-login to localhost',
    ]

    static flags = {
        headless: flags.boolean({ char: 'h', description: 'Running login with headless mode' }),
        email: flags.string({ char: 'u', description: 'Login email' }),
        password: flags.string({ char: 'p', description: 'Login password' }),
        relogin: flags.boolean({ char: 'r', description: 'Re-login using local certification' }),
    }

    static args = [{
        name: 'siteUrl',
        required: false,
    }]

    async run(): Promise<null> {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const { args, flags } = this.parse(LoginCommand)

        if (!args.siteUrl && !flags.relogin) {
            this.log('Error: please set siteUrl')
            process.exit(1)
        }

        if (!flags.relogin) {
            await config.set('site:url', args.siteUrl)
            this.log('Warning: Password will store with clear-text!')

            if (flags.headless) {
                if (flags.email) {
                    await config.set('site:email', flags.email)
                } else {
                    this.log('Please use -u <email> to enter email')
                    process.exit(1)
                }

                if (flags.password) {
                    await config.set('site:password', flags.password)
                } else {
                    this.log('Please use -p <password> to enter password')
                    process.exit(1)
                }
            } else {
                await config.set('site:email', await ask('Input email: '))
                await config.set('site:password', await ask('Input password: ', {
                    hidden: true,
                }))
            }
        }

        const spinner = ora('登录中').start();

        const res = await doLogin()

        if (typeof res === 'string') {
            spinner.fail(<string>res)
        } else {
            spinner.succeed('登录成功')
        }

        return null
    }
}
