const TransferPreLevel = 1024

// eslint-disable-next-line no-shadow
export enum TrafficUnit {
    B = 1,
    KB = TransferPreLevel,
    MB = TransferPreLevel ** 2,
    GB = TransferPreLevel ** 3,
    TB = TransferPreLevel ** 4,
}

export function unitToString(unit: TrafficUnit): string {
    switch (unit) {
        case TrafficUnit.KB:
            return 'KiB'
        case TrafficUnit.MB:
            return 'MiB'
        case TrafficUnit.GB:
            return 'GiB'
        case TrafficUnit.TB:
            return 'TiB'
        default:
            return 'B'
    }
}

type Traffic = {
    unit: TrafficUnit,
    value: number,
}

function packTraffic(value: number, unit: TrafficUnit): Traffic {
    return { value, unit }
}

export function parseTraffic(b: number): Traffic {
    const set: TrafficUnit[] = [
        TrafficUnit.B, TrafficUnit.KB, TrafficUnit.MB,
        TrafficUnit.GB, TrafficUnit.TB]

    for (const [index, unit] of set.entries()) {
        if (b <= unit) {
            if (index === 0) {
                return packTraffic(b, TrafficUnit.B)
            }

            const p: TrafficUnit = set[index - 1]

            return packTraffic(b / p, p)
        }
    }

    return packTraffic(b / TrafficUnit.TB, TrafficUnit.TB)
}

export function unpackTraffic(traffic: Traffic): number {
    return traffic.value * (traffic.unit / TransferPreLevel)
}

export function displayRound(input: number): number {
    if (input > 1000) {
        return Math.round(input * 10) / 10
    }

    return Math.round(input * 100) / 100
}

export function displayTraffic(data: Traffic): string {
    return `${displayRound(data.value)} ${unitToString(data.unit)}`
}
