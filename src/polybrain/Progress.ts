import { PuzzleDefinitionJson } from "./../workspace/PuzzleData";
import { PolyInfo } from "./PolyInfo";
import { BlockDefinition } from "../workspace/PuzzleData";
import { Polyscript } from "../polyscript/Polyscript";
import { DBRecord } from "../database/DatabaseManager";

export namespace Progress {
  export class MachineProgress extends DBRecord {
    userAccountId: number = -1;
    machineId: number = -1;
    completed: boolean = false;
    completedLessons: boolean = false;
    completedGoals: boolean = false;
    completedNoChips: boolean = false;
    /**root board id?*/
    data: string = null;
    parsedData?: { goalsCompleted: boolean; time?: number } = null;
    sessionUuid: string = null;
    id: number = -1;
    updatedAt: string = "";
    moddingData: { position: PolyInfo.transform3D };
    totalTime: number = 0;
    timeToComplete: number = 0;

    static parseModdingData(progress: MachineProgress) {
      if (typeof progress.moddingData == "string") {
        try {
          progress.moddingData = JSON.parse(progress.moddingData);
        } catch (e) {
          console.warn("error parsing machineProgress: " + e);
          progress.moddingData = null;
        }
      }
    }

    static getParsedData(progress: MachineProgress) {
      if (!progress.parsedData) {
        try {
          progress.parsedData = JSON.parse(progress.data);
          if (!progress.parsedData || typeof progress.parsedData != "object") {
            progress.parsedData = { goalsCompleted: false, time: 0 };
          }
        } catch (e) {
          progress.parsedData = { goalsCompleted: false, time: 0 };
        }
      }

      return progress.parsedData;
    }

    static setGoalsCompleted(progress: MachineProgress, completed: boolean) {
      MachineProgress.getParsedData(progress).goalsCompleted = completed;
    }

    assignData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
        if (data.machineId !== undefined && data.machineId !== null) {
          this.machineId = data.machineId;
        }
        if (data.completed !== undefined && data.completed !== null) {
          this.completed = data.completed;
        }
        if (
          data.completedLessons !== undefined &&
          data.completedLessons !== null
        ) {
          this.completedLessons = data.completedLessons;
        }
        if (data.completedGoals !== undefined && data.completedGoals !== null) {
          this.completedGoals = data.completedGoals;
        }
        if (
          data.completedNoChips !== undefined &&
          data.completedNoChips !== null
        ) {
          this.completedNoChips = data.completedNoChips;
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
        }
        if (data.sessionUuid !== undefined && data.sessionUuid !== null) {
          this.sessionUuid = data.sessionUuid;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.updatedAt !== undefined && data.updatedAt !== null) {
          this.updatedAt = data.updatedAt;
        }
        if (data.moddingData !== undefined && data.moddingData !== null) {
          this.moddingData = data.moddingData;
        }
        if (data.totalTime !== undefined && data.totalTime !== null) {
          this.totalTime = data.totalTime;
        }
        if (data.timeToComplete !== undefined && data.timeToComplete !== null) {
          this.timeToComplete = data.timeToComplete;
        }

