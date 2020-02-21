import {Polyscript} from "../polyscript/Polyscript";

export class PuzzleConverter
{
  static ValidatePuzzleDefinition(pd : PuzzleDefinition) : string
  {
    var ws = Polyscript.Workspace.deserialize (pd.workspace);

    if (ws == null) {
      return "Error parsing workspace.";
    }

    if (ws.getStack ("Poly") == null) {
      return "Workspace must have a file named Poly.";
    }

    var solution = Polyscript.Workspace.deserialize (pd.solution);

    if (solution == null) {
      return "Error parsing solution.";
    }

    if (solution.stacks.length > 0 && solution.getStack ("Solution") == null && solution.getStack ("Poly") == null) {
      return "Solution must have a file named Solution or Poly.";
    }

    var m = InputDefinition.regex.exec(pd.inputs);

    if (m == null) {
      return "Error parsing inputs.";
    }

    // trailing space added due to regex limitations
    m = AvailableBlockDefinition.regex.exec(pd.blocks + " ");

    if (m == null) {
      console.log("abd regex: " + AvailableBlockDefinition.regex.source + " applied to " + pd.blocks);
      return "Error parsing available blocks.";
    }

    m = FileMetadata.regex.exec(pd.metadata + " ");

    if (m == null) {
      return "Error parsing metadata.";
    }

    return "";
  }

  static convertPuzzleDefinition(pd : PuzzleDefinition) : PuzzleDefinitionJson
  {
    var validationResult = this.ValidatePuzzleDefinition(pd);
    if (validationResult != "")
    {
      console.error("Invalid puzzle: " + validationResult);
      return null;
    }

    var pdj = new PuzzleDefinitionJson();

    pdj.goal = pd.goal;
    pdj.workspace = this.convertWorkspaceString(pd.workspace);
    pdj.solution = this.convertWorkspaceString(pd.solution);
    pdj.blocks = this.convertBlocksString(pd.blocks);
    pdj.inputs = this.convertInputsString(pd.inputs);
    pdj.metadata = this.convertMetadataString(pd.metadata);
    pdj.chipType = "lesson";

    return pdj;
  }

  static convertWorkspaceString(wsstr : string) : StackDefinition[]
  {
    var ws : StackDefinition[] = [];

    var workspace = Polyscript.Workspace.deserialize(wsstr);

    if (workspace != null)
    {
      for (var stack of workspace.stacks)
      {
        var sd = new StackDefinition(stack.name);

        for (var block of stack.list)
        {
          sd.blocks.push(BlockDefinition.fromBlock(block));
        }

        for (var input of stack.inputs)
        {
          sd.inputs.push(input);
        }

        ws.push(sd);
      }
    }

    return ws;
  }

  static convertBlocksString(blocks : string) : BlockSourceDefinition[]
  {
    var availableBlocks : BlockSourceDefinition[] = [];

		if (AvailableBlockDefinition.regex.exec(blocks + " ")) {

      var m : RegExpExecArray;
      var customPaneDefinition = null;
      var inCustomPane = false;

      while (m = AvailableBlockDefinition.tokenRegex.exec(blocks + " "))
      {
        var sourceLimiters = m[1];
        var numberPane = m[2];
  			var mathPane = m[3];
  			var fullMathPane = m[4];
  			var booleanPane = m[5];
  			var variablePane = m[6];
  			var fullVariablePane = m[7];
  			var blockPane = m[8];
  			var functionPane = m[9];
  			var numberPaneCustom = m[10];
  			var colorPane = m[11];
        var startCustomPane = m[12];
        var endCustomPane = m[13];

        if (numberPane != null) {
        	availableBlocks.push (BlockSourceDefinition.fromPane("NumberPane"));
        }

  			if (mathPane != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("MathPane"));
  			}

  			if (fullMathPane != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("FullMathPane"));
  			}

  			if (booleanPane != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("BoolPane"));
  			}

