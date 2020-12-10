import {
  ModDefinition,
  BlockDefinition,
  PuzzleDefinitionJson,
  PuzzleConverter,
  ChipType,
} from "./../workspace/PuzzleData";
import { Progress } from "./Progress";
import { Globals } from "../globals";
import { ButtonInfo } from "../gamepad/ButtonInfo";
import { Polyscript } from "./../polyscript/Polyscript";
import { DBRecord } from "./../database/DatabaseManager";
import { getSystemTags } from "./SystemTags";
import i18next from "i18next";

/** namespace for all info classes related to brain. import this to get everything info related */
export namespace PolyInfo {
  /** stores data for a board - is board with chips and portals on backend */
  export class WorldInfo extends DBRecord {
    userAccountId: number = -1;
    uuid: string = "";
    id: number = -1;
    shareId: string;
    name: string = "";
    data: string = "";
    chips: BoardChip[] = [];
    grid: string[] | string = [];
    portals: BoardPortal[] = [];
    isEditable: boolean = true;
    active: boolean = true;
    userProgress: Progress.BoardProgress[] = [];
    arData: string | WorldInfoArData = null;
    systemTags: string;

    // TODO: encode 'gamepad' properties into the 'data' prop

    constructor() {
      super();
      this.id = -1;
      this.userAccountId = Globals.DataManager.userId;
      this.grid = [];
      for (var i: number = 0; i < 64; i++) {
        this.grid.push("0000");
      }
      this.name = "World 1";
      this.chips = [];
      this.portals = [];
    }

    static getArData(worldInfo: WorldInfo): WorldInfoArData {
      if (!worldInfo.arData || typeof worldInfo.arData === "string") {
        worldInfo.arData = new WorldInfoArData(worldInfo.arData);
      }
      return <WorldInfoArData>worldInfo.arData;
    }

    assignData(data: any, ignoreCache?: boolean) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
        if (data.uuid !== undefined && data.uuid !== null) {
          this.uuid = data.uuid;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.shareId !== undefined && data.shareId !== null) {
          this.shareId = data.shareId;
        }
        if (data.name !== undefined && data.name !== null) {
          this.name = data.name;
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
        }
        if (data.grid !== undefined && data.grid !== null) {
          this.grid = data.grid;
        }
        if (data.portals !== undefined && data.portals !== null) {
          this.portals = data.portals;
        }
        if (data.isEditable !== undefined && data.isEditable !== null) {
          this.isEditable = data.isEditable;
        }
        if (data.active !== undefined && data.active !== null) {
          this.active = data.active;
        }
        if (data.arData !== undefined && data.arData !== null) {
          this.arData = data.arData;
        }
        if (data.systemTags !== undefined && data.systemTags !== null) {
          this.systemTags = data.systemTags;
        }

        // other DBRecords
        if (data.chips !== undefined && data.chips !== null) {
          this.chips = [];
          for (let chipData of data.chips) {
            let bc = !ignoreCache && getBoardChipById(chipData.id);
            if (!bc) {
              bc = new BoardChip(null, this.id, undefined);
              cacheBoardChip(bc);
            }
            bc.assignData(chipData, ignoreCache);
            this.chips.push(bc);
          }
        }
        if (data.userProgress !== undefined && data.userProgress !== null) {
          this.userProgress = [];
          for (let progData of data.userProgress) {
            let progress = !ignoreCache && getBoardProgressById(progData.id);
            if (!progress) {
              progress = new Progress.BoardProgress();
              cacheBoardProgress(progress);
            }
            progress.assignData(progData);
            this.userProgress.push(progress);
          }
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
        if (data.shareId !== undefined && data.shareId !== null) {
          this.shareId = data.shareId;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  export class Point {
    x: number;
    y: number;

    // constructor(x?: number, y?: number) {
    //   this.x = x;
    //   this.y = y;
    // }

    // clone():Point {
    //   return new Point(this.x, this.y);
    // }

    // copy(p:Point):Point{
    //   this.x = p.x;
    //   this.y = p.y;
    //   return this;
    // }

    // setValues(x?: number, y?: number):Point{
    //   this.x = x;
    //   this.y = y;
    //   return this;
    // }

    // toString():string {
    //   return `(#{this.x}, #{this.y})`;
    // }
  }

  /**class contianing machine to component relationship*/
  export class MachineComponent extends DBRecord {
    machineId: number = 0;
    componentId: number = 0;
    parentMachineComponentId: number = 0;
    component: ComponentInfo;
    id: number = -1;
    position: transform3D;
    isForking?: boolean;

    constructor(machine: MachineInfo, component: ComponentInfo) {
      super();
      if (machine) {
        this.machineId = machine.id;
      }
      if (component) {
        this.componentId = component.id;
      }
      this.component = component;
      this.position = {
        x: 0,
        y: 0,
        z: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        sx: 1,
        sy: 1,
        sz: 1,
      };
    }

    assignData(data: any, ignoreCache?: boolean) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.machineId !== undefined && data.machineId !== null) {
          this.machineId = data.machineId;
        }
        if (data.componentId !== undefined && data.componentId !== null) {
          this.componentId = data.componentId;
        }
        if (
          data.parentMachineComponentId !== undefined &&
          data.parentMachineComponentId !== null
        ) {
          this.parentMachineComponentId = data.parentMachineComponentId;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.position !== undefined && data.position !== null) {
          this.position = data.position;
        }

        // other DBRecords
        if (data.component !== undefined && data.component !== null) {
          var component = !ignoreCache && getComponentById(data.component.id);
          if (!component) {
            if (this.component) {
              component = this.component;
            } else {
              component = new ComponentInfo();
              cacheComponent(component);
            }
          }
          component.assignData(data.component, ignoreCache);
          this.component = component;
        } else {
          let refComponent = getComponentById(this.componentId);
          if (refComponent) {
            this.component = refComponent;
          }
        }
      }
    }

    assignUploadData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  export interface transform3D {
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
    sx: number;
    sy: number;
    sz: number;
    anchor?: number;
    rootAnchor?: number;
  }

  export enum ComponentType {
    basic = 0,
    tray,
    poly,
    camera,
    challenge_lesson = 100,
    challenge_goalchips,
    challenge_feedback,
  }

  export class ComponentInfo extends DBRecord {
    userAccountId: number = -1;
    uuid: string = "";
    id: number = -1;
    shareId: string;
    name: string = "";
    data: string;
    modelId: string;
    chips: ComponentChip[] = [];
    isEditable: boolean = true;
    active: boolean = true;
    strings: StringDict = null;
    type: number = ComponentType.basic;
    memory: string;
    systemTags: string;
    parsedMemory?: { [key: string]: BlockDefinition };
    userProgress: Progress.ComponentProgress[] = [];
    moddable?: boolean;
    isFromTray?: boolean;
    localId: number;
    // arData: string | WorldInfoArData = null;

    assignData(data: any, ignoreCache?: boolean) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
        if (data.uuid !== undefined && data.uuid !== null) {
          this.uuid = data.uuid;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.shareId !== undefined && data.shareId !== null) {
          this.shareId = data.shareId;
        }
        if (data.name !== undefined && data.name !== null) {
          this.name = data.name;
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
        }
        if (data.modelId !== undefined && data.modelId !== null) {
          this.modelId = data.modelId;
        }
        if (data.isEditable !== undefined && data.isEditable !== null) {
          this.isEditable = data.isEditable;
        }
        if (data.active !== undefined && data.active !== null) {
          this.active = data.active;
        }
        if (data.strings !== undefined && data.strings !== null) {
          while (typeof data.strings == "string") {
            try {
              data.strings = JSON.parse(data.strings);
            } catch (e) {
              console.error("error parsing strings: ", e);
              break;
            }
          }
          this.strings = data.strings;
        }
        if (data.type !== undefined && data.type !== null) {
          this.type = data.type;
        }
        if (data.memory !== undefined && data.memory !== null) {
          this.memory = data.memory;
        }
        if (data.systemTags !== undefined && data.systemTags !== null) {
          this.systemTags = data.systemTags;
        }
        if (data.localId !== undefined && data.localId !== null) {
          this.localId = data.localId;
        }

        this.parsedMemory = null;
        this.parsedMemory = ComponentInfo.getParsedMemory(this);

        // runtime properties
        // moddable? : boolean;
        // isFromTray? : boolean;

        // other DBRecords
        if (data.chips !== undefined && data.chips !== null) {
          this.chips = [];
          for (let chipData of data.chips) {
            let cc = !ignoreCache && getComponentChipById(chipData.id);
            if (!cc) {
              cc = new ComponentChip(null, this.id);
              cacheComponentChip(cc);
            }
            cc.assignData(chipData, ignoreCache);
            this.chips.push(cc);
          }
        }

        if (data.userProgress !== undefined && data.userProgress !== null) {
          this.userProgress = [];
          for (let progData of data.userProgress) {
            let progress =
              !ignoreCache && getComponentProgressById(progData.id);
            if (!progress) {
              progress = new Progress.ComponentProgress();
              cacheComponentProgress(progress);
            }
            progress.assignData(progData);
            this.userProgress.push(progress);
          }
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
        if (data.shareId !== undefined && data.shareId !== null) {
          this.shareId = data.shareId;
        }
      }
    }

    static hasSystemTag(component: ComponentInfo, tag: string) {
      if (!component || !component.systemTags) {
        return false;
      }
      var regex = new RegExp("(?:^|,)" + tag + "(?:$|,)");
      return regex.test(component.systemTags);
    }

    static matchSystemTag(component: ComponentInfo, tagExp: RegExp | String) {
      if (!component || !component.systemTags) {
        return null;
      }

      if (typeof tagExp == "string") {
        var regex = new RegExp("(?:^|,)" + tagExp + "(?:$|,)");
      } else {
        var regex = new RegExp(
          "(?:^|,)" + (tagExp as RegExp).source + "(?:$|,)"
        );
      }

      var match = regex.exec(component.systemTags);

      if (match) {
        if (match[0].startsWith(",")) {
          match[0] = match[0].substr(1);
          match.index++;
        }
        if (match[0].endsWith(",")) {
          match[0] = match[0].substr(0, match[0].length - 1);
        }
      }

      return match;
    }

    static addSystemTag(component: ComponentInfo, tag: string) {
      if (tag.includes(",")) {
        console.error("invalid tag " + tag + ": includes a comma");
        return;
      }
      if (!component) {
        console.warn("tried to add tag to nonexistent component");
        return;
      }

      if (component.systemTags == null || component.systemTags == "") {
        component.systemTags = tag;
      } else if (!this.hasSystemTag(component, tag)) {
        component.systemTags += "," + tag;
      } else {
        console.warn("tried to add duplicate tag " + tag);
      }
    }

    static deleteSystemTag(component: ComponentInfo, tagExp: RegExp | String) {
      this.replaceSystemTag(component, tagExp, "");

      // clean up leading, trailing, or doubled commas
      component.systemTags = component.systemTags.replace(",,", ",");
      if (component.systemTags.startsWith(",")) {
        component.systemTags = component.systemTags.substr(1);
      }
      if (component.systemTags.endsWith(",")) {
        component.systemTags = component.systemTags.substr(
          0,
          component.systemTags.length - 1
        );
      }
    }

    static replaceSystemTag(
      component: ComponentInfo,
      tagExp: RegExp | String,
      tag: string
    ) {
      if (tag.includes(",")) {
        console.error("invalid tag " + tag + ": includes a comma");
        return;
      }

      var match = this.matchSystemTag(component, tagExp);
      if (match) {
        component.systemTags = component.systemTags.replace(match[0], tag);
      } else {
        this.addSystemTag(component, tag);
      }
    }

    static getParsedMemory(component: ComponentInfo) {
      if (component.parsedMemory) {
        return component.parsedMemory;
      }
      if (component.memory) {
        component.parsedMemory = JSON.parse(component.memory);
      } else {
        component.parsedMemory = null;
      }
      return component.parsedMemory;
    }

    static setMemoryField(
      component: ComponentInfo,
      key: string,
      value: Polyscript.Block
    ) {
      if (!component.parsedMemory) {
        component.parsedMemory = {};
      }
      if (value) {
        component.parsedMemory[key] = BlockDefinition.fromBlock(value);
      } else {
        delete component.parsedMemory[key];
      }
      component.memory = JSON.stringify(component.parsedMemory);
    }

    getDatabaseId() {
      return this.id;
    }
  }

  export class ComponentChip extends DBRecord {
    /** relational id to {PolyInfo.WorldInfo} datamodel on backend */
    componentId: number = 0;
    /** relational id to Chip datamodel on backend */
    chipId: number = 0;
    /** data model unique id from backend */
    id: number = -1;
    data: string;
    position: transform3D;
    chip: Chip;
    isForking?: boolean;

