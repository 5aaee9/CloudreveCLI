import { Command } from '@oclif/command'
import fsExtra from 'fs-extra'
import path from 'path'
import { createUploadRequest, uploadFile } from '@/api/file'
import ora from 'ora'
import { displayTraffic, parseTraffic  } from '@/utils/unit'

export default class FileUploadCommand extends Command {
    static description = 'Upload file to cloudreve storage'

    static examples = [
        '$ cloudreve-cli file:upload ./file.data /Remote/Dir\n' +
        'Upload localhost file.data to /Remote/Dir',
    ]

    static args = [{
        name: 'localFile',
        required: true,
    }, {
        name: 'remoteDir',
        required: true,
    }]

    async run(): Promise<null> {
        const { args } = this.parse(FileUploadCommand)

        const { localFile, remoteDir } = args

        if (!(await fsExtra.pathExists(localFile))) {
            this.log(`Error: ${localFile} is not exist`)
        }

        const fileName = path.basename(localFile)
        const token = await createUploadRequest(fileName, remoteDir)

        const spinner = ora('Uploading file').start()

        spinner.color = 'yellow'
        const display = (d: number) => displayTraffic(parseTraffic(d))

        try {
            await uploadFile(token, localFile, (total, cur) => {
                spinner.text = `Uploading: ${display(cur)} / ${display(total)}`
            })

            spinner.succeed()
        } catch (err) {
            spinner.fail()
        }

        return null
    }
}