  			if (variablePane != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("VariablePane"));
  			}

  			if (fullVariablePane != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("FullVariablePane"));
  			}

  			if (blockPane != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("BlockPane"));
  			}

  			if (functionPane != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("FunctionPane"));
  			}

  			if (numberPaneCustom != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("NumberToggleCustom"));
  			}

        if (colorPane != null) {
  				availableBlocks.push (BlockSourceDefinition.fromPane("ColorToggle"));
        }

        if (startCustomPane != null) {
          customPaneDefinition = BlockSourceDefinition.fromPane("CustomPane");
          customPaneDefinition.children = [];
          availableBlocks.push(customPaneDefinition);
          inCustomPane = true;
        }

        if (endCustomPane != null)
        {
          if (!inCustomPane)
          {
            throw "Invalid end of custom pane symbol '}'";
          }
          inCustomPane = false;
        }

        if (sourceLimiters != null) {
          var countString = sourceLimiters.substr (1, sourceLimiters.length - 2);

          var count = Number.parseInt (countString);

          if (availableBlocks.length > 0)
          {
            availableBlocks[availableBlocks.length - 1].count = count;
          }
        }

        for (var i = 0; i < Polyscript.Workspace.getTypeList().length; i++) {
          var block = m[i + 14];

          if (block != null)
          {
            var blockObject = Polyscript.CreateBlock(block);

            if (inCustomPane)
            {
              customPaneDefinition.children.push(BlockSourceDefinition.fromBlock(blockObject));
            }
            else
            {
    					availableBlocks.push (BlockSourceDefinition.fromBlock(blockObject));
            }
            break;
          }
  			}
      }
		}

    return availableBlocks;
  }

  static convertInputsString(inputs : string) : InputDefinitionJson[]
	{
		// handle inputs
		var m = InputDefinition.regex.exec(inputs);

    var inputDefinitions : InputDefinitionJson[] = [];

		if (m != null)
		{
      while (m = InputDefinition.inputRegex.exec(inputs))
      {
        var inputDeclaration = m[0];
        var inputName = m[1];

        var inputDef = new InputDefinition();
        inputDef.name = inputName;
        inputDef.index = m.index;
        inputDef.length = m[0].length;
        inputDef.inputSequence = [];

        var inputList = m[2];

        while (m = InputDefinition.tokenRegex.exec(inputList))
        {
          for (var i = 0; i < Polyscript.Workspace.getTypeList().length; i++)
          {
            var block = m[i+1];
            if (block != null)
            {
              var input = new BlockInput();
              input.definition = block;
              input.index = m.index;
              input.groupIndex = i;

              inputDef.inputSequence.push(input);
            }
          }
        }

        inputDefinitions.push(inputDef.toInputDefJson());
      }
		}

    return inputDefinitions;
	}

  static convertMetadataString (metadata : string) : PuzzleMetadata
  {
		// handle metadata
    var puzzleMetadata = new PuzzleMetadata();

		var m = FileMetadata.regex.exec(metadata + " ");

    //var puzzleMetadata : {[key:string] : FileMetadata} = {};

		if (m != null)
		{

      while (m = FileMetadata.tokenRegex.exec(metadata + " "))
      {
        var tokenMatch = m[0];
        // group 0: overall
        // group 1: file declarations
        // group 2: file names
        // group 3: locks
        // group 4: unlocks
        // group 5: hides
        // group 6: infinite
        // group 7: sequence
        // group 8: requiremod
        // group 9: type

        if (m[1])
        {
          var fileTokenMatch = m[1];
          var fmd = new FileMetadata();
          fmd.name = m[2];
          while (m = FileMetadata.fileTokenRegex.exec(fileTokenMatch))
          {
            if (m[1])
            {
              if (m[1] == "lock")
  						{
  							fmd.lockIndex = 0;
  						}
  						else
  						{
  							fmd.lockIndex = Number.parseInt (m[1].substr (4));
  						}
            }
            else if (m[2])
            {
              if (m[2] == "unlock")
  						{
  							fmd.unlocked = true;
  						}
  						else
  						{
  							fmd.unlockedIndices.push(Number.parseInt (m[2].substr (6)));
  						}
            }
            else if (m[3])
            {
              fmd.hidden = true;
            }
          }

          puzzleMetadata.stackMetadata[fmd.name] = fmd;
        }
        else if (m[6])
        {
          if (m[6] == "infinite")
  				{
  					puzzleMetadata.infiniteProgramCutoff = 50;
  				}
  				else
  				{
  					puzzleMetadata.infiniteProgramCutoff = Number.parseInt (m[6].substr (8));
  				}
        }
        else if (m[7])
        {
          if (m[7] == "sequence")
  				{
  					puzzleMetadata.sequenceLength = 10;
  					puzzleMetadata.sequenceMaxSteps = 250;
  				}
  				else
  				{
  					var underscoreIndex = m[7].indexOf ('_');

  					if (underscoreIndex == -1) {
  						puzzleMetadata.sequenceLength = Number.parseInt (m[7].substr (8));
  						puzzleMetadata.sequenceMaxSteps = 250;
  					}
  					else
  					{
  						puzzleMetadata.sequenceLength = Number.parseInt (m[7].substr (8, underscoreIndex - 8));
  						puzzleMetadata.sequenceMaxSteps = Number.parseInt (m[7].substr (underscoreIndex + 1));
  					}
  				}
        }
        else if (m[8])
        {
          puzzleMetadata.requireMod = true;
        }
        else if (m[9])
        {
          // TODO: type metadata not implemented
        }
      }
		}

    return puzzleMetadata;
  }

  static parsePuzzle(data : string) : PuzzleDefinitionJson
  {
    // Note: PuzzleDefinitionJson has no non-field instance
    // members, so simply casting the generic object is safe.
    var pd:PuzzleDefinitionJson | PuzzleDefinition = JSON.parse(data);

    if (Array.isArray(pd.inputs))
    {
      // we have a PuzzleDefinitionJson
      var pdj = pd as PuzzleDefinitionJson;
      if (pdj.chipType === undefined)
      {
        pdj.chipType = "lesson";
      }
      return pdj;
    }
    else
    {
      // we have a PuzzleDefinition

      // handle missing fields
      if (pd.blocks === undefined)
      {
        pd.blocks = "";
      }
      if (pd.inputs === undefined)
      {
        pd.inputs = "";
      }
      if (pd.metadata === undefined)
      {
        pd.metadata = "";
      }
      if (pd.solution === undefined)
      {
        pd.solution = "";
      }
      if (pd.workspace === undefined)
      {
        pd.workspace = "";
      }

      return PuzzleConverter.convertPuzzleDefinition(pd as PuzzleDefinition);
    }
  }

  static loadWorkspaceJson (stacks : StackDefinition[]) : Polyscript.Workspace
  {
    var workspace = new Polyscript.Workspace();

    for (var stackDef of stacks)
    {
      var stack = workspace.createStack(stackDef.name);

      for (var blockDef of stackDef.blocks)
      {
        stack.list.push(Polyscript.CreateBlock(blockDef.data));
      }

      for (var input of stackDef.inputs)
      {
        stack.inputs.push(input);
      }
    }

    return workspace;
  }

  static isSandbox (puzzle : PuzzleDefinitionJson) : boolean
  {
    if (puzzle.solution == null || puzzle.solution.length == 0 || puzzle.solution[0].blocks.length == 0 || JSON.stringify(puzzle.solution) == JSON.stringify(puzzle.workspace))
    {
      return true;
    }

    return false;
  }
}

