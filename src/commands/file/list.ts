import { Command } from '@oclif/command'
import { listDir } from '@/api/file'
import Table, { Header } from 'tty-table';

export default class FileDownloadCommand extends Command {
    static args = [{
        name: 'remoteFile',
        required: false,
    }]

    async run(): Promise<void> {
        const { args } = this.parse(FileDownloadCommand)
        let { remoteFile } = args

        if (!remoteFile) {
            remoteFile = ''
        }

        const files = await listDir(remoteFile)

        const rows: string[][] = files.objects
            .map(it => ([
                `${it.path === '/' ? '' : it.path}/${it.name}`,
                it.type === 'file' ? '文件' : '文件夹',
                it.date,
            ]))

        const headers: Header[] = [{
            value: '文件',
            width: 50,
            formatter: str => str,
        }, {
            value: '类型',
            width: 10,
            formatter: str => str,
        }, {
            value: '修改时间',
            width: 30,
            formatter: str => str,
        }]

        const table = Table(headers, rows, {})

        this.log(table.render())
    }
}
