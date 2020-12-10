import { languageMap, countryMap } from "./localization/LanguageMap";
import { PolyDataManager3 } from "./polybrain2/PolyDataManager3";

export class Globals
{
  // stub for Polyup's database manager
  static DataManager : PolyDataManager3;

  static lookupLanguageCode(langName: string) {
    for (var key in languageMap) {
      if (languageMap[key] == langName) {
        return key;
      }
    }
    return undefined;
  }
}