export class BlockDefinition
{
  public type : number;
  public data : string;

  static fromSerialized (serial : string) : BlockDefinition
  {
    var bd = new BlockDefinition();

    var block = Polyscript.CreateBlock(serial);
    var typeString = block.types[block.types.length - 1] as keyof typeof Polyscript.TypeMap;
    bd.type = Polyscript.TypeMap[typeString];
    if (bd.type == undefined)
    {
      bd.type = Polyscript.TypeMap.Unknown;
    }
    bd.data = block.serialize(); // handles the case of an invalid input; output will be an error block rather than the original serial pattern

    return bd;
  }

  static fromBlock (block : Polyscript.Block) : BlockDefinition
  {
    var bd = new BlockDefinition();
    var typeString = block.types[block.types.length - 1] as keyof typeof Polyscript.TypeMap;
    bd.type = Polyscript.TypeMap[typeString];
    if (bd.type == undefined)
    {
      bd.type = Polyscript.TypeMap.Unknown;
    }
    bd.data = block.serialize();

    return bd;
  }

  static cloneBlockDefinition(orig : BlockDefinition) : BlockDefinition
  {
    var bd = new BlockDefinition();
    bd.type = orig.type;
    bd.data = orig.data;
    return bd;
  }
}

export class InputDefinitionJson
{
  public name : string = "";
  public blocks : BlockDefinition[] = [];
}

export class StackDefinition
{
  public name : string = "";
  public blocks : BlockDefinition[] = [];
  public inputs : string[] = [];

  constructor (name : string)
  {
    this.name = name;
  }

  static fromStack(stack : Polyscript.Stack)
  {
    var sd = new StackDefinition(stack.name);
    sd.blocks = stack.list.map(BlockDefinition.fromBlock);

    sd.inputs = stack.inputs;
    return sd;
  }

