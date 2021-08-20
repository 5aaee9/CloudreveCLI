import { Command, flags } from '@oclif/command'
import fsExtra from 'fs-extra'
import fs from 'fs'
import { createUploadRequest, uploadFile, mkdir, findTreeById, deleteTreeById, walkRemote, TreeType } from '@/api/file'
import ora from 'ora'
import { displayTraffic, parseTraffic  } from '@/utils/unit'
import path from 'path'
import { exist, walk } from '@/utils/files'

async function upload(localFile: string, remoteDir: string, overwriteFileName?: string): Promise<void> {
    const token = await createUploadRequest(localFile, remoteDir, overwriteFileName)

    const spinner = ora(`Uploading ${localFile}`).start()

    spinner.color = 'yellow'
    const display = (d: number) => displayTraffic(parseTraffic(d))

    try {
        await uploadFile(token, localFile, (total, cur) => {
            spinner.text = `Uploading ${localFile}: ${display(cur)} / ${display(total)}`
        })

        spinner.succeed()
    } catch (err) {
        spinner.fail(`Error ${localFile}:${err.message}`)
    }
}

export default class FileUploadCommand extends Command {
    static description = 'Upload file to cloudreve storage'

    static flags = {
        overwriteFileName: flags.string({
            char: 'o',
            description: 'Force overwrite upload fileName',
        }),
        reduce: flags.boolean({
            char: 'r',
            description: 'Uploading file reduce',
        }),
        sync: flags.boolean({
            char: 's',
            description: 'Sync mode will delete remote file if not persist in local',
        }),
    }

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

    async run(): Promise<void> {
        const { args, flags } = this.parse(FileUploadCommand)
        const { overwriteFileName, reduce, sync } = flags

        const { localFile } = args
        let { remoteDir } = args

        if (!remoteDir.startsWith('/')) {
            remoteDir = `/${remoteDir}`
        }

        // When remotedir not endswith slash and not the root dir
        if (remoteDir.endsWith('/') && remoteDir !== '/') {
            remoteDir = remoteDir.substr(0, remoteDir.length - 1)
        }

        if (!(await fsExtra.pathExists(localFile))) {
            this.log(`Error: ${localFile} is not exist`)
        }

        const pathInfo = await fs.promises.stat(localFile)

        if (pathInfo.isDirectory() && !reduce) {
            this.log(`${localFile} is a directory (not uploaded).`)
            process.exit(1)
        }

        if (reduce && overwriteFileName) {
            this.log('Overwrite filename is not support when reduce uploading.')
            process.exit(1)
        }

        if (pathInfo.isFile()) {
            await upload(localFile, remoteDir, overwriteFileName)
        } else {
            if (sync) {
                const walkItem = async (item: string, type: TreeType) => {
                    const file = item.substr(remoteDir.length)
                    const haveIt = await exist(path.join(localFile, file))

                    if (!haveIt) {
                        const tree = await findTreeById(item, type)

                        if (tree) {
                            await deleteTreeById(tree)
                            console.log(`Remote file/dir deleted: ${file}`)

                            return true
                        }
                    }

                    return false
                }

                await walkRemote(remoteDir, walkItem)
            }
            this.log('Uploading file')

            for await (const entry of walk(localFile)) {
                const absPath = path.resolve(entry).substr(path.resolve(localFile).length)

                const remoteEntryDir = path.join(remoteDir, path.dirname(absPath))

                if (!(await findTreeById(remoteEntryDir, 'dir'))) {
                    await mkdir(remoteEntryDir)
                }

                const remoteTree = await findTreeById(path.join(remoteDir, absPath), 'file')

                if (remoteTree) {
                    const fileStat = await fs.promises.stat(entry)

                    if (fileStat.size === remoteTree.size) {
                        this.log(`Skip file with same size: ${absPath}`)
                        continue
                    } else {
                        await deleteTreeById(remoteTree)
                    }
                }

                await upload(entry, remoteEntryDir)
            }
        }
    }
}
