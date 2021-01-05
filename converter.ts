const defaultPrecision = 5;
const defaultCharSet =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/~!@#$%^&*;=?<>[]:"{},`';
const regexSpecialChars = ".+*?^$()[]{}|\\";

/*const base0num = new Proxy(["42"], {
    get: function (t, p) {
        if (typeof p == "number") return "";
        return undefined;
    }
}) as unknown as string;*/

const invalidCharSetError = () =>
  new EvalError(
"Invalid character set. \
Character sets must not contain the minus sign, or the fractional dot. \
They must also not have duplicates.",
  );

const hasLowerCaseAndUpperCase = (input: string) => (
  // If the trimmed input set contains lowercase letters
  RegExp("[a-z]").test(input) &&
  // And uppercase letters
  RegExp("[A-Z]").test(input)
);

function isValidCharSet(charSet: string) {
  if (RegExp("[.-]").test(charSet)) return false;
  if (RegExp("(.).*\\1", "u").test(charSet)) return false;
  return true;
}

const splitArr = function <T>(arr: T[], splitIdx: number): T[][] {
  if (splitIdx < 0) return [arr, []];
  return arr.reduce((acc, curr, index) => {
    if (index < splitIdx) return [acc[0].concat(curr), acc[1]];
    else if (index > splitIdx) return [acc[0], acc[1].concat(curr)];
    return acc;
  }, [[], []] as T[][]);
};

function baseParse(
  input: string,
  inputBase: number,
  inputSet = defaultCharSet,
): number {
  if (!isValidCharSet(inputSet)) throw invalidCharSetError();
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
  if (inputBase == 0) {
    if (trimmedInput != "") throw new EvalError("Invalid input");
    return Infinity;
  }
  if (inputBase == 1) {
    if (RegExp(`^${trimmedInputSet[0]}*$`, "u").test(trimmedInput)) {
      return trimmedInput.length;
    } else throw new EvalError("Invalid input.");
  }
  const positions = trimmedInput.split("").map((char) => {
    if (char == ".") return -2;
    const { index } = Object.assign(
      {},
      { index: -1 },
      trimmedInputSet.match(RegExp(
        `${regexSpecialChars.includes(char) ? "\\" : ""}${char}`,
        regexpParams,
      )),
    );
    return index;
  });
  if (positions.some((val) => val == -1)) throw new EvalError("");
  const splitPos = splitArr(positions, positions.indexOf(-2));
  const summedParts = [
    splitPos[0].reduce(
      (total, curr, currIndex) => {
        return total +
          curr * (inputBase ** (splitPos[0].length - currIndex - 1));
      },
      0,
    ),
    splitPos[1].reduce(
      (total, curr, currIndex) => {
        return total + curr * (inputBase ** -(currIndex + 1));
      },
      0,
    ),
  ];
  return sign * summedParts.reduce((acc, curr) => acc + curr);
}

function recurBaseFracString(
  input: number,
  outputBase: number,
  outputSet: string,
  converted = "",
  places = defaultPrecision,
): string {
  if (input == 0 || converted.length > places) {
    return converted.slice(
      undefined,
      converted.match(
        `${regexSpecialChars.includes(outputSet[0]) ? "\\" : ""}${
          outputSet[0]
        }+$`,
      )?.index || undefined,
    );
  }
  const nextInput = input * outputBase;
  const currConversion = `${converted}${outputSet[Math.floor(nextInput)]}`;
  return recurBaseFracString(
    nextInput - Math.floor(nextInput),
    outputBase,
    outputSet,
    currConversion,
    places,
  );
}

function recurBaseString(
  input: number,
  outputBase: number,
  outputSet: string,
  converted = "",
): string {
  if (input == 0) return converted;
  const quotient = Math.floor(input / outputBase);
  const currConversion = outputSet[input % outputBase].concat(converted);
  return recurBaseString(quotient, outputBase, outputSet, currConversion);
}

function baseString(
  input: number,
  outputBase = 10,
  outputSet = defaultCharSet,
  places = defaultPrecision,
): string {
  if (!isValidCharSet(outputSet)) throw invalidCharSetError();
  /*if (outputBase == 0) return base0num;*/
  // Handling negatives
  const sign = input < 0 ? "-" : "";
  // Handling base 1 output
  if (outputBase == 1) {
    return `${sign}${outputSet[0].repeat(Math.floor(input))}`;
  }
  // Handling fractions
  const fractionalVal = recurBaseFracString(
    input - Math.floor(input),
    outputBase,
    outputSet,
    undefined,
    places,
  );
  if (Math.floor(input) != input) {
    return `${baseString(Math.floor(input), outputBase, outputSet)}${
      (fractionalVal == "")
        ? // Only add the dot if there is a fraction
          fractionalVal
        : ".".concat(fractionalVal)
    }`;
  }
  return `${sign}${recurBaseString(Math.abs(input), outputBase, outputSet)}`;
}

function baseConvert(
  input: string,
  inputBase: number,
  outputBase = 10,
  inputSet = defaultCharSet,
  outputSet = defaultCharSet,
  places = defaultPrecision,
): string {
  const inputNum = baseParse(input, inputBase, inputSet);
  return baseString(inputNum, outputBase, outputSet);
}

export { baseConvert, baseParse, baseString };