  static cloneStackDefinition (orig : StackDefinition) : StackDefinition
  {
    var sd = new StackDefinition(orig.name);
    sd.blocks = orig.blocks.map((x) => BlockDefinition.cloneBlockDefinition(x));
    sd.inputs = orig.inputs.slice();

    return sd;
  }
}

export class PuzzleMetadata
{
  public stackMetadata : {[key:string]:FileMetadata} = {};
  public solutionMetadata : {[key:string]:FileMetadata} = {};
  public requireMod : boolean = false;
  public infiniteProgramCutoff : number = -1;
	public sequenceLength : number = -1;
	public sequenceMaxSteps : number= -1;
  public numberMode : Polyscript.NumberMode = Polyscript.NumberMode.DECIMAL;
  public showGoal : boolean = true;
  public icon? : string;
  public showAtStart? : boolean;
}

export type ChipType = "lesson" | "engine" | "goal" | "sensor" | "media" | "function" | "turtle" | "text";
export type SensorType = "AButton" | "BButton" | "DUp" | "DDown" | "DLeft" | "DRight" | "touch" | "distance";
export type SensorTrigger = "press" | "hold" | "change" | "always";
export type InputInfo = { name : string, type : "boolean" | "number" | "object"};
export type SensorInfo = { trigger : SensorTrigger, inputs : InputInfo[]};

export var SensorInfoMap : {[S in SensorType] : SensorInfo} = {
  "AButton" : { trigger : "press", inputs: [{name : "a", type : "boolean"}]},
  "BButton" : { trigger : "press", inputs: [{name : "b", type : "boolean"}]},
  "DUp" : { trigger : "hold", inputs: [{name : "u", type : "boolean"}]},
  "DDown" : { trigger : "hold", inputs: [{name : "d", type : "boolean"}]},
  "DLeft" : { trigger : "hold", inputs: [{name : "l", type : "boolean"}]},
  "DRight" : { trigger : "hold", inputs: [{name : "r", type : "boolean"}]},
  "touch" : { trigger : "hold", inputs: [{name: "t", type : "boolean"}]},
  "distance" : { trigger : "change", inputs: [{name: "d", type : "number"}]}
}

export class PuzzleDefinitionJson
{
  public goal : string = "";
  public inputs : InputDefinitionJson[] = [];
  public inputWorkspaces : StackDefinition[][] = [];
  public workspace : StackDefinition[] = [];
  public solution : StackDefinition[] = [];
  public blocks : BlockSourceDefinition[] = [];
  public metadata : PuzzleMetadata = new PuzzleMetadata();
  public version : number = 0;
  public solutionModified : boolean = true;
  public chipType : ChipType = "lesson";
  public sensorType? : SensorType | undefined;

  static workspaceToJson(ws : Polyscript.Workspace) : StackDefinition[]
  {
    return ws.stacks.map(StackDefinition.fromStack);
  }

  static defaultPuzzleDefinition(chipType : ChipType = "lesson", sensorType : SensorType = undefined) : PuzzleDefinitionJson
  {
    var pdj = new PuzzleDefinitionJson();
    pdj.workspace.push(new StackDefinition("Poly"));
    pdj.chipType = chipType;
    pdj.sensorType = sensorType;

    if (chipType == "lesson")
    {
      pdj.solution.push(new StackDefinition("Poly"));

      pdj.solutionModified = false;
    }
    else if (chipType == "sensor")
    {
      var sensorInfo = SensorInfoMap[sensorType];
      if (sensorInfo)
      {
        pdj.workspace[0].inputs = sensorInfo.inputs.map(x => x.name);
        var polyStack = new StackDefinition("Poly");
        var inputWS : StackDefinition[] = [polyStack];
        for (var input of sensorInfo.inputs)
        {
          if (input.type == "boolean")
          {
            polyStack.blocks.push(BlockDefinition.fromSerialized("rand"));
            polyStack.blocks.push(BlockDefinition.fromSerialized("0.5"));
            polyStack.blocks.push(BlockDefinition.fromSerialized("<"));
          }
          else if (input.type == "number")
          {
            polyStack.blocks.push(BlockDefinition.fromSerialized("rand"));
            polyStack.blocks.push(BlockDefinition.fromSerialized("10"));
            polyStack.blocks.push(BlockDefinition.fromSerialized("*"));
            polyStack.blocks.push(BlockDefinition.fromSerialized("floor"));
          }
        }

        pdj.inputWorkspaces.push(inputWS);
      }
    }
    else if (chipType == "turtle")
    {
      pdj.blocks = [BlockSourceDefinition.fromPane(Polyscript.TypeMap.numberPane), BlockSourceDefinition.fromPane(Polyscript.TypeMap.mathPane), BlockSourceDefinition.fromPane(Polyscript.TypeMap.ARPane)];
      var polyStack = pdj.workspace[0];
      polyStack.blocks.push(BlockDefinition.fromSerialized("2"));
      polyStack.blocks.push(BlockDefinition.fromSerialized("ARSimpleMoveForward"));
      polyStack.blocks.push(BlockDefinition.fromSerialized("1"));
      polyStack.blocks.push(BlockDefinition.fromSerialized("ARSimpleMoveRight"));
    }
    else if (chipType == "text")
    {
      pdj.workspace = [];
    }

    return pdj;
  }
}

