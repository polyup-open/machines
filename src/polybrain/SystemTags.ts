import { languageMap } from "../localization/LanguageMap";

export function getMachineLanguages(
  machineStrings: StringDict,
  chipStringses: StringDict[]
): string[] {
  var languages: Set<string> = new Set<string>();

  if (machineStrings) {
    for (var key in machineStrings) {
      if (languageMap[key]) {
        languages.add(languageMap[key]);
      }
    }
  }

  if (chipStringses) {
    for (var chipStrings of chipStringses) {
      if (chipStrings) {
        for (var key in chipStrings) {
          if (languageMap[key]) {
            languages.add(languageMap[key]);
          }
        }
      }
    }
  }

  return [...languages];
}

export function getSystemTags(
  machineStrings: StringDict,
  chipStringses: StringDict[],
  machineVersion: number
) {
  var tags = getMachineLanguages(machineStrings, chipStringses);

  tags.push("v" + (machineVersion || 1));

  // TODO: add author-team tags once machines can be associated with a team

  return tags;
}
