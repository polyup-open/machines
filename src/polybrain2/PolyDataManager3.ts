// stub for PolyDataManager3 from main project.

import { PolyInfo } from "./../polybrain/PolyInfo";
import { Progress } from "./../polybrain/Progress";

export abstract class PolyDataManager3
{
  public userId : number;

  /**
   * adds a tag to a machine or chip
   * @param info the TagInfo to upload
   * @param endpoint "Machines" or "Chips" to add the tag to a machine or a chip, respectively
   */
  public abstract addTag(
      info: PolyInfo.TagInfo,
      endpoint: string,
      callback: (info: PolyInfo.TagInfo) => void
    ) : void;

  /**
   * removes a tag from a machine or chip
   * @param info the TagInfo to remove
   * @param endpoint "Machines" or "Chips" to remove the tag from a machine or a chip, respectively
   */
  public abstract removeTag(
    info: PolyInfo.TagInfo,
    endpoint: string,
    callback: (count: number) => void
  ) : void;

  /**
   * uploads a machine to the database
   * @param info the MachineInfo to be uploaded
   */
  public abstract uploadMachine(
    info: PolyInfo.MachineInfo,
    callback: (target: PolyInfo.MachineInfo, xhr: XMLHttpRequest) => void
  ) : void;

  /**
   * uploads a chip to the database
   * @param info the Chip to be uploaded
   */
  public abstract uploadChip(
    info: PolyInfo.Chip,
    callback: (target: PolyInfo.Chip, xhr: XMLHttpRequest) => void
  ) : void;


  /**
   * uploads a component to the database
   * @param info the ComponentInfo to be uploaded
   */
  public abstract uploadComponent(
    info: PolyInfo.ComponentInfo,
    callback: (target: PolyInfo.ComponentInfo, xhr: XMLHttpRequest) => void
  ) : void;
}