// export class ModDefinitionJson extends PuzzleDefinitionJson
// {
//   public id : string;
// 	public display : string;
// 	public difficulty : number = 1;
// 	public hints : string[] = [];
// 	public timeBeforeHint : number = 35;
// 	public triesBeforeHint : number = 2;
// 	public editable : boolean = true;
//
//   public clone() : ModDefinitionJson
// 	{
//     throw "NOT YET IMPLEMENTED; need to deep copy fields";
//     //
//     // var c : ModDefinitionJson = new ModDefinitionJson();
// 		// c.goal = this.goal;
// 		// c.inputs = this.inputs;
// 		// c.workspace = this.workspace;
// 		// c.solution = this.solution;
// 		// c.blocks = this.blocks;
// 		// c.metadata = this.metadata;
// 		// c.id = this.id;
// 		// c.display = this.display;
// 		// c.difficulty = this.difficulty;
// 		// c.hints = this.hints;
// 		// c.timeBeforeHint = this.timeBeforeHint;
// 		// c.triesBeforeHint = this.triesBeforeHint;
// 		// c.editable = this.editable;
// 		// return c;
// 	}
// }

export class PuzzleDefinition
{
  public goal : string = "";
  public inputs : string = "";
  public workspace : string = "";
  public solution : string = "";
  public blocks : string = "";
  public metadata : string = "";
}

export class ModDefinition extends PuzzleDefinition
{
  public id : string;
	public display : string;
	public difficulty : number = 1;
	public hints : string[] = [];
	public timeBeforeHint : number = 35;
	public triesBeforeHint : number = 2;
	public editable : boolean = true;

	public clone() : ModDefinition
	{
    // TODO: deep copy workspace/solution/blocks/inputs
		var c : ModDefinition = new ModDefinition();
		c.goal = this.goal;
		c.inputs = this.inputs;
		c.workspace = this.workspace;
		c.solution = this.solution;
		c.blocks = this.blocks;
		c.metadata = this.metadata;
		c.id = this.id;
		c.display = this.display;
		c.difficulty = this.difficulty;
		c.hints = this.hints;
		c.timeBeforeHint = this.timeBeforeHint;
		c.triesBeforeHint = this.triesBeforeHint;
		c.editable = this.editable;
		return c;
	}
}

export class BlockInput
{
  public definition : string = "";
  public index : number = 0;
  public groupIndex : number = 0;
}

export class InputDefinition
{
  public static readonly tokenPattern = "(?:(?:" + Polyscript.Workspace.getTypeRegex().source + ")[\\s]+)";
  public static readonly tokenRegex = new RegExp(InputDefinition.tokenPattern, "g");
  public static readonly inputPattern = "#([^\\s\\{\\}]+)[\\s]*\\{([\\s]+" + InputDefinition.tokenPattern + "*)\\}[\\s]*";
  public static readonly inputRegex = new RegExp(InputDefinition.inputPattern, "g");
  public static readonly regex : RegExp = new RegExp("^(" + InputDefinition.inputPattern + ")*[\\s]*$");

  public name : string;
	public index : number;
	public length : number;
	public inputSequence : BlockInput[];

	public ToString () : string
	{
		var inputDefinitionString : string = "#" + this.name + " { ";
		this.inputSequence.forEach((i : BlockInput) =>
		{
			inputDefinitionString += i.definition + "<" + i.groupIndex + "> ";
		});
		inputDefinitionString += "}";

		return inputDefinitionString;
	}

