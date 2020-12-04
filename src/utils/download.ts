import fetch from 'node-fetch'
import ora from 'ora'
import { displayTraffic, parseTraffic } from './unit'


export function downloadProgress(stream: NodeJS.ReadableStream, size: number, res: NodeJS.WritableStream): void {
    let current = 0

    const spinner = ora('Downloading file').start()

    spinner.color = 'yellow'

    stream.once('error', e => {
        spinner.text = `Download error: ${e}`
        spinner.warn()
    })

    const display = (d: number) => displayTraffic(parseTraffic(d))

    stream.on('data', chunk => {
        current += chunk.length
        spinner.text = `Downloaded: ${display(current)} / ${display(size)}`
        res.write(chunk)
    })

    stream.on('end', () => {
        spinner.succeed()
    })
}

export async function downloadFile(url: string, fileStream: NodeJS.WritableStream, size: number): Promise<null> {
    const download = await fetch(url, {
        method: 'get',
    })

    downloadProgress(download.body, size, fileStream)

    return new Promise((res, rej) => {
        download.body.once('finish', res)
        download.body.once('error', rej)
    })
}
