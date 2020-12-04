import { Command } from '@oclif/command'
import { findTreeById, deleteTreeById } from '@/api/file'
import ora from 'ora'

export default class FileDeleteCommand extends Command {
    static description = 'Delete file from cloudreve.'

    static args = [{
        name: 'remoteFile',
        required: true,
    }]

    async run(): Promise<void> {
        const { args } = this.parse(FileDeleteCommand)
        const { remoteFile } = args
        const spinner = ora('Deleting tree').start()
        const tree = await findTreeById(remoteFile)

        await deleteTreeById(tree)

        spinner.succeed('Delete success')
    }
}
