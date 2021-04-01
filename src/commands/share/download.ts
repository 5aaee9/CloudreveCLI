import { Command } from '@oclif/command'
import { downloadFile } from '@/utils/download'
import fs from 'fs'
import path from 'path'
import { URL } from 'url'
import { getSession, listDir, requestDownload } from '@/api/share'

export default class ShareFileDownloadCommand extends Command {
    static description = 'Download file from cloudreve share file.'

    static args = [{
        name: 'remoteUrl',
        required: true,
    }, {
        name: 'remoteFile',
        required: true,
    }]

    async run(): Promise<void> {
        const { args } = this.parse(ShareFileDownloadCommand)
        const { remoteUrl } = args
        let { remoteFile } = args

        if (!remoteFile.startsWith('/')) {
            remoteFile = `/${remoteFile}`
        }

        const url = new URL(remoteUrl)

        if (!url.pathname.startsWith('/s/')) {
            this.log('Not a valid share link.')
            this.exit(1)
        }

        let password: string | null = null;

        if (url.searchParams.has('password')) {
            password = url.searchParams.get('password') as string
        }

        const shareName = url.pathname.substr(3)
        const session = await getSession(url.origin, shareName, password)

        const dir = await listDir(url.origin, shareName, session, path.dirname(remoteFile))
        const result = dir.objects.filter(it => it.name === path.basename(remoteFile))

        if (result.length === 0) {
            this.log('File not found')
            this.exit(1)
        }

        const [tree] = result

        const dUrl = await requestDownload(url.origin, shareName, session, remoteFile)

        const stream = fs.createWriteStream(path.basename(remoteFile))

        await downloadFile(dUrl, stream, tree.size)
    }
}