        // runtime properties
        this.parsedData = null;
        this.parsedData = MachineProgress.getParsedData(this);
      }
    }

    assignUploadData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  export type ComponentModdingData = {
    position: PolyInfo.transform3D;
    parentMachineComponentId: number;
    memory: { [key: string]: BlockDefinition };
  };

  export class ComponentProgress extends DBRecord {
    userAccountId: number = -1;
    componentId: number = -1;
    moddingData: ComponentModdingData;

    data: string | BoardProgressData = null;
    sessionUuid: string = null;
    id: number = -1;

    static parseModdingData(progress: ComponentProgress) {
      if (typeof progress.moddingData == "string") {
        try {
          progress.moddingData = JSON.parse(progress.moddingData);
        } catch (e) {
          console.warn("error parsing componentProgress: " + e);
          progress.moddingData = null;
        }
      }
    }

    static setMemoryField(
      progress: ComponentProgress,
      key: string,
      value: Polyscript.Block
    ) {
      if (!progress.moddingData) {
        progress.moddingData = {
          position: {
            x: 0,
            y: 0,
            z: 0,
            rx: 0,
            ry: 0,
            rz: 0,
            sx: 1,
            sy: 1,
            sz: 1,
          },
          parentMachineComponentId: -1,
          memory: {},
        };
      }
      if (!progress.moddingData.memory) {
        progress.moddingData.memory = {};
      }
      if (value) {
        progress.moddingData.memory[key] = BlockDefinition.fromBlock(value);
      } else {
        delete progress.moddingData.memory[key];
      }
    }

    assignData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
        if (data.componentId !== undefined && data.componentId !== null) {
          this.componentId = data.componentId;
        }
        if (data.moddingData !== undefined && data.moddingData !== null) {
          this.moddingData = data.moddingData;
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
          ComponentProgress.parseModdingData(this);
        }
        if (data.sessionUuid !== undefined && data.sessionUuid !== null) {
          this.sessionUuid = data.sessionUuid;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
      }
    }

    assignUploadData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  export class BoardProgress extends DBRecord {
    userAccountId: number = -1;
    boardId: number = -1;
    moddingData: ComponentModdingData;

    /**{totalPoints:number, completedPoints:number}*/
    data: string | BoardProgressData = null;
    sessionUuid: string = null;
    id: number = -1;

    static parseModdingData(progress: BoardProgress) {
      if (typeof progress.moddingData == "string") {
        try {
          progress.moddingData = JSON.parse(progress.moddingData);
        } catch (e) {
          console.warn("error parsing boardProgress: " + e);
          progress.moddingData = null;
        }
      }
    }

    assignData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
        if (data.boardId !== undefined && data.boardId !== null) {
          this.boardId = data.boardId;
        }
        if (data.moddingData !== undefined && data.moddingData !== null) {
          this.moddingData = data.moddingData;
          BoardProgress.parseModdingData(this);
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
        }
        if (data.sessionUuid !== undefined && data.sessionUuid !== null) {
          this.sessionUuid = data.sessionUuid;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
      }
    }

    assignUploadData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  export class BoardProgressData {
    totalPoints: number;
    completedPoints: number;
  }

  export type ChipModdingData = {
    position: PolyInfo.transform3D;
    componentId: number;
  };

  export class ChipProgress extends DBRecord {
    userAccountId: number = -1;
    chipId: number = -1;
    completed: boolean = false;
    moddingData: ChipModdingData;

    data: string | ChipProgressData[] = null;
    sessionUuid: string = null;
    id: number = -1;
    duration: number = 0;
    totalTime: number = 0;

    static parseModdingData(progress: ChipProgress) {
      if (typeof progress.moddingData == "string") {
        try {
          progress.moddingData = JSON.parse(progress.moddingData);
        } catch (e) {
          console.warn("error parsing chipProgress: " + e);
          progress.moddingData = null;
        }
      }
    }

    assignData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
        if (data.chipId !== undefined && data.chipId !== null) {
          this.chipId = data.chipId;
        }
        if (data.completed !== undefined && data.completed !== null) {
          this.completed = data.completed;
        }
        if (data.moddingData !== undefined && data.moddingData !== null) {
          this.moddingData = data.moddingData;
          ChipProgress.parseModdingData(this);
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
        }
        if (data.sessionUuid !== undefined && data.sessionUuid !== null) {
          this.sessionUuid = data.sessionUuid;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.duration !== undefined && data.duration !== null) {
          this.duration = data.duration;
        }
        if (data.totalTime !== undefined && data.totalTime !== null) {
          this.totalTime = data.totalTime;
        }
      }
    }

    assignUploadData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  export class ChipProgressData {
    completed: boolean = false;
    pd: PuzzleDefinitionJson | string;
    timestampUTC: number;
  }

  export interface progressCoin {
    currencyTypeId: number;
    name: string;
    value: number;
  }
}