  public toInputDefJson() : InputDefinitionJson
  {
    var idj = new InputDefinitionJson();

    idj.name = this.name;

    for(var bi of this.inputSequence)
    {
      idj.blocks.push(BlockDefinition.fromSerialized(bi.definition));
    }

    return idj;
  }
}

export class BlockSourceDefinition extends BlockDefinition
{
  public count : number = -1;
  public children : BlockSourceDefinition[] = undefined;

  static fromBlock (block : Polyscript.Block) : BlockSourceDefinition
  {
    var bsd = new BlockSourceDefinition();

    var typeString = block.types[block.types.length - 1] as keyof typeof Polyscript.TypeMap;
    bsd.type = Polyscript.TypeMap[typeString];

    if (bsd.type == undefined)
    {
      bsd.type = Polyscript.TypeMap.Unknown;
    }

    bsd.data = block.serialize();

   return bsd;
  }

  static fromSerialized (serial : string) : BlockSourceDefinition
  {
    var bsd = new BlockSourceDefinition();

    var block = Polyscript.CreateBlock(serial);
    var typeString = block.types[block.types.length - 1] as keyof typeof Polyscript.TypeMap;
    bsd.type = Polyscript.TypeMap[typeString];
    if (bsd.type == undefined)
    {
      bsd.type = Polyscript.TypeMap.Unknown;
    }
    bsd.data = block.serialize(); // handles the case of an invalid input; output will be an error block rather than the original serial pattern

    return bsd;
  }

  static fromPane(paneName : keyof typeof Polyscript.TypeMap) : BlockSourceDefinition
  {
    var bsd = new BlockSourceDefinition();
    bsd.type = Polyscript.TypeMap[paneName];

    return bsd;
  }

  static cloneBlockSourceDefinition (orig : BlockSourceDefinition) : BlockSourceDefinition
  {
    var bsd = new BlockSourceDefinition();
    bsd.type = orig.type;
    bsd.data = orig.data;
    bsd.count = orig.count;
    if (orig.children)
    {
      bsd.children = orig.children.map((x) => BlockSourceDefinition.cloneBlockSourceDefinition(x));
    }
    return bsd;
  }
}

export class AvailableBlockDefinition
{
  //public static readonly definitionPattern =
  public static readonly tokenPattern = "(\\[[0-9]+\\])|(NumberPane)|(MathPane)|(FullMathPane)|(BoolPane)|(VariablePane)|(FullVariablePane)|(BlockPane)|(FunctionPane)|(NumberToggleCustom)|(ColorToggle)|(CustomPane {)|(})|" + Polyscript.Workspace.getTypeRegex().source;
  public static readonly tokenRegex = new RegExp("(?:" + AvailableBlockDefinition.tokenPattern + ")[\\s]+", "g");

  public static readonly regex : RegExp =
        new RegExp("^(?:(?:" + AvailableBlockDefinition.tokenPattern + ")[\\s]+)*[\\s]*$");
}

export class FileMetadata
{
  public static readonly fileTokenPatten = "(lock[\\d]*)[\\s]*|(unlock[\\d]*)[\\s]*|(hide)[\\s]*";
  public static readonly fileTokenRegex = new RegExp(FileMetadata.fileTokenPatten, "g");
  public static readonly tokenPattern = "(@([^\\s\\{\\}]+)[\\s]+(?:" + FileMetadata.fileTokenPatten + ")*[\\s]*)|(infinite[\\d]*)[\\s]*|(sequence[\\d]*(?:_[\\d]*)?)[\\s]*|(requiremod)[\\s]*|type ([^\\s]*)[\\s]*";
  public static readonly tokenRegex = new RegExp(FileMetadata.tokenPattern, "g");

	public static readonly regex : RegExp =
		new RegExp("^(?:" + FileMetadata.tokenPattern + ")*[\\s]*$");

	public lockIndex : number = -1; // 0 locks entire file; positive locks up to that block, -1 doesn't lock
	public unlocked : boolean = false;
	public unlockedIndices : number[] = [];
	public hidden : boolean = false;
	public name : string = "";

  static cloneFileMetadata(orig : FileMetadata) : FileMetadata
  {
    var fmd = new FileMetadata();
    fmd.lockIndex = orig.lockIndex;
    fmd.unlocked = orig.unlocked;
    fmd.unlockedIndices = orig.unlockedIndices.slice();
    fmd.hidden = orig.hidden;
    fmd.name = orig.name;
    return fmd;
  }
}
