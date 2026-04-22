import type { RawTextTagMarker } from './curriculum-generation.server';

export const COURSE_RAW_TEXT_TAG = '--endmodule--';
export const UNIT_RAW_TEXT_TAG = '--endunit--';
export const DEFAULT_MODULE_WORD_STYLE = 'module x unit 1';

const normalizeForTokenSearch = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const hasOrderedTokens = (text: string, expectedTokens: string[]) => {
  const haystackTokens = normalizeForTokenSearch(text);
  let cursor = 0;

  for (const token of expectedTokens) {
    const nextIndex = haystackTokens.indexOf(token, cursor);

    if (nextIndex === -1) {
      return false;
    }

    cursor = nextIndex + 1;
  }

  return true;
};

const countOrderedTokenPair = (
  text: string,
  firstToken: string,
  secondToken: string,
) => {
  const tokens = normalizeForTokenSearch(text);
  let count = 0;

  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (tokens[index] === firstToken && tokens[index + 1] === secondToken) {
      count += 1;
    }
  }

  return count;
};

const findNextOrderedTokenPairIndex = (
  text: string,
  firstToken: string,
  secondToken: string,
) => {
  const matcher = new RegExp(
    `\\b${firstToken}\\b[\\s\\S]{0,80}?\\b${secondToken}\\b`,
    'i',
  );
  const match = text.match(matcher);
  return match?.index ?? -1;
};

export const stripExistingRawTextTags = (rawText: string) =>
  rawText.replaceAll(COURSE_RAW_TEXT_TAG, '').replaceAll(UNIT_RAW_TEXT_TAG, '');

export const insertMarkersIntoRawText = (
  rawText: string,
  markers: RawTextTagMarker[],
): string => {
  const validMarkers = markers
    .filter(
      (marker) =>
        Number.isInteger(marker.position) &&
        marker.position >= 0 &&
        marker.position <= rawText.length &&
        (marker.tag === COURSE_RAW_TEXT_TAG ||
          marker.tag === UNIT_RAW_TEXT_TAG),
    )
    .sort((a, b) => b.position - a.position);

  let nextRawText = rawText;

  validMarkers.forEach((marker) => {
    const prefix = nextRawText.slice(0, marker.position).replace(/\s+$/, '');
    const suffix = nextRawText.slice(marker.position).replace(/^\s+/, '');
    nextRawText = `${prefix}\n${marker.tag}\n${suffix}`;
  });

  return nextRawText;
};


const getModuleMarkerPosition = (rawText: string, moduleWordStyle: string, lookupDistance: number, moduleNumber: number): RawTextTagMarker | undefined => {
  const mregx = new RegExp(`\\b${moduleWordStyle.toLowerCase().replace("x", moduleNumber.toString())}\\b`, 'gi')
  const moduleMatches = rawText.matchAll(
    mregx,
  );

  for (const match of moduleMatches) {
    const headingStart = match.index

    if (headingStart <= 0) {
      continue;
    }

    const windowText = rawText.slice(headingStart, headingStart + lookupDistance);

    const unitOnePairIndex = findNextOrderedTokenPairIndex(
      windowText,
      'unit 1',
      '1.0'
    );

    const unitOnePairSecondIndex = findNextOrderedTokenPairIndex(
      windowText,
      'unit 1',
      '1.1'
    );

    if (unitOnePairIndex === -1 && unitOnePairSecondIndex === -1) {
      continue;
    }

    return {
      position: headingStart,
      tag: COURSE_RAW_TEXT_TAG,
    }
  }
}

const getUnitMarkerPosition = (rawText: string, unitNumber: number, moduleIndex: number): RawTextTagMarker | undefined => {
  const unitStyle = `unit ${unitNumber}`
  const mregx = new RegExp(`\\b${unitStyle}\\b`, 'gi')
  const moduleMatches = rawText.matchAll(
    mregx,
  );

  for (const match of moduleMatches) {
    const headingStart = match.index

    if (headingStart <= 0) {
      continue;
    }

    const windowText = rawText.slice(headingStart, headingStart + 150);

    const subunitRegex = /\b(\d+\.\d+)\s+([^0-9]+)/gim;
    // const unitRegex = new RegExp(`unit\s+(?!${unitNumber}\b)(\d+):?\s*([^U\d]+)`, 'gim')
    const unitRegex = /unit\s+(\d+):?\s*([^U\d]+)/gi;
    // const subUnitPairIndex = findNextOrderedTokenPairIndex(
    //   windowText,
    //   unitStyle,
    //   '1.0'
    // );

    // const subUnitPairSecondIndex = findNextOrderedTokenPairIndex(
    //   windowText,
    //   unitStyle,
    //   `${unitNumber}.1`
    // );

    // if (subUnitPairIndex === -1 && subUnitPairSecondIndex === -1) {
    //   console.log("NO MARKER unit ", unitNumber, windowText)
    //   continue;
    // }

    const matchesOtherUnit = windowText.slice(7).match(unitRegex)
    if (!windowText.match(subunitRegex) || matchesOtherUnit) {
      continue;
    }

    return {
      position: headingStart + moduleIndex,
      tag: UNIT_RAW_TEXT_TAG,
    }
  }
}

