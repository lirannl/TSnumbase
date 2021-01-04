const defaultCharSet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/~!@#$%^&*;=?<>[]:\"{},`";

const invalidCharSetError = new EvalError("Invalid character set. \
Character sets must not contain the minus sign, or the fractional dot. \
They must also not have duplicates.");

const hasLowerCaseAndUpperCase = (input: string) => (
    // If the trimmed input set contains lowercase letters
    RegExp("[a-z]").test(input)
    &&
    // And uppercase letters
    RegExp("[A-Z]").test(input)
);

function isValidCharSet(charSet: string) {
    if (RegExp("[.-]").test(charSet)) return false;
    if (RegExp("(.).*\\1").test(charSet)) return false;
    return true;
}

export function baseParse(input: string, inputBase: number, inputSet = defaultCharSet): number {
    if (!isValidCharSet(inputSet)) throw invalidCharSetError;
    const trimmedInputSet = inputSet.slice(undefined, inputBase);
    const regexpParams = (() => {
        if (hasLowerCaseAndUpperCase(trimmedInputSet)) return undefined;
        return "i";
    })();
    const sign = input[0] == "-" ? -1 : 1;
    const trimmedInput = (() => {
        if (input[0] == "-") return input.slice(1);
        return input;
    })();
    const positions = trimmedInput.split("").map(char => {
        const { index } = trimmedInputSet.match(RegExp(char, regexpParams)) || {};
        if (!index) throw new EvalError("Invalid input.");
        return index;
    });
    const lastPositionsIndex = positions.length - 1;
    return positions.reduceRight(
        (total, curr, currIndex) => {
            const indexFromEnd = lastPositionsIndex - currIndex;
            return total + curr * (inputBase ** indexFromEnd);
        }
        , 0) * sign;
}

function recurBaseString(input: number, outputBase: number, outputSet: string, converted = ""): string {
    if (input == 0) return converted;
    const quotient = Math.floor(input / outputBase);
    const currConversion = outputSet[input % outputBase].concat(converted);
    return recurBaseString(quotient, outputBase, outputSet, currConversion);
}

export function baseString(input: number, outputBase = 10, outputSet = defaultCharSet): string {
    if (!isValidCharSet(outputSet)) throw invalidCharSetError;
    const sign = input < 0 ? "-" : "";
    return sign.concat(recurBaseString(Math.abs(input), outputBase, outputSet));
}

export function baseConvert(input: string, inputBase: number, outputBase = 10, inputSet = defaultCharSet, outputSet = defaultCharSet): string {
    const inputNum = baseParse(input, inputBase, inputSet);
    return baseString(inputNum, outputBase, outputSet);
}