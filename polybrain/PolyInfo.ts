import { ModDefinition, BlockDefinition, PuzzleDefinitionJson, PuzzleConverter } from "./../workspace/PuzzleData";
import { Progress } from "./Progress";
import { Globals } from "./../Globals";
import { ButtonInfo } from "../gamepad/ButtonInfo";
import { Polyscript } from "./../polyscript/Polyscript";
import {getSystemTags} from "./SystemTags";
import i18next from "i18next";

/** namespace for all info classes related to brain. import this to get everything info related */
export namespace PolyInfo {
  /** stores data for a board - is board with chips and portals on backend */
  export class WorldInfo {
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
    systemTags : string;

    // TODO: encode 'gamepad' properties into the 'data' prop

    constructor() {
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
      if (!worldInfo.arData || typeof worldInfo.arData === 'string') {
        worldInfo.arData = new WorldInfoArData(worldInfo.arData);
      }
      return <WorldInfoArData>(worldInfo.arData);
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
  export class MachineComponent {
    machineId: number = 0;
    componentId: number = 0;
    parentMachineComponentId: number = 0;
    component:ComponentInfo;
    id: number = -1;
    position:transform3D;
    isForking? : boolean;

    constructor(machine: MachineInfo, component: ComponentInfo) {
      this.machineId = machine.id;
      this.componentId = component.id;
      this.component = component;
      this.position = {x:0,y:0,z:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1};
    }
  }

  export interface transform3D
  {
    x:number;
    y:number;
    z:number;
    rx:number;
    ry:number;
    rz:number;
    sx:number;
    sy:number;
    sz:number;
    anchor?:number;
    rootAnchor?:number;
  }

  export enum ComponentType
  {
    basic = 0,
    tray,
    poly,
    camera,
    challenge_lesson = 100,
    challenge_goalchips,
    challenge_feedback
  }

  export class ComponentInfo
  {
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
    strings:StringDict = null;
    type: number = ComponentType.basic;
    memory: string;
    systemTags: string;
    parsedMemory? : { [key:string]: BlockDefinition };
    userProgress: Progress.ComponentProgress[] = [];
    moddable? : boolean;
    // arData: string | WorldInfoArData = null;

    static hasSystemTag(component: ComponentInfo, tag : string)
    {
      if (!component || !component.systemTags)
      {
        return false;
      }
      var regex = new RegExp("(?:^|,)" + tag + "(?:$|,)");
      return regex.test(component.systemTags);
    }

    static getParsedMemory(component : ComponentInfo)
    {
      if (component.parsedMemory)
      {
        return component.parsedMemory;
      }
      if (component.memory)
      {
        component.parsedMemory = JSON.parse(component.memory);
      }
      else
      {
        component.parsedMemory = null;
      }
      return component.parsedMemory;
    }

    static setMemoryField(component: ComponentInfo, key : string, value : Polyscript.Block)
    {
      if (!component.parsedMemory)
      {
        component.parsedMemory = {};
      }
      if (value)
      {
        component.parsedMemory[key] = BlockDefinition.fromBlock(value);
      }
      else
      {
        delete component.parsedMemory[key];
      }
      component.memory = JSON.stringify(component.parsedMemory);
    }
  }

  export class ComponentChip
  {
    /** relational id to {PolyInfo.WorldInfo} datamodel on backend */
    componentId: number = 0;
    /** relational id to Chip datamodel on backend */
    chipId: number = 0;
    /** data model unique id from backend */
    id: number = -1;
    data: string;
    position: transform3D;
    chip: Chip;
    isForking? : boolean;


    constructor(chip: Chip, componentId: number) {
      this.id = -1;
      this.chip = chip;
      this.chipId = chip.id;
      this.componentId = componentId;
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
      if(this.id == undefined) this.id = chip.componentGridCode;
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
      if(this.id == undefined) this.id = chip.componentGridCode;
      this.worldid = chip.boardId;

    }

  }

  /** stores info for a mod reference. can reference a mod on a different board */
  export class BoardChip {
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
      this.id = -1;
      this.chip = chip;
      this.chipId = chip.id;
      this.boardId = boardId;
      this.boardGridCode = boardGridCode;
      this.componentGridCode = boardGridCode;
    }
  }

  export class Chip {
    userAccountId: number = -1;
    shareId: string = "";
    name: string = "";
    /**stringified PuzzleDefinition*/
    data: string = "";
    parsedData : PuzzleDefinitionJson = null;
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
    strings:StringDict = null;
    moddable? : boolean;

    static getParsedPuzzle(chip : Chip) : PuzzleDefinitionJson
    {
      if (chip.parsedData)
      {
        return chip.parsedData;
      }

      try
      {
        chip.parsedData = PuzzleConverter.parsePuzzle(chip.data);
      }
      catch (e)
      {
        chip.parsedData = null;
      }

      return chip.parsedData;
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

  export class Portal {

  }


  /** info for the start portal */
  export class StartInfo extends BlockInfo { };
  /** info for the position of poly ont he board */
  export class PolyInfo extends BlockInfo { };

  export interface machineJudge{
    judge: boolean;
       prizeName: string;
       prizeId: number;
       survey: any[];
  }

  /** contains info for a machine */
  export class MachineInfo {
    judging?:machineJudge;
    version:number = 1;
    userAccountId: number = -1;
    uuid: string = "";
    shareId: string = "";
    name: string = "";
    tags : TagInfo[];
    tagArray: string[];
    systemTags : string;
    active: boolean = true;
    status: number = 0;
    originalMachineHistoryId: number;
    isDefault: boolean = false;
    id: number = -1;
    rootBoardId: number = 0;
    data: string = null;
    strings:StringDict = null;

    isEditable: boolean = true;
    userProgress: Progress.MachineProgress[] = [];
    components:MachineComponent[];
    boards:MachineBoard[];

    /**
      * @param id - id of the machine
      * @param display - display text for the machine
      * @param code - code used to get the machine
     */
    constructor(info: WorldInfo, name: string) {

      this.name = name;
      this.isDefault = false;
      this.id = -1;
      this.active = true;
      if (info == null)
      {
        this.version = 2;
        return;
      }
      this.userAccountId = info.userAccountId;
      this.active = info.active;


      this.rootBoardId = info.id;
    }



    updateInfo(info: MachineInfo) {
      this.version = info.version;
      this.userAccountId = info.userAccountId;
      this.uuid = info.uuid;
      this.shareId = info.shareId;
      this.name = info.name;
      this.tags = info.tags;
      this.tagArray = MachineInfo.getTagList(this);
      this.active = info.active;
      this.status = info.status;
      this.originalMachineHistoryId = info.originalMachineHistoryId;
      this.isDefault = info.isDefault;
      this.id = info.id;
      this.isEditable = info.isEditable;
      this.rootBoardId = info.rootBoardId;
      this.userProgress = info.userProgress;
      this.boards = info.boards;
      this.components = info.components;
      this.data = info.data;
      this.strings = info.strings;
      this.judging = info.judging;
    }

    static isFullyLoaded(info : MachineInfo)
    {
      if ((info.boards == null || info.boards.length == 0) && (info.components == null || info.components.length == 0))
      {
        return false;
      }

      if (info.boards)
      {
        for (var board of info.boards)
        {
          if (!board.board || !board.board.chips)
          {
            return false;
          }
          else
          {
            for (let chip of board.board.chips)
            {
              if (!chip.chip)
              {
                return false;
              }
            }
          }
        }
      }

      if (info.components)
      {
        for (var component of info.components)
        {
          if (!component.component || !component.component.chips)
          {
            return false;
          }
          else
          {
            for (let chip of component.component.chips)
            {
              if (!chip.chip)
              {
                return false;
              }
            }
          }
        }
      }

      return true;
    }

    static isLegacy(info : MachineInfo)
    {
      return !info.version || info.version < 2;
    }

    static getTagList(machine : MachineInfo) : string[]
    {
      if (machine.tagArray)
      {
        return machine.tagArray;
      }
      else if (!machine.tags)
      {
        return [];
      }
      else
      {
        if(machine.tags instanceof String) machine.tags = JSON.parse(<any>machine.tags);
        if(machine.tags.length > 0)
        {
          var result = [];
          for(var t of machine.tags)
          {

            result.push(t.tagName);
          }
          return result;
        }
        else return [];
      }
    }

    static setTagList(machine : MachineInfo, tags : string[])
    {
      if (machine)
      {
        machine.tagArray = tags;
      }
    }

    static pushTag(machine : MachineInfo, tag : string)
    {
      if (!machine)
      {
        console.log("no machine");
        return;
      }

      if (tag == '')
      {
        console.log("empty tag");
        return;
      }

      if (tag.search(/\s/) != -1)
      {
        console.log("whitespace");
        return;
      }

      if (tag.search('#') != -1)
      {
        console.log("hashtag");
        return;
      }

      // if the tag already exists, delete it so it will be moved to the end of the list
      MachineInfo.deleteTag(machine, tag);

      machine.tagArray.splice(0, 0, tag);
    }

    static addTag(machine : MachineInfo, tag : string)
    {

      if (!machine)
      {
        console.log("no machine");
        return;
      }

      if (tag == '')
      {
        console.log("empty tag");
        return;
      }

      if (tag.search(/\s/) != -1)
      {
        tag = tag.replace(/\s/g, "");
        console.log("whitespace");
        //return;
      }

      if (tag.search('#') != -1)
      {
        console.log("hashtag");
        return;
      }

      // if the tag already exists, delete it so it will be moved to the end of the list
      MachineInfo.sortTag(machine, tag);
      machine.tagArray.push(tag);

      var tagInfo:TagInfo =
      {
        id:machine.id,
        tagName:tag,
        tagType:"Custom"
      };
      if(machine.tags.findIndex(someInfo => someInfo.tagName == tag) == -1)
      {
        machine.tags.push(tagInfo);
        Globals.DataManager.addTag(tagInfo,"Machines", (info) => {



        })
      }

    }

    static deleteTag(machine : MachineInfo, tag : string)
    {
      if (machine)
      {
        var tagInfo = machine.tags.find(someTag => someTag.tagName == tag);
        if(tagInfo)
        {
          tagInfo.id = machine.id;
          Globals.DataManager.removeTag(tagInfo,"Machines", (count) =>{
            if(count > 0) machine.tags.splice(machine.tags.indexOf(tagInfo),1);
          })
        }
        MachineInfo.setTagList(machine, MachineInfo.getTagList(machine).filter(value => value != tag));
      }
    }

    static sortTag(machine : MachineInfo, tag : string)
    {
      if (machine)
      {
        MachineInfo.setTagList(machine, MachineInfo.getTagList(machine).filter(value => value != tag));
      }
    }

    static updateSystemTags(machine : MachineInfo)
    {
      var chipStringses : StringDict[] = [];
      if (machine.boards)
      {
        for (var board of machine.boards)
        {
          if (board && board.board && board.board.chips)
          {
            for (var chip of board.board.chips)
            {
              chipStringses.push(chip.chip.strings);
            }
          }
        }
      }

      var tags = getSystemTags(machine.strings, chipStringses, machine.version); // getSystemTags from SystemTags.ts
      var newTags:TagInfo[] = [];
      for(var t of tags)
      {
        var isVersion = t.charAt(0) == "v" && !isNaN(parseInt(t.charAt(1)))
        var tag:TagInfo =
        {
          id:machine.id,
          tagName:t,
          tagType:isVersion ? "version" : "language",
          system:true
        }
        newTags.push(tag);
      }
      if(!machine.tags) machine.tags = [];
      var systemExisting = machine.tags.filter(x => x.system);

      var tagsRemoved = systemExisting.filter(x => !newTags.find(y => y.tagName == x.tagName));
      var tagsAdded = newTags.filter(x => !systemExisting.find(y => y.tagName == x.tagName));

      for(var tr of tagsRemoved)
      {
        tr.id = machine.id;
        machine.tags.splice(machine.tags.findIndex(x => x.tagName == tr.tagName), 1);
        if(machine.userAccountId == Globals.DataManager.userId)  Globals.DataManager.removeTag(tr,"Machines", (c:number) =>{});
      }
      for(var ta of tagsAdded)
      {
        ta.id = machine.id;
        machine.tags.push(ta);
        if(machine.userAccountId == Globals.DataManager.userId) Globals.DataManager.addTag(ta,"Machines", (tagResult) =>{});
      }


      // machine.systemTags = JSON.stringify(tags);
    }

    static getSystemTags(machine : MachineInfo, shouldUpdate : boolean)
    {
      if (shouldUpdate || !machine.systemTags)
      {
        this.updateSystemTags(machine);
      }

      // return JSON.parse(machine.systemTags) as string[];
    }
  }


  /** Represents Relationship between machine and board*/
  export class MachineBoard {
    machineId: number = 0;
    boardId: number = 0;
    id: number = -1
    isRoot: boolean = false;
    board:WorldInfo;


    constructor(machine: MachineInfo, board: WorldInfo, isRoot: boolean) {
      this.machineId = machine.id;
      this.boardId = board.id;
      this.isRoot = isRoot;
      this.board = board;
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
    positions: { [shareId: string]: BoardArDataPosition; };

    getAssetId():string {
      var matches = /(?:poly\.google\.com\/view|assets)\/([\w]+)/.exec(this.mesh);
      if(matches.length > 1) {
        return matches[1].toString();
      }
    }

    constructor(blob: string | any) {

      this.positions = {};
      this.mesh = null;

      if (typeof blob === 'string') {
        blob = JSON.parse(blob);
      }
      if (!blob) {
        return;
      }

      this.mesh = blob.mesh;

      if (blob.positions) {
        (<string[]>(blob.positions)).forEach(p => {

          // takes something that looks like this: "mo01_100_100"
          var temp: string[] = p.split("_");
          this.positions[temp[0]] = new BoardArDataPosition(parseFloat(temp[1]), parseFloat(temp[2]));
        })
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
        positions: positions
      }
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
      var tempChips: string[] = board.chips.map(chip => {
        return ArBoardChipInfo.minify(chip);
      });
      return JSON.stringify({
        id: board.id,
        mesh: board.mesh,
        isEdit: board.isEdit,
        isEditable: board.isEditable,
        chips: tempChips,
        soundEffect: board.soundEffect,
        gamepadButtons: board.gamepadButtons
      });
    }
  }

  export interface TagInfo
  {
    id?:number;
    tagType:string;
    tagName:string;
    system?:boolean;
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

    boardChipId: number

    /** returns a minified representation in the format: "mo02_10_10_1_unlocked_mo01" */
    static minify(chip: ArBoardChipInfo): string {
      return [
        chip.id,
        (chip.rotA != null ? chip.rotA.toPrecision(5) : chip.rotA),
        (chip.rotB != null ? chip.rotB.toPrecision(5) : chip.rotB),
        (chip.scale != null ? chip.scale.toPrecision(4) : chip.scale),
        chip.data,
        chip.previousId,
        chip.boardChipId,
        chip.name
      ].join(",");
    }
  }

  export enum PartType {
    chip = 0,
    component = 1,
    machine = 2,
    machineComponent = 3
  };

  export type PartReference = {type : number, id : number};
  export type LibraryPage = {name : string, parts : PartReference[]};
}
