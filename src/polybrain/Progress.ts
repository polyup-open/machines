import {PuzzleDefinitionJson} from "./../workspace/PuzzleData";
import {PolyInfo} from "./PolyInfo";
import {BlockDefinition} from "../workspace/PuzzleData";
import {Polyscript} from "../polyscript/Polyscript";

export namespace Progress
{

  export class MachineProgress
  {
    userAccountId:number = -1;
    machineId:number = -1;
    completed:boolean = false;
    /**root board id?*/
    data:string = null;
    parsedData? : { goalsCompleted : boolean} = null;
    sessionUuid:string = null;
    id:number = -1;
    updatedAt:string = "";
    moddingData: { position: PolyInfo.transform3D };

    static parseModdingData(progress : MachineProgress)
    {
      if (typeof progress.moddingData == "string")
      {
        try {
          progress.moddingData = JSON.parse(progress.moddingData);
        }
        catch (e)
        {
          console.warn("error parsing machineProgress: " + e);
          progress.moddingData = null;
        }
      }
    }

    static getParsedData(progress : MachineProgress)
    {
      if (!progress.parsedData)
      {
        try {
          progress.parsedData = JSON.parse(progress.data);
          if (!progress.parsedData || (typeof progress.parsedData) != "object")
          {
            progress.parsedData = { goalsCompleted : false };
          }
        }
        catch (e)
        {
          progress.parsedData = { goalsCompleted : false };
        }
      }

      return progress.parsedData;
    }

    static setGoalsCompleted(progress: MachineProgress, completed : boolean)
    {
      MachineProgress.getParsedData(progress).goalsCompleted = completed;
    }
  }

  export type ComponentModdingData = { position: PolyInfo.transform3D, parentMachineComponentId: number, memory: { [key:string] : BlockDefinition } };

  export class ComponentProgress
  {
    userAccountId:number = -1;
    componentId:number = -1;
    moddingData: ComponentModdingData;

    data:string | BoardProgressData = null;
    sessionUuid:string = null;
    id:number = -1;

    static parseModdingData(progress : ComponentProgress)
    {
      if (typeof progress.moddingData == "string")
      {
        try {
          progress.moddingData = JSON.parse(progress.moddingData);
        }
        catch (e)
        {
          console.warn("error parsing componentProgress: " + e);
          progress.moddingData = null;
        }
      }
    }

    static setMemoryField(progress: ComponentProgress, key : string, value : Polyscript.Block)
    {
      if (!progress.moddingData)
      {
        progress.moddingData = { position: {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1}, parentMachineComponentId: -1, memory: {}};
      }
      if (!progress.moddingData.memory)
      {
        progress.moddingData.memory = {};
      }
      if (value)
      {
        progress.moddingData.memory[key] = BlockDefinition.fromBlock(value);
      }
      else
      {
        delete progress.moddingData.memory[key];
      }
    }
  }

  export class BoardProgress
  {
    userAccountId:number = -1;
    boardId:number = -1;
    moddingData: ComponentModdingData;

    /**{totalPoints:number, completedPoints:number}*/
    data:string | BoardProgressData = null;
    sessionUuid:string = null;
    id:number = -1;

    static parseModdingData(progress : BoardProgress)
    {
      if (typeof progress.moddingData == "string")
      {
        try {
          progress.moddingData = JSON.parse(progress.moddingData);
        }
        catch (e)
        {
          console.warn("error parsing boardProgress: " + e);
          progress.moddingData = null;
        }
      }
    }
  }

  export class BoardProgressData
  {
    totalPoints:number;
    completedPoints:number;
  }

  export type ChipModdingData = { position: PolyInfo.transform3D, componentId: number };

  export class ChipProgress
  {
    userAccountId:number = -1;
    chipId:number = -1;
    completed:boolean = false;
    moddingData: ChipModdingData;

    data:string | ChipProgressData[] = null;
    sessionUuid:string = null;
    id:number = -1;
    duration:number = 0;

    static parseModdingData(progress : ChipProgress)
    {
      if (typeof progress.moddingData == "string")
      {
        try {
          progress.moddingData = JSON.parse(progress.moddingData);
        }
        catch (e)
        {
          console.warn("error parsing chipProgress: " + e);
          progress.moddingData = null;
        }
      }
    }
  }

  export class ChipProgressData
  {
    completed:boolean = false;
    pd:PuzzleDefinitionJson | string;
    timestampUTC:number;
  }

  export interface progressCoin
  {
    currencyTypeId:number;
    name:string;
    value:number;
  }


}
