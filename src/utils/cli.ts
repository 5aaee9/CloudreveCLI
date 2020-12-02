import readline from 'readline'

type AskOptions = {
    hidden?: boolean
}

export async function ask(question: string, options?: AskOptions): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    if (options?.hidden) {
        process.stdin.on('keypress', () => {
            // get the number of characters entered so far:
            const len = rl.line.length;
            // move cursor back to the beginning of the input:

            readline.moveCursor(process.stdout, -len, 0);
            // clear everything to the right of the cursor:
            readline.clearLine(process.stdout, 1);
            // replace the original input with asterisks:
            for (let i = 0; i < len; i += 1) {
                process.stdout.write('*');
            }
        });
    }

    return new Promise(res => rl.question(question, answer => {
        rl.close()
        res(answer)
    }))
}
