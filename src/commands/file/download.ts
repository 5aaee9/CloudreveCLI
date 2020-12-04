import { Command } from '@oclif/command'
import { findTreeById, getDownloadLink } from '@/api/file'
import { downloadFile } from '@/utils/download'
import fs from 'fs'
import path from 'path'

export default class FileUploadCommand extends Command {
    static description = 'Download file from cloudreve.'

    static args = [{
        name: 'remoteFile',
        required: true,
    }]

    async run(): Promise<null> {
        const { args } = this.parse(FileUploadCommand)
        const { remoteFile } = args

        const tree = await findTreeById(remoteFile)
        const url = await getDownloadLink(tree.id)

        const stream = fs.createWriteStream(path.basename(remoteFile))

        await downloadFile(url, stream, tree.size)
        return null
    }
}