    constructor(chip: Chip, componentId: number) {
      super();
      this.id = -1;
      this.chip = chip;
      if (chip) {
        this.chipId = chip.id;
      }
      this.componentId = componentId;
    }

    assignData(data: any, ignoreCache?: boolean) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.componentId !== undefined && data.componentId !== null) {
          this.componentId = data.componentId;
        }
        if (data.chipId !== undefined && data.chipId !== null) {
          this.chipId = data.chipId;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
        }
        if (data.position !== undefined && data.position !== null) {
          this.position = data.position;
        }

        // runtime property
        // isForking? : boolean;

        // other DBRecords
        if (data.chip !== undefined && data.chip !== null) {
          var chip = !ignoreCache && getChipById(data.chip.id);
          if (!chip) {
            if (this.chip) {
              chip = this.chip;
            } else {
              chip = new Chip();
              cacheChip(chip);
            }
          }

          chip.assignData(data.chip, ignoreCache);
          this.chip = chip;
        } else {
          let refChip = getChipById(this.chipId);
          if (refChip) {
            this.chip = refChip;
          }
        }
      }
    }

    assignUploadData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }

    static getChipType(cc: ComponentChip): ChipType {
      if (cc.data == "yt") {
        return "media";
      } else if (!cc.chip) {
        return undefined;
      } else {
        var pdj = Chip.getParsedPuzzle(cc.chip);
        if (pdj) {
          return pdj.chipType;
        } else {
          return null;
        }
      }
    }
  }

  /** stores info for a block on the grid */
  export class BlockInfo {
    id: string = "";
    worldid: number = 0;
    points: number = 0;
  }

  export class ModReference extends BlockInfo {
    chip: Chip;

    constructor(chip: BoardChip) {
      super();
      if (chip == null) return;
      this.chip = chip.chip;
      this.id = chip.boardGridCode;
      if (this.id == undefined) this.id = chip.componentGridCode;
      this.worldid = chip.boardId;
    }
  }

  export class YTReference extends BlockInfo {
    chip: Chip;
    isYt: boolean = true;

    constructor(chip: BoardChip) {
      super();
      if (chip == null) return;
      this.chip = chip.chip;
      this.id = chip.boardGridCode;
      if (this.id == undefined) this.id = chip.componentGridCode;
      this.worldid = chip.boardId;
    }
  }

  /** stores info for a mod reference. can reference a mod on a different board */
  export class BoardChip extends DBRecord {
    /** relational id to {PolyInfo.WorldInfo} datamodel on backend */
    boardId: number = 0;
    /** relational id to Chip datamodel on backend */
    chipId: number = 0;
    /** data model unique id from backend */
    id: number = -1;
    data: string;
    position: string;
    /**modID*/
    boardGridCode: string = "mo01";
    componentGridCode: string = "mo01";
    //"bl00" "po01" "0000" "mo01"
    chip: Chip;

    constructor(chip: Chip, boardId: number, boardGridCode: string) {
      super();
      this.id = -1;
      this.chip = chip;
      if (chip) {
        this.chipId = chip.id;
      }
      this.boardId = boardId;
      this.boardGridCode = boardGridCode;
      this.componentGridCode = boardGridCode;
    }

    assignData(data: any, ignoreCache?: boolean) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.boardId !== undefined && data.boardId !== null) {
          this.boardId = data.boardId;
        }
        if (data.chipId !== undefined && data.chipId !== null) {
          this.chipId = data.chipId;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
        }
        if (data.position !== undefined && data.position !== null) {
          this.position = data.position;
        }
        if (data.boardGridCode !== undefined && data.boardGridCode !== null) {
          this.boardGridCode = data.boardGridCode;
        }
        if (
          data.componentGridCode !== undefined &&
          data.componentGridCode !== null
        ) {
          this.componentGridCode = data.componentGridCode;
        }

        // other DBRecords
        if (data.chip !== undefined && data.chip !== null) {
          var chip = !ignoreCache && getChipById(data.chip.id);
          if (!chip) {
            if (this.chip) {
              chip = this.chip;
            } else {
              chip = new Chip();
              cacheChip(chip);
            }
          }

          chip.assignData(data.chip, ignoreCache);
          this.chip = chip;
        } else {
          let refChip = getChipById(this.chipId);
          if (refChip) {
            this.chip = refChip;
          }
        }
      }
    }

    assignUploadData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  export class Chip extends DBRecord {
    userAccountId: number = -1;
    shareId: string = "";
    name: string = "";
    /**stringified PuzzleDefinition*/
    data: PuzzleDefinitionJson = null;
    parsedData: PuzzleDefinitionJson = null;
    script: string = "";
    goals: string = "";
    tags: string = "";
    active: boolean = true;
    /**mainly used for publishing status. use 0 for Draft, 1 for Published, 2 for Published for access using code only*/
    status: number = 0;
    originalMachineHistoryId: number = 0;
    id: number = -1;
    isEditable: boolean = true;
    userProgress: Progress.ChipProgress[] = [];
    strings: StringDict = null;
    moddable?: boolean;
    isFromTray?: boolean;
    localId: number;
    systemTags: string;

    assignData(data: any, ignoreCache?: boolean) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
        if (data.shareId !== undefined && data.shareId !== null) {
          this.shareId = data.shareId;
        }
        if (data.name !== undefined && data.name !== null) {
          this.name = data.name;
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = JSON.parse(JSON.stringify(data.data)); // copy JSON object
        }
        if (data.script !== undefined && data.script !== null) {
          this.script = data.script;
        }
        if (data.goals !== undefined && data.goals !== null) {
          this.goals = data.goals;
        }
        if (data.tags !== undefined && data.tags !== null) {
          this.tags = data.tags;
        }
        if (data.active !== undefined && data.active !== null) {
          this.active = data.active;
        }
        if (data.status !== undefined && data.status !== null) {
          this.status = data.status;
        }
        if (
          data.originalMachineHistoryId !== undefined &&
          data.originalMachineHistoryId !== null
        ) {
          this.originalMachineHistoryId = data.originalMachineHistoryId;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.isEditable !== undefined && data.isEditable !== null) {
          this.isEditable = data.isEditable;
        }
        if (data.strings !== undefined && data.strings !== null) {
          while (typeof data.strings == "string") {
            try {
              data.strings = JSON.parse(data.strings);
            } catch (e) {
              console.error("error parsing strings: ", e);
              break;
            }
          }
          this.strings = data.strings;
        }
        if (data.localId !== undefined && data.localId !== null) {
          this.localId = data.localId;
        }
        if (data.systemTags !== undefined && data.systemTags !== null) {
          this.systemTags = data.systemTags;
        }

        // runtime properties
        this.parsedData = null; // reset parsed data -- will be re-parsed when needed.
        // moddable? : boolean;
        // isFromTray? : boolean;

        // other DBRecords
        if (data.userProgress !== undefined && data.userProgress !== null) {
          this.userProgress = [];
          for (let progData of data.userProgress) {
            let progress = !ignoreCache && getChipProgressById(progData.id);
            if (!progress) {
              progress = new Progress.ChipProgress();
              cacheChipProgress(progress);
            }
            progress.assignData(progData);
            this.userProgress.push(progress);
          }
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
        if (data.shareId !== undefined && data.shareId !== null) {
          this.shareId = data.shareId;
        }
      }
    }

    static getParsedPuzzle(chip: Chip): PuzzleDefinitionJson {
      if (chip.parsedData) {
        return chip.parsedData;
      }

      try {
        chip.parsedData = PuzzleConverter.parsePuzzle(chip.data);
      } catch (e) {
        chip.parsedData = null;
      }

      return chip.parsedData;
    }

    static hasSystemTag(chip: Chip, tag: string) {
      if (!chip || !chip.systemTags) {
        return false;
      }
      var regex = new RegExp("(?:^|,)" + tag + "(?:$|,)");
      return regex.test(chip.systemTags);
    }

    static matchSystemTag(chip: Chip, tagExp: RegExp | String) {
      if (!chip || !chip.systemTags) {
        return null;
      }

      if (typeof tagExp == "string") {
        var regex = new RegExp("(?:^|,)" + tagExp + "(?:$|,)");
      } else {
        var regex = new RegExp(
          "(?:^|,)" + (tagExp as RegExp).source + "(?:$|,)"
        );
      }

      var match = regex.exec(chip.systemTags);

      if (match) {
        if (match[0].startsWith(",")) {
          match[0] = match[0].substr(1);
          match.index++;
        }
        if (match[0].endsWith(",")) {
          match[0] = match[0].substr(0, match[0].length - 1);
        }
      }

      return match;
    }

    static addSystemTag(chip: Chip, tag: string) {
      if (tag.includes(",")) {
        console.error("invalid tag " + tag + ": includes a comma");
        return;
      }
      if (!chip) {
        console.warn("tried to add tag to nonexistent chip");
        return;
      }

      if (chip.systemTags == null || chip.systemTags == "") {
        chip.systemTags = tag;
      } else if (!this.hasSystemTag(chip, tag)) {
        chip.systemTags += "," + tag;
      } else {
        console.warn("tried to add duplicate tag " + tag);
      }
    }

    static deleteSystemTag(chip: Chip, tagExp: RegExp | String) {
      this.replaceSystemTag(chip, tagExp, "");

      // clean up leading, trailing, or doubled commas
      chip.systemTags = chip.systemTags.replace(",,", ",");
      if (chip.systemTags.startsWith(",")) {
        chip.systemTags = chip.systemTags.substr(1);
      }
      if (chip.systemTags.endsWith(",")) {
        chip.systemTags = chip.systemTags.substr(0, chip.systemTags.length - 1);
      }
    }

    static replaceSystemTag(chip: Chip, tagExp: RegExp | String, tag: string) {
      if (tag.includes(",")) {
        console.error("invalid tag " + tag + ": includes a comma");
        return;
      }

      var match = this.matchSystemTag(chip, tagExp);
      if (match) {
        chip.systemTags = chip.systemTags.replace(match[0], tag);
      } else {
        this.addSystemTag(chip, tag);
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  /** stores info on a portal in the grid. */
  export class PortalReference extends BlockInfo {
    /** the id of the world the portal is targetng */
    targetWorld: number = -1;
    /** the index number for the color of the portal */
    colorNum: number = 0;

    portal: BoardPortal;

    constructor(portal: BoardPortal) {
      super();
      if (portal == null) return;
      this.portal = portal;
      this.targetWorld = portal.childBoardId;
      this.worldid = portal.parentBoardId;
      this.id = portal.boardPortalCode;
    }
  }

  export class BoardPortal {
    /**board this portal belongs to*/
    parentBoardId: number = -1;
    /**target board this portal points to*/
    childBoardId: number = -1;

    data: string;
    position: string;
    boardPortalCode: string = "po01";
    id: number = -1;
  }

  export class Portal {}

  /** info for the start portal */
  export class StartInfo extends BlockInfo {}
  /** info for the position of poly ont he board */
  export class PolyInfo extends BlockInfo {}

  export interface machineJudge {
    judge: boolean;
    prizeName: string;
    prizeId: number;
    survey: any[];
  }

  export class MachineInfoData {
    dataModelVersion: number = 2;
    cameraType: "2D" | "3D" = "3D";

    constructor(data?: string) {
      if (data) {
        try {
          var parsedData = JSON.parse(data);
          if (parsedData.dataModelVersion) {
            this.dataModelVersion = parsedData.dataModelVersion;
          }
          if (parsedData.cameraType) {
            this.cameraType = parsedData.cameraType;
          }
        } catch (e) {}
      }
    }

    serialize() {
      return JSON.stringify(this);
    }
  }

  /** contains info for a machine */
  export class MachineInfo extends DBRecord {
    judging?: machineJudge;
    version: number = 1;
    userAccountId: number = -1;
    uuid: string = "";
    shareId: string = "";
    name: string = "";
    tags: TagInfo[];
    tagArray: string[];
    systemTags: string;
    active: boolean = true;
    status: number = 0;
    originalMachineHistoryId: number = null;
    isDefault: boolean = false;
    id: number = -1;
    rootBoardId: number = 0;
    data: string = null;
    strings: StringDict = null;

    isEditable: boolean = true;
    isPublic: boolean = false;
    userProgress: Progress.MachineProgress[] = [];
    components: MachineComponent[];
    boards: MachineBoard[];

    assignData(data: any, ignoreCache?: boolean) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.judging !== undefined && data.judging !== null) {
          this.judging = data.judging;
        }
        if (data.version !== undefined && data.version !== null) {
          this.version = data.version;
        }
        if (data.userAccountId !== undefined && data.userAccountId !== null) {
          this.userAccountId = data.userAccountId;
        }
        if (data.uuid !== undefined && data.uuid !== null) {
          this.uuid = data.uuid;
        }
        if (data.shareId !== undefined && data.shareId !== null) {
          this.shareId = data.shareId;
        }
        if (data.name !== undefined && data.name !== null) {
          this.name = data.name;
        }
        if (data.tagArray !== undefined && data.tagArray !== null) {
          this.tagArray = data.tagArray;
        }
        if (data.systemTags !== undefined && data.systemTags !== null) {
          this.systemTags = data.systemTags;
        }
        if (data.active !== undefined && data.active !== null) {
          this.active = data.active;
        }
        if (data.status !== undefined && data.status !== null) {
          this.status = data.status;
        }
        if (
          data.originalMachineHistoryId !== undefined &&
          data.originalMachineHistoryId !== null
        ) {
          this.originalMachineHistoryId = data.originalMachineHistoryId;
        }
        if (data.isDefault !== undefined && data.isDefault !== null) {
          this.isDefault = data.isDefault;
        }
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
        if (data.rootBoardId !== undefined && data.rootBoardId !== null) {
          this.rootBoardId = data.rootBoardId;
        }
        if (data.data !== undefined && data.data !== null) {
          this.data = data.data;
        }
        if (data.strings !== undefined && data.strings !== null) {
          while (typeof data.strings == "string") {
            try {
              data.strings = JSON.parse(data.strings);
            } catch (e) {
              console.error("error parsing strings: ", e);
              break;
            }
          }
          this.strings = data.strings;
        }
        if (data.isEditable !== undefined && data.isEditable !== null) {
          this.isEditable = data.isEditable;
        }
        if (data.isPublic !== undefined) {
          this.isPublic = data.isPublic;
        }

        // other DBRecords
        if (data.tags !== undefined && data.tags !== null) {
          while (typeof data.tags == "string") {
            try {
              data.tags = JSON.parse(data.tags);
            } catch (e) {
              console.error("error parsing tags: ", e);
              break;
            }
          }

          this.tags = [];
          for (let tagData of data.tags) {
            this.tags.push(tagData);
          }

          this.tagArray = null;
          this.tagArray = MachineInfo.getTagList(this);
        }
        if (data.userProgress !== undefined && data.userProgress !== null) {
          this.userProgress = [];
          for (let progData of data.userProgress) {
            let progress = !ignoreCache && getMachineProgressById(progData.id);
            if (!progress) {
              progress = new Progress.MachineProgress();
              cacheMachineProgress(progress);
            }
            progress.assignData(progData);
            this.userProgress.push(progress);
          }
        }
        if (data.components !== undefined && data.components !== null) {
          this.components = [];
          for (let compData of data.components) {
            let mc = !ignoreCache && getMachineComponentById(compData.id);
            if (!mc) {
              mc = new MachineComponent(this, null);
              cacheMachineComponent(mc);
            }
            mc.assignData(compData, ignoreCache);
            this.components.push(mc);
          }
        }
        if (data.boards !== undefined && data.boards !== null) {
          this.boards = [];
          for (let boardData of data.boards) {
            let mb = !ignoreCache && getMachineBoardById(boardData.id);
            if (!mb) {
              mb = new MachineBoard(this, null, data.isRoot);
              cacheMachineBoard(mb);
            }
            mb.assignData(boardData, ignoreCache);
            this.boards.push(mb);
          }
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
        if (data.shareId !== undefined && data.shareId !== null) {
          this.shareId = data.shareId;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }

    /**
     * @param id - id of the machine
     * @param display - display text for the machine
     * @param code - code used to get the machine
     */
    constructor(info: WorldInfo, name: string) {
      super();
      this.name = name;
      this.isDefault = false;
      this.id = -1;
      this.active = true;
      if (info == null) {
        this.version = 2;
        return;
      }
      this.userAccountId = info.userAccountId;
      this.active = info.active;

      this.rootBoardId = info.id;
    }

    static removeInvalidEntries(info: MachineInfo) {
      if (info.boards) {
        for (let i = 0; i < info.boards.length; i++) {
          let mb = info.boards[i];
          if (!mb.board) {
            console.warn(
              "found invalid machine board " + mb.id + ". Discarding."
            );
            info.boards.splice(i, 1);
            i--;
          } else {
            if (mb.board.chips) {
              for (let j = 0; j < mb.board.chips.length; j++) {
                let bc = mb.board.chips[j];
                if (!bc.chip) {
                  console.warn(
                    "found invalid board chip " + bc.id + ". Discarding."
                  );
                  mb.board.chips.splice(j, 1);
                  j--;
                }
              }
            }
          }
        }
      }

      if (info.components) {
        for (let i = 0; i < info.components.length; i++) {
          let mc = info.components[i];
          if (!mc.component) {
            console.warn(
              "found invalid machine component " + mc.id + ". Discarding."
            );
            info.components.splice(i, 1);
            i--;
          } else {
            if (mc.component.chips) {
              for (let j = 0; j < mc.component.chips.length; j++) {
                let cc = mc.component.chips[j];
                if (!cc.chip) {
                  console.warn(
                    "found invalid component chip " + cc.id + ". Discarding."
                  );
                  mc.component.chips.splice(j, 1);
                  j--;
                }
              }
            }
          }
        }
      }
    }

    static isFullyLoaded(info: MachineInfo) {
      if (
        (info.boards == null || info.boards.length == 0) &&
        (info.components == null || info.components.length == 0)
      ) {
        return false;
      }

      if (info.boards) {
        for (var board of info.boards) {
          if (!board.board || !board.board.chips) {
            return false;
          } else {
            for (let chip of board.board.chips) {
              if (!chip.chip) {
                return false;
              }
            }
          }
        }
      }

      if (info.components) {
        for (var component of info.components) {
          if (!component.component || !component.component.chips) {
            return false;
          } else {
            for (let chip of component.component.chips) {
              if (!chip.chip) {
                return false;
              }
            }
          }
        }
      }

      return true;
    }

    static isLegacy(info: MachineInfo) {
      return !info.version || info.version < 2;
    }

    static getTagList(machine: MachineInfo): string[] {
      if (machine.tagArray) {
        return machine.tagArray;
      } else if (!machine.tags) {
        return [];
      } else {
        if (machine.tags instanceof String)
          machine.tags = JSON.parse(<any>machine.tags);
        if (machine.tags.length > 0) {
          var result = [];
          for (var t of machine.tags) {
            result.push(t.tagName);
          }
          return result;
        } else return [];
      }
    }

    static setTagList(machine: MachineInfo, tags: string[]) {
      if (machine) {
        machine.tagArray = tags;
      }
    }

    static pushTag(machine: MachineInfo, tag: string) {
      if (!machine) {
        console.log("no machine");
        return;
      }

      if (tag == "") {
        console.log("empty tag");
        return;
      }

      if (tag.search(/\s/) != -1) {
        console.log("whitespace");
        return;
      }

      if (tag.search("#") != -1) {
        console.log("hashtag");
        return;
      }

      // if the tag already exists, delete it so it will be moved to the end of the list
      MachineInfo.deleteTag(machine, tag);

      machine.tagArray.splice(0, 0, tag);
    }

    static addTag(machine: MachineInfo, tag: string) {
      if (!machine) {
        console.log("no machine");
        return;
      }

      if (tag == "") {
        console.log("empty tag");
        return;
      }

      if (tag.search(/\s/) != -1) {
        tag = tag.replace(/\s/g, "");
        console.log("whitespace");
        //return;
      }

      if (tag.search("#") != -1) {
        console.log("hashtag");
        return;
      }

      // if the tag already exists, delete it so it will be moved to the end of the list
      MachineInfo.sortTag(machine, tag);
      machine.tagArray.push(tag);

      var tagInfo: TagInfo = new TagInfo();
      tagInfo.id = machine.id;
      tagInfo.tagName = tag;
      tagInfo.tagType = "Custom";

      if (machine.tags.findIndex((someInfo) => someInfo.tagName == tag) == -1) {
        machine.tags.push(tagInfo);
        Globals.DataManager.addTag(tagInfo, "Machines", (info) => {});
      }
    }

    static deleteTag(machine: MachineInfo, tag: string) {
      if (machine) {
        var tagInfo = machine.tags.find((someTag) => someTag.tagName == tag);
        if (tagInfo) {
          tagInfo.id = machine.id;
          Globals.DataManager.removeTag(tagInfo, "Machines", (count) => {
            if (count > 0)
              machine.tags.splice(machine.tags.indexOf(tagInfo), 1);
          });
        }
        MachineInfo.setTagList(
          machine,
          MachineInfo.getTagList(machine).filter((value) => value != tag)
        );
      }
    }

    static deleteLanguage(machine: MachineInfo, tagLang: string) {
      var langCodeToDelete = Globals.lookupLanguageCode(tagLang);
      console.log(
        "delete language " +
          langCodeToDelete +
          " from machine " +
          (machine && machine.shareId)
      );
      if (machine) {
        var fallbackLang: string = undefined;
        for (var tag of machine.tags) {
          if (tag.tagType == "Language" && tag.tagName != tagLang) {
            if (tag.tagName == "English") {
              fallbackLang = "en";
            } else if (!fallbackLang) {
              fallbackLang = Globals.lookupLanguageCode(tag.tagName);
            }
          }
        }

        if (fallbackLang === undefined || fallbackLang == langCodeToDelete) {
          console.error("deleteLanguage: couldn't find a fallback language!");
          return;
        }

        var deleted = this.deleteLanguageFromDict(
          langCodeToDelete,
          fallbackLang,
          machine.strings
        );

        if (deleted) {
          Globals.DataManager.uploadMachine(machine, () => {
            console.log("reuploaded machine after language deletion");
          });
        }

        if (machine.boards) {
          for (let mb of machine.boards) {
            if (mb.board && mb.board.chips) {
              for (let bc of mb.board.chips) {
                if (bc.chip) {
                  deleted = this.deleteLanguageFromDict(
                    langCodeToDelete,
                    fallbackLang,
                    bc.chip.strings
                  );

                  if (deleted) {
                    Globals.DataManager.uploadChip(bc.chip, () => {
                      console.log("reuploaded chip after language deletion");
                    });
                  }
                }
              }
            }
          }
        }

        if (machine.components) {
          for (let mc of machine.components) {
            if (mc.component && mc.component.chips) {
              deleted = this.deleteLanguageFromDict(
                langCodeToDelete,
                fallbackLang,
                mc.component.strings
              );

              if (deleted) {
                Globals.DataManager.uploadComponent(mc.component, () => {
                  console.log("reuploaded component after language deletion");
                });
              }

              for (let cc of mc.component.chips) {
                if (cc.chip) {
                  deleted = this.deleteLanguageFromDict(
                    langCodeToDelete,
                    fallbackLang,
                    cc.chip.strings
                  );

                  if (deleted) {
                    Globals.DataManager.uploadChip(cc.chip, () => {
                      console.log("reuploaded chip after language deletion");
                    });
                  }
                }
              }
            }
          }
        }

        this.updateSystemTags(machine);
      }
    }

    static deleteLanguageFromDict(
      langToDelete: string,
      fallbackLang: string,
      dict: StringDict
    ): boolean {
      if (dict && dict[langToDelete] && typeof dict[langToDelete] != "string") {
        var deletedDict = dict[langToDelete] as StringDict;
        var fallbackDict = dict[fallbackLang] as StringDict;

        if (!fallbackDict || typeof fallbackDict == "string") {
          fallbackDict = dict[fallbackLang] = {};
        }

        var deletedEntry = false;

        for (var key in deletedDict) {
          deletedEntry = true;
          if (!fallbackDict[key]) {
            fallbackDict[key] = deletedDict[key];
            console.log("copied " + fallbackDict[key] + " to " + fallbackLang);
          }
        }

        delete dict[langToDelete];

        return deletedEntry;
      }

      return false;
    }

    static sortTag(machine: MachineInfo, tag: string) {
      if (machine) {
        MachineInfo.setTagList(
          machine,
          MachineInfo.getTagList(machine).filter((value) => value != tag)
        );
      }
    }

    static updateSystemTags(machine: MachineInfo) {
      var chipStringses: StringDict[] = [];
      if (machine.boards) {
        for (var board of machine.boards) {
          if (board && board.board && board.board.chips) {
            for (var bc of board.board.chips) {
              chipStringses.push(bc.chip.strings);
            }
          }
        }
      }

      if (machine.components) {
        for (var mc of machine.components) {
          if (mc && mc.component) {
            chipStringses.push(mc.component.strings); // not a chip, but we want to treat it the same here anyway
            if (mc.component.chips) {
              for (var cc of mc.component.chips) {
                chipStringses.push(cc.chip.strings);
              }
            }
          }
        }
      }

      var tags = getSystemTags(machine.strings, chipStringses, machine.version); // getSystemTags from SystemTags.ts
      var newTags: TagInfo[] = [];
      for (var t of tags) {
        var isVersion = t.charAt(0) == "v" && !isNaN(parseInt(t.charAt(1)));
        var tag: TagInfo = new TagInfo();

        tag.id = machine.id;
        tag.tagName = t;
        tag.tagType = isVersion ? "version" : "Language";
        tag.system = true;

        newTags.push(tag);
      }
      if (!machine.tags) machine.tags = [];
      var systemExisting = machine.tags.filter((x) => x.system);

      var tagsRemoved = systemExisting.filter(
        (x) => !newTags.find((y) => y.tagName == x.tagName)
      );
      var tagsAdded = newTags.filter(
        (x) => !systemExisting.find((y) => y.tagName == x.tagName)
      );

      for (var tr of tagsRemoved) {
        tr.id = machine.id;
        machine.tags.splice(
          machine.tags.findIndex((x) => x.tagName == tr.tagName),
          1
        );
        if (machine.userAccountId == Globals.DataManager.userId)
          Globals.DataManager.removeTag(tr, "Machines", (c: number) => {});
      }
      for (var ta of tagsAdded) {
        ta.id = machine.id;
        machine.tags.push(ta);
        if (machine.userAccountId == Globals.DataManager.userId)
          Globals.DataManager.addTag(ta, "Machines", (tagResult) => {});
      }

      // machine.systemTags = JSON.stringify(tags);
    }

    static getSystemTags(machine: MachineInfo, shouldUpdate: boolean) {
      if (shouldUpdate || !machine.systemTags) {
        this.updateSystemTags(machine);
      }

      // return JSON.parse(machine.systemTags) as string[];
    }

    static getMaxLocalIds(machine: MachineInfo) {
      var maxIds = { component: 0, chip: 0 };

      if (machine.components) {
        for (var mc of machine.components) {
          if (mc.component) {
            if (
              mc.component.localId &&
              mc.component.localId > maxIds.component
            ) {
              maxIds.component = mc.component.localId;
            }

            if (mc.component.chips) {
              for (var cc of mc.component.chips) {
                if (
                  cc.chip &&
                  cc.chip.localId &&
                  cc.chip.localId > maxIds.chip
                ) {
                  maxIds.chip = cc.chip.localId;
                }
              }
            }
          }
        }
      }

      return maxIds;
    }

    static getData(machine: MachineInfo) {
      return new MachineInfoData(machine.data);
    }
  }

  /** Represents Relationship between machine and board*/
  export class MachineBoard extends DBRecord {
    machineId: number = 0;
    boardId: number = 0;
    id: number = -1;
    isRoot: boolean = false;
    board: WorldInfo;

    constructor(machine: MachineInfo, board: WorldInfo, isRoot: boolean) {
      super();
      if (machine) {
        this.machineId = machine.id;
      }
      if (board) {
        this.boardId = board.id;
      }
      this.isRoot = isRoot;
      this.board = board;
    }

    assignData(data: any, ignoreCache?: boolean) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;

        // dumb properties
        if (data.id !== undefined) {
          this.id = data.id;
        }
        if (data.machineId !== undefined) {
          this.machineId = data.machineId;
        }
        if (data.boardId !== undefined) {
          this.boardId = data.boardId;
        }
        if (data.isRoot !== undefined) {
          this.isRoot = data.isRoot;
        }

        // other DBRecords
        if (data.board !== undefined) {
          if (data.board.id) {
            this.board = !ignoreCache && getBoardById(data.board.id);
          } else if (data.board.shareId) {
            this.board = !ignoreCache && getBoardByShareId(data.board.shareId);
          }

          if (!this.board) {
            this.board = new WorldInfo();
            cacheBoard(this.board);
          }

          this.board.assignData(data.board, ignoreCache);
        } else {
          let refBoard = getBoardById(this.boardId);
          if (refBoard) {
            this.board = refBoard;
          }
        }
      }
    }

    assignUploadData(data: any) {
      if (data && typeof data == "object") {
        this.currentlyInSync = true;
        if (data.id !== undefined && data.id !== null) {
          this.id = data.id;
        }
      }
    }

    getDatabaseId() {
      return this.id;
    }
  }

  /** TODO: What is this? */
  export class UserMigration {
    id: number = -1;
    userAccountId: number = -1;
    legacyUid: string = "";
    migrated: boolean = false;
    data: string = "";

    static toApi(info: UserMigration): UserMigration {
      var userMigration: UserMigration = new UserMigration();

      // never write the id or the migrated prop
      userMigration.id = undefined;
      userMigration.migrated = undefined;

      userMigration.userAccountId = info.userAccountId;
      userMigration.legacyUid = info.legacyUid;
      userMigration.data = info.data;
      return userMigration;
    }
  }

  export class BoardArDataPosition {
    a: number;
    b: number;

    constructor(rotA: number, rotB: number) {
      this.a = rotA;
      this.b = rotB;
    }
  }

  export class WorldInfoArData {
    /** url of mesh, possible format is 'assets/abcdef' for poly.google.com assets */
    mesh: string;
    /** imported from a list of: ["mo01_100_100"] */
    positions: { [shareId: string]: BoardArDataPosition };

    getAssetId(): string {
      var matches = /(?:poly\.google\.com\/view|assets)\/([\w]+)/.exec(
        this.mesh
      );
      if (matches.length > 1) {
        return matches[1].toString();
      }
    }

    constructor(blob: string | any) {
      this.positions = {};
      this.mesh = null;

      if (typeof blob === "string") {
        blob = JSON.parse(blob);
      }
      if (!blob) {
        return;
      }

      this.mesh = blob.mesh;

      if (blob.positions) {
        (<string[]>blob.positions).forEach((p) => {
          // takes something that looks like this: "mo01_100_100"
          var temp: string[] = p.split("_");
          this.positions[temp[0]] = new BoardArDataPosition(
            parseFloat(temp[1]),
            parseFloat(temp[2])
          );
        });
      }
    }

    static toJson(data: WorldInfoArData): string {
      var positions: string[] = [];
      for (const key in data.positions) {
        if (data.positions.hasOwnProperty(key)) {
          const position: BoardArDataPosition = data.positions[key];
          positions.push(`${key}_${position.a}_${position.b}`);
        }
      }
      var temp = {
        mesh: data.mesh,
        positions: positions,
      };
      console.log("arData serialized", JSON.stringify(temp));
      return JSON.stringify(temp);
    }
  }

  //** an intermediate data format for sending information to the XR container app */
  export class ArBoardInfo {
    /** the shareId of the {PolyInfo.WorldInfo} this represents */
    id: string;
    isEdit: boolean;
    isEditable: boolean;
    mesh: string;
    chips: ArBoardChipInfo[];
    soundEffect?: boolean;

    gamepadButtons: ButtonInfo[];

    static toJson(board: ArBoardInfo): string {
      var tempChips: string[] = board.chips.map((chip) => {
        return ArBoardChipInfo.minify(chip);
      });
      return JSON.stringify({
        id: board.id,
        mesh: board.mesh,
        isEdit: board.isEdit,
        isEditable: board.isEditable,
        chips: tempChips,
        soundEffect: board.soundEffect,
        gamepadButtons: board.gamepadButtons,
      });
    }
  }

  export class TagInfo {
    id?: number;
    tagType: string;
    tagName: string;
    system?: boolean;
  }

  /** an interchange dataformat that stores ar-related information about a chip*/
  export class ArBoardChipInfo {
    /** the world/board related id of the chip (i.e. start, mo01, etc.) */
    id: string;
    name: string;
    /** a polar rotation a */
    rotA: number;
    /** a polar rotation b */
    rotB: number;

    scale: number;
    data: string;
    previousId: string;

    boardChipId: number;

    /** returns a minified representation in the format: "mo02_10_10_1_unlocked_mo01" */
    static minify(chip: ArBoardChipInfo): string {
      return [
        chip.id,
        chip.rotA != null ? chip.rotA.toPrecision(5) : chip.rotA,
        chip.rotB != null ? chip.rotB.toPrecision(5) : chip.rotB,
        chip.scale != null ? chip.scale.toPrecision(4) : chip.scale,
        chip.data,
        chip.previousId,
        chip.boardChipId,
        chip.name,
      ].join(",");
    }
  }

  export enum PartType {
    chip = 0,
    component = 1,
    machine = 2,
    machineComponent = 3,
  }

  export interface gamePreferences {
    casual: boolean;
  }

  export type PartReference = { type: number; id: number };
  export type LibraryPage = {
    name: string;
    parts: PartReference[];
    showInfo: boolean;
  };
  export type LibraryTab = { tab: string; pages: LibraryPage[] };

  // cached things

  export var machines: MachineInfo[] = [];
  export var machineBoards: MachineBoard[] = [];
  export var boards: WorldInfo[] = [];
  export var boardChips: BoardChip[] = [];
  export var chips: Chip[] = [];
  export var machineComponents: MachineComponent[] = [];
  export var components: ComponentInfo[] = [];
  export var componentChips: ComponentChip[] = [];
  export var machineProgresses: Progress.MachineProgress[] = [];
  export var boardProgresses: Progress.BoardProgress[] = [];
  export var componentProgresses: Progress.ComponentProgress[] = [];
  export var chipProgresses: Progress.ChipProgress[] = [];

  export function clearCache() {
    machines = [];
    machineBoards = [];
    boards = [];
    boardChips = [];
    chips = [];
    machineComponents = [];
    components = [];
    componentChips = [];
    machineProgresses = [];
    boardProgresses = [];
    componentProgresses = [];
    chipProgresses = [];
  }

  export function cacheMachine(entry: MachineInfo) {
    machines.push(entry);
  }

  export function getMachineById(id: number): MachineInfo {
    for (var entry of machines) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function getMachineByShareId(shareId: string): MachineInfo {
    for (var entry of machines) {
      if (entry.shareId == shareId) {
        return entry;
      }
    }
    return null;
  }

  export function cacheMachineBoard(entry: MachineBoard) {
    machineBoards.push(entry);
  }

  export function getMachineBoardById(id: number): MachineBoard {
    for (var entry of machineBoards) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function cacheBoard(entry: WorldInfo) {
    boards.push(entry);
  }

  export function getBoardById(id: number): WorldInfo {
    for (var entry of boards) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function getBoardByShareId(shareId: string): WorldInfo {
    for (var entry of boards) {
      if (entry.shareId == shareId) {
        return entry;
      }
    }
    return null;
  }

  export function cacheBoardChip(entry: BoardChip) {
    boardChips.push(entry);
  }

  export function getBoardChipById(id: number): BoardChip {
    for (var entry of boardChips) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function cacheChip(entry: Chip) {
    chips.push(entry);
  }

  export function getChipById(id: number): Chip {
    for (var entry of chips) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function getChipByShareId(shareId: string): Chip {
    for (var entry of chips) {
      if (entry.shareId == shareId) {
        return entry;
      }
    }
    return null;
  }

  export function cacheMachineComponent(entry: MachineComponent) {
    machineComponents.push(entry);
  }

  export function getMachineComponentById(id: number): MachineComponent {
    for (var entry of machineComponents) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function cacheComponent(entry: ComponentInfo) {
    components.push(entry);
  }

  export function getComponentById(id: number): ComponentInfo {
    for (var entry of components) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function getComponentByShareId(shareId: string): ComponentInfo {
    for (var entry of components) {
      if (entry.shareId == shareId) {
        return entry;
      }
    }
    return null;
  }

  export function cacheComponentChip(entry: ComponentChip) {
    componentChips.push(entry);
  }

  export function getComponentChipById(id: number): ComponentChip {
    for (var entry of componentChips) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function cacheMachineProgress(entry: Progress.MachineProgress) {
    machineProgresses.push(entry);
  }

  export function getMachineProgressById(id: number): Progress.MachineProgress {
    for (var entry of machineProgresses) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function cacheBoardProgress(entry: Progress.BoardProgress) {
    boardProgresses.push(entry);
  }

  export function getBoardProgressById(id: number): Progress.BoardProgress {
    for (var entry of boardProgresses) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function cacheComponentProgress(entry: Progress.ComponentProgress) {
    componentProgresses.push(entry);
  }

  export function getComponentProgressById(
    id: number
  ): Progress.ComponentProgress {
    for (var entry of componentProgresses) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }

  export function cacheChipProgress(entry: Progress.ChipProgress) {
    chipProgresses.push(entry);
  }

  export function getChipProgressById(id: number): Progress.ChipProgress {
    for (var entry of chipProgresses) {
      if (entry.id == id) {
        return entry;
      }
    }
    return null;
  }
}