const buildUnitMarkers = (rawText: string, moduleIndex: number): RawTextTagMarker[] => {
  const markers: RawTextTagMarker[] = [];
  for (let unitNumber = 2; unitNumber < 10; unitNumber++) {
    const marker = getUnitMarkerPosition(rawText, unitNumber, moduleIndex);
    if (marker) {
      markers.push(marker);
    }
  }
  return markers;
};

const buildModuleMarkers = (
  rawText: string,
  moduleWordStyle: string,
  lookupDistance: number = 1000,
): RawTextTagMarker[] => {
  const moduleMarkers: RawTextTagMarker[] = [];
  const unitMarkers: RawTextTagMarker[] = [];
  for (let moduleNumber = 1; moduleNumber < 10; moduleNumber++) {
    const moduleMarker = getModuleMarkerPosition(rawText, moduleWordStyle, lookupDistance, moduleNumber);
    if (moduleMarker) {
      moduleMarkers.push(moduleMarker);
      const moduleUnitMarkers = buildUnitMarkers(rawText.slice(moduleMarker.position, rawText.length + 1), moduleMarker.position);
      if (moduleUnitMarkers) {
        unitMarkers.push(...moduleUnitMarkers);
      }
    }
  }
  return [...moduleMarkers, ...unitMarkers];
};


export const buildHeuristicRawTextMarkers = (
  rawText: string,
  moduleWordStyle: string = DEFAULT_MODULE_WORD_STYLE,
  lookupDistance: number = 1000,
): RawTextTagMarker[] => {
  const markers = buildModuleMarkers(rawText, moduleWordStyle, lookupDistance);

  return markers
};

export const markRawText = (
  rawText: string,
  moduleWordStyle: string = DEFAULT_MODULE_WORD_STYLE,
  lookupDistance: number = 1000,
) => {
  const markers = buildHeuristicRawTextMarkers(rawText, moduleWordStyle, lookupDistance);
  return insertMarkersIntoRawText(rawText, markers);
};


export function markRawText2(rawText: string, moduleWordStyle: string = "module x unit 1"): string {
  const moduleRegex = /(?=(\s*)Module\s+\d+\b)/gi
  // --- UNITS ---
  const unitRegex = /Unit\s+(\d+):?\s*([^U\d]+)/gi;
  const unit1Regex = /\bUnit\s+(1)\b/gi;
  const subunitRegex = /\b(\d+\.\d+)\s+([^0-9]+)/g;
  const maxModules = 6
  const maxUnit = 8


  let taggedRawText = rawText

  for (let i = 1; i <= maxModules; i++) {
    const word = moduleWordStyle.replace("x", i.toString())
    const mregx = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = [...rawText.matchAll(mregx)]
    let counter = 0
    // console.log("MATCHES", matches.length, i)
    while (counter < matches.length) {
      const startIndex = matches[counter].index
      const endIndex = counter + 1 <= matches.length - 1 ? matches[counter + 1].index : rawText.length
      const newRawText = taggedRawText.substring(startIndex, endIndex)
      if (!!newRawText.match(subunitRegex)?.length) {
        taggedRawText = taggedRawText.replace(newRawText, "--modulestart--" + newRawText)

        // const moduleRawText = rawText.substring(startIndex, rawText.length)
        // const firstPart = moduleRawText.substring(0, startIndex)
        // let taggedUnitText = moduleRawText
        // for (let i = 1; i <= maxUnit; i++) {
        //   const word = `unit ${i}`
        //   const mregx = new RegExp(`\\b${word}\\b`, 'gi')
        //   const unitMatches = [...moduleRawText.matchAll(mregx)]
        //   if (unitMatches.length) {
        //     let unitCounter = 0
        //     while (unitCounter < unitMatches.length) {
        //       const startIndex = unitMatches[unitCounter].index
        //       const endIndex = unitCounter + 1 <= unitMatches.length - 1 ? unitMatches[unitCounter + 1].index : moduleRawText.length
        //       const newRawText = moduleRawText.substring(startIndex, endIndex)
        //       if (newRawText.match(subunitRegex)) {
        //         taggedUnitText = insertAt(taggedUnitText, startIndex, "--unitstart--")
        //         break
        //       }
        //       unitCounter++
        //     }
        //   }
        // }
        // taggedRawText = firstPart + taggedUnitText
        console.log(newRawText.substring(0, 200), "newRawText", counter, "TOTAL", newRawText.length)
        break
      }
      counter++
    }
    // console.log("MATCHES", matches, i)
  }
  return taggedRawText
}
