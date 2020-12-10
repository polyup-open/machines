import {IPolyscriptLocalizer, DefaultPolyscriptLocalizer} from "./PolyscriptLocalization";

export namespace Polyscript
{
  export var localizer : IPolyscriptLocalizer = new DefaultPolyscriptLocalizer();

  export var TypeMap : {[key:string] : number} =
  {
    // -9999: unknown
    Unknown : -9999,

    // -1000 block: panes
    NumberPane : -1000,
    MathPane : -999,
    FullMathPane : -998,
    BoolPane : -997,
    VariablePane : -996,
    FullVariablePane : -995,
    BlockPane : -994,
    FunctionPane : -993,
    NumberToggleCustom : -992,
    ColorToggle : -991,
    CustomPane : -990,
    CustomVariablePane : -989,
    StackPane : -988,
    ARPane : -987, // temporary; shouldn't be in this file in the long term
    StatePane : -986,
    ScenePane : -985,
    SimpleARPane : -984,

    // 1000 block: identity blocks
    ErrorBlock : 1000,
    NumberBlock : 1001,
    BooleanBlock : 1002,
    StringBlock : 1003,
    RandomIntBlock : 1004,
    RandomRealBlock : 1005,
    RandomBoolBlock : 1006,
    MemoryReferenceBlock : 1007,
    ColorBlock : 1008,
    // NYI:
    // ComplexNumberBlock,

    // 2000 block: math operators
    PlusOperator : 2000,
    MinusOperator : 2001,
    MultiplyOperator : 2002,
    DivideOperator : 2003,
    PowerOperator : 2004,
    ModuloOperator : 2005,
    CeilOperator : 2006,
    FloorOperator : 2007,
    RoundOperator : 2008,
    AbsOperator : 2009,
    FactorialOperator : 2010,
    SquareRootOperator : 2011,
    LogarithmOperator : 2012,
    NaturalLogarithmOperator : 2013,
    SineOperator : 2014,
    CosineOperator : 2015,
    TangentOperator : 2016,
    ArcSineOperator : 2017,
    ArcCosineOperator : 2018,
    ArcTangentOperator : 2019,
    ArcTangent2Operator : 2020,
    MinOperator : 2021,
    MaxOperator : 2022,

    // 3000 block: boolean operators
    LTOperator : 3000,
    GTOperator : 3001,
    LEQOperator : 3002,
    GEQOperator : 3003,
    EQOperator : 3004,
    NotOperator : 3005,
    AndOperator : 3006,
    OrOperator : 3007,

    // 4000 block: variable blocks
    LetBlock : 4000,
    RecallBlock : 4001,

    // 5000 block: data operators
    DataBlock : 5000,
    NullBlock : 5001,
    CountOperator : 5002,
    ReadBlock : 5003,
    ElemOperator : 5004,
    InsertOperator : 5005,
    AppendOperator : 5006,
    ReplaceOperator : 5007,
    DeleteOperator : 5008,
    WriteBlock : 5009,
    PackageBlock : 5010,

    // 6000 block: code operators
    CodeBlock : 6000,
    ExecBlock : 6001,
    BranchBlock : 6002,
    MapBlock : 6003,
    FoldBlock : 6004,
    FoldHelperBlock : 6005,
    MaybeBlock : 6006,
    FilterBlock : 6007,
    ComposeBlock : 6008,
    IterateBlock : 6009,
    FunctionBlock : 6010,
    FilterHelperBlock : 6011,

    // 7000 block: calculus operators
    IntegralOperator : 7000,
    DerivativeOperator : 7001,
    SumOperator : 7002,
    ProductOperator : 7003,
    LimitOperator : 7004,
    PositiveLimitOperator : 7005,
    NegativeLimitOperator : 7006,

    // 8000 block: special blocks
    RandBlock : 8000,
    MemoryBlock : 8001,
    GetOperator : 8002,
    SetOperator : 8003
  }

  export type PolyscriptModule = {
    startId : number;
    postEvaluate : (result : Block[], state : ProgramState) => void;
  }

  var modules : PolyscriptModule[] = [];

  export function loadModule(module : PolyscriptModule)
  {
    if (!modules.find(x => x == module))
    {
      modules.push(module);

      Workspace.BuildTypeData();
    }
  }

  export function getConcreteTypes() : Array<string>
  {
    var entries : Array<string> = Object.keys(Polyscript);
    var concreteTypes : Array<string> = [];

    modules.forEach(function (module) {
      var i = module.startId;
      var moduleEntries = Object.keys(module);
      moduleEntries.forEach(function(key) {
        var value : BlockConstructor = (module as any)[key];
        if (value.prototype && value.prototype.serializationPattern)
        {
          concreteTypes.push(key);
          TypeMap[key] = i++;
        }
      });
    });

    entries.forEach(function (key)
    {
      var value : any = (Polyscript as any)[key];
      if (value.prototype && value.prototype.serializationPattern)
      {
        concreteTypes.push(key);
        //console.log(key);
      }
    });

    // swap NullBlock to be ahead of DataBlock
    var nullIndex = concreteTypes.indexOf("NullBlock");
    var dataIndex = concreteTypes.indexOf("DataBlock");

    if (nullIndex > dataIndex)
    {
      concreteTypes[nullIndex] = "DataBlock";
      concreteTypes[dataIndex] = "NullBlock";
    }

    return concreteTypes;
  }

  export class RNG {
    static int (min : number, max : number) : number
    {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min)) + min;
    }
    static real (min : number , max : number) : number
    {
      return Math.random() * (max - min) + min;
    }
  }

  export class WhitespaceEscaper {
    static escape (s : string) : string
    {
      s = s.replace(/\\/g, '\\\\');
      s = s.replace(/\s/g, function(match : string) : string {
        let code : number = match.charCodeAt(0);
        let codeString : string = code.toString(16);
        while (codeString.length < 4)
        {
          codeString = '0' + codeString;
        }
        return '\\u' + codeString;
      });
      return s;
    }
    static unescapeWhitespace (s : string) : string
    {
      let regex : RegExp = /((?:^|[^\\])(?:\\\\)*)(?:\\u([0-9A-Fa-f]{4}))(.*)/;

      var match : any = regex.exec(s);
      if (match != null)
      {
        var lead : string = match[1];
        var charCodeString : string = match[2];
        var charCode : number = Number.parseInt(charCodeString, 16);
        var remainder : string = match[3];

        var index = match.index;
        s = s.substr(0, index) + lead + String.fromCharCode(charCode) + WhitespaceEscaper.unescapeWhitespace(remainder);
      }

      return s;
    }
    static unescape (s : string) : string
    {
      s = WhitespaceEscaper.unescapeWhitespace(s);

      s = s.replace(/\\\\/g, '\\');
      return s;
    }
  }

  export interface IRunView
  {
    evaluatedBlock(b : Block) : void;
    pushedBlock(b : Block) : void;
    poppedBlock(b : Block) : void;
    pushedState(s: ProgramState) : void;
    tailRecursedState(s: ProgramState) : void;
    poppedState(s: ProgramState) : void;
    variableChanged(name : string, b : Block, isParameter : boolean) : void;
    memoryChanged(objectRef : string, memoryRef: string, b : Block) : void;
  }

  export class PassthroughRunView implements IRunView
  {
    parent : ProgramState;
    constructor (parent : ProgramState)
    {
      this.parent = parent;
    }

    evaluatedBlock(_b : Block)
    {

    }

    pushedBlock(_b : Block)
    {

    }

    poppedBlock(b : Block)
    {
      if (this.parent.peek() == b)
      {
        this.parent.pop(null);
      }
    }

    pushedState(_s : ProgramState)
    {

    }

    tailRecursedState(_s: ProgramState)
    {

    }

    poppedState(_s: ProgramState)
    {

    }

    variableChanged(name : string, b: Block, isParameter : boolean)
    {
      if (this.parent.runView && !isParameter)
      {
        var isParentParameter = this.parent.variableAssignments[name] && this.parent.variableAssignments[name].parameter;
        this.parent.runView.variableChanged(name, b, isParentParameter);
      }
    }

    memoryChanged(objectRef : string, memoryRef: string, b : Block)
    {
      if (this.parent.runView)
      {
        this.parent.runView.memoryChanged(objectRef, memoryRef, b);
      }
    }
  }

  // interface IProgramObjectView
  // empty interface to be implemented by game objects in the view-controller
  // that map to objects in the programming language
  export interface IProgramObjectView {
    finishedEvaluate() : void;
    ConsumedBy(o: ProgramObject) : void;
  }

  // abstract class ProgramObject
  // base class for Block and ProgramState; may be contained in ProgramState's
  // program list
  export abstract class ProgramObject {
    public view : IProgramObjectView = null;
    public types : Array<string> = ['ProgramObject'];

    public isType (t : string) : boolean {
      for (var i = 0; i < this.types.length; i++)
      {
        if (this.types[i] === t)
        {
          return true;
        }
      }
      return false;
    }

    public sameType (o : ProgramObject) : boolean {
      if (this.types === o.types) return true;
      if (o.types == null) return false;
      if (this.types.length != o.types.length) return false;

      for (var i = 0; i < this.types.length; i++) {
        if (this.types[i] !== o.types[i]) return false;
      }
      return true;
    }

    public Eq (o : ProgramObject) : boolean {
      return this.sameType(o);
    }

    public toString () : string {
      return localizer.get(this.types[this.types.length - 1]);
    }
  }

  export class Stack
  {
    public name : string;
    public list : Array<Block>;
    public inputs : Array<string>;
    public obfuscated: boolean;
    public displayName : string;

    constructor(name : string)
    {
      if (name == null || name === '')
      {
        this.name = "i";
      }
      else
      {
        this.name = name;
      }
      this.list = [];
      this.inputs = [];
      this.obfuscated = false;
      this.displayName = undefined;
    }

    public Eq (b : Stack) : boolean
    {
      return Stack.cyclicEq(this, b, [], []);
    }

    public Clone () : Stack
    {
      var b = new Stack(this.name);
      b.obfuscated = this.obfuscated;
      b.displayName = this.displayName;

      this.list.forEach(function(block : Block) : void {
        if (block != null)
        {
          b.list.push(block.CloneBlock());
        }
        else
        {
          b.list.push(null);
        }
      });

      for (var input of this.inputs)
      {
        b.inputs.push(input);
      }

      return b;
    }

    public DeepClone(workspace : Workspace, visitedStacks : Map<Stack, Stack> = new Map<Stack, Stack>()) : Stack
    {
      var mappedStack = visitedStacks.get(this);
      if (mappedStack != undefined)
      {
        return mappedStack;
      }

      var clonedStack = new Stack(this.name);
      clonedStack.displayName = this.displayName;
      visitedStacks.set(this, clonedStack);

      for (var i = 0; i < this.list.length; i++)
      {
        var block = this.list[i].CloneBlock();
        if (block instanceof DataBlock)
        {
          block.findStackInWorkspace(workspace);
          if (block._stack != null)
          {
            block._stack = block._stack.DeepClone(workspace, visitedStacks);
          }
        }
        else if (block instanceof CodeBlock)
        {
          block.findStackInWorkspace(workspace);
          if (block.stack != null)
          {
            block.stack = block.stack.DeepClone(workspace, visitedStacks);
          }
        }
        clonedStack.list[i] = block;
      }

      return clonedStack;
    }

    public toString() : string
    {
      var result : string = this.name;

      if (this.inputs.length > 0)
      {
        result = result + " ( ";

        for(var input of this.inputs)
        {
          result = result + input + " ";
        }

        result = result + ")";
      }

      result = result + " { ";

      this.list.forEach(function(block) {
        result = result + block.toString() + " ";
      });

      return result + "}";
    }

    static cyclicEq (a : Stack, b : Stack, visitedA : Array<Stack>, visitedB : Array<Stack>) : boolean
    {
      if (b.list.length != a.list.length)
      {
        return false;
      }

      var indexA : number = visitedA.findIndex (function (x) { return x == a; });
      var indexB : number = visitedB.findIndex (function (x) { return x == b; });

      if (indexA != indexB)
      {
        // we've visited one or both of these stacks but the order in which we hit them wasn't the same,
        // so the data structures are different
        return false;
      }
      else if (indexA >= 0)
      {
        // we've already checked these stacks, so back out
        return true;
      }

      visitedA.push (a);
      visitedB.push (b);

      // check equality of list members
      for (var i = 0; i < a.list.length; i++)
      {
        if (b.list[i].isType('DataBlock') && a.list[i].isType('DataBlock'))
        {
          if (!Stack.cyclicEq((a.list[i] as DataBlock)._stack, (b.list[i] as DataBlock)._stack, visitedA, visitedB))
          {
            return false;
          }
        }
        else if (b.list[i].isType('CodeBlock') && a.list[i].isType('CodeBlock'))
        {
          if (!Stack.cyclicEq((a.list[i] as CodeBlock).stack, (b.list[i] as CodeBlock).stack, visitedA, visitedB))
          {
            return false;
          }
        }
        else if (!b.list[i].Eq(a.list[i]))
        {
          return false;
        }
      }

      return true;
    }
  }

  export class Workspace
  {
    public stacks : Array<Stack> = [];

    public stackIndex = 0;
    public typeRegex : RegExp;
    static _typeRegex : RegExp;

    private typeList : BlockConstructor[];
    static _typeList : BlockConstructor[];

    static getTypeRegex() : RegExp
    {
      if (Workspace._typeRegex == null)
      {
        Workspace.BuildTypeData();
      }

      return Workspace._typeRegex;
    }

    static getTypeList() : BlockConstructor[]
    {
      if (Workspace._typeRegex == null)
      {
        Workspace.BuildTypeData();
      }

      return Workspace._typeList;
    }

    constructor()
    {
      if (Workspace._typeRegex == null)
      {
        Workspace.BuildTypeData();
      }

      this.typeRegex = Workspace._typeRegex;
      this.typeList = Workspace._typeList;
    }

    public createStack (stackName : string) : Stack
    {
      if (stackName === undefined)
      {
        stackName = Workspace.ToRoman(++this.stackIndex);
      }
      var stack = new Stack(stackName);
      this.stacks.push(stack);
      return stack;
    }

    public addStack (stack : Stack) : void
    {
      this.stacks.push(stack);
    }

    public getStack (name : string) : Stack
    {
      return this.stacks.find(function(x : Stack) : boolean { return x.name === name });
    }

    public flipBlock (_block : Block)
    {
      throw "not implemented.";
    }

    public serializeWorkspace () : string
    {
      var workspaceSerial = "";
      this.stacks.forEach(function(s) {
        var content = "";


        workspaceSerial += "@" + s.name;

        if (s.inputs.length > 0)
        {
          workspaceSerial += " ( ";

          for (var input of s.inputs)
          {
            workspaceSerial += input;
          }

          workspaceSerial += ") ";
        }

        s.list.forEach(function(b) {
          content += b.serialize() + " ";
        });

        workspaceSerial += "{ " + content + "}\n";
      });

      return workspaceSerial;
    }

    public deserializeWorkspace (serializedWorkspace : string)
    {
      this.stacks = [];
      this.stackIndex = 0;

      var blockPattern = "(?:" + this.typeRegex.source + ")[\\s]+";
      var blockRegex = new RegExp(blockPattern, "g");

      var inputPattern = "[^\\s\\{\\}]+";
      var inputRegex = new RegExp("(" + inputPattern + ")", "g");

      var inputDefinitionPattern = "(?:\\([\\s]*((?:" + inputPattern + "[\\s]+)*)\\)[\\s]*)?";

      var stackPattern = "@([^\\s\\{\\}]+)[\\s]*" + inputDefinitionPattern + "(\\{[\\s]+(?:(?:" + this.typeRegex.source + ")[\\s]+)*\\})";
      var stackRegex = new RegExp(stackPattern, "g");

      var workspacePattern = "^(?:" + stackPattern + "[\\s]*)*[\\s]*$";
      var workspaceRegex = new RegExp(workspacePattern);

      if (workspaceRegex.test(serializedWorkspace))
      {
        var i = 0;
  			var stackMatch : RegExpExecArray;
  			while (stackMatch = stackRegex.exec(serializedWorkspace))
  			{
  				var stackName = WhitespaceEscaper.unescape(stackMatch[1]);
  				var hidden = false;
  				var DataBlocks : Block[] = [];
          var inputs : string[] = [];

          var inputsString = stackMatch[2];
          if (inputsString != null)
          {
            var inputMatch : RegExpExecArray;

            while (inputMatch = inputRegex.exec(inputsString))
            {
              inputs.push(inputMatch[1]);
            }
          }

          var blockMatch : RegExpExecArray;
  				var DataBlocksString = stackMatch[3];
  				DataBlocksString = DataBlocksString.substring(2, DataBlocksString.length - 2) + " ";
  				var j = 0;
  				while (blockMatch = blockRegex.exec(DataBlocksString))
  				{
  					for (var k = 0; k < this.typeList.length; k++)
  					{
  						if (blockMatch[k+1] != null)
  						{
  							var type = this.typeList[k];
  							var blockString = blockMatch[k+1];
                //console.log("deserialize " + blockString + " type " + k + ": "+ this.typeList[k].prototype.serializationPattern);
  							DataBlocks[j] = type.deserialize(blockString);
                break;
  						}
  					}
  					j++;
  				}

  				this.stacks[i] = new Stack(stackName);
          this.stacks[i].obfuscated = hidden;
          this.stacks[i].list = DataBlocks;
          this.stacks[i].inputs = inputs;

  				i++;
  			}
        // set up stack references
        this.stacks.forEach(function(stack) {
          stack.list.forEach(function(block) {
            if (block.isType('DataBlock'))
            {
              (block as DataBlock).findStackInWorkspace(this);
            }
            else if (block.isType('CodeBlock'))
            {
              (block as CodeBlock).findStackInWorkspace(this);
            }
          });
        });
        return true;
      }
      else {
        return false;
      }
    }

    static ToRoman (num : number) : string
    {
      if ((num < 0) || (num > 3999)) throw"Value must be between 1 and 3999";
    	if (num < 1) return '';
    	if (num >= 1000) return "m" + Workspace.ToRoman(num - 1000);
    	if (num >= 900) return "cm" + Workspace.ToRoman(num - 900);
    	if (num >= 500) return "d" + Workspace.ToRoman(num - 500);
    	if (num >= 400) return "cd" + Workspace.ToRoman(num - 400);
    	if (num >= 100) return "c" + Workspace.ToRoman(num - 100);
    	if (num >= 90) return "xc" + Workspace.ToRoman(num - 90);
    	if (num >= 50) return "l" + Workspace.ToRoman(num - 50);
    	if (num >= 40) return "xl" + Workspace.ToRoman(num - 40);
    	if (num >= 10) return "x" + Workspace.ToRoman(num - 10);
    	if (num >= 9) return "ix" + Workspace.ToRoman(num - 9);
    	if (num >= 5) return "v" + Workspace.ToRoman(num - 5);
    	if (num >= 4) return "iv" + Workspace.ToRoman(num - 4);
    	if (num >= 1) return "i" + Workspace.ToRoman(num - 1);
    	throw "Value must be between 1 and 3999";
    }

    static BuildTypeData ()
    {
      var concreteTypes = getConcreteTypes();
      var typeList : BlockConstructor[] = [];
      var typeRegex = "";
      concreteTypes.forEach(function(key) {
        var type : BlockConstructor;

        for (var moduleIndex = 0; !type && moduleIndex < modules.length; moduleIndex++)
        {
          type = (modules[moduleIndex] as any)[key];
        }
        if (!type)
        {
          type = (Polyscript as any)[key];
        }
        typeList.push(type);
        typeRegex = typeRegex + "(" + type.prototype.serializationPattern.source + ")|";
      });

      Workspace._typeList = typeList;
      Workspace._typeRegex = new RegExp(typeRegex.substring(0, typeRegex.length - 1), 'g');
    }

    static deserialize (serializedWorkspace : string) : Workspace
    {
      var ws = new Workspace();

      if (ws.deserializeWorkspace(serializedWorkspace))
      {
        return ws;
      }
      else
      {
        return null;
      }
    }
  }

  export class Converter
  {
    static encapsulateBlock(name : string, value : Block) : DataBlock
    {
      var stack = new Stack(name);

      stack.list[0] = value;

      return new DataBlock(stack, null);
    }

    static arrayToDataBlock(name : string, array : any[], visitedObjects : Map<object, DataBlock>, targetDataBlock? : DataBlock) : DataBlock
    {
      var stack = new Stack(name);
      var db : DataBlock;

      if (targetDataBlock !== undefined)
      {
        db = targetDataBlock;
        db._stack = stack;
      }
      else
      {
        new DataBlock(stack, null);
      }

      for (var i = 0; i < array.length; i++)
      {
        var value = array[i];
        var type = typeof(value);

        if (type === "number")
        {
          stack.list.push(new NumberBlock(value));
        }
        else if (type === "boolean")
        {
          stack.list.push(new BooleanBlock(value));
        }
        else if (type === "string")
        {
          stack.list.push(new StringBlock(value));
        }
        else if (type === "undefined" || value === null)
        {
          stack.list.push(new NullBlock());
        }
        else if (Array.isArray(value))
        {
          if (visitedObjects.has(value))
          {
            stack.list.push(visitedObjects.get(value));
          }
          else
          {
            var targetDataBlock = new DataBlock(null, null);
            visitedObjects.set(value, targetDataBlock);

            this.arrayToDataBlock(name + (i + 1), value, visitedObjects, targetDataBlock);

            stack.list.push(targetDataBlock);
          }
        }
        else if (type === "object")
        {
          if (visitedObjects.has(value))
          {
            stack.list.push(visitedObjects.get(value));
          }
          else
          {
            var targetDataBlock = new DataBlock(null, null);

            visitedObjects.set(value, targetDataBlock);

            this.objectToDataBlock(name + (i + 1), value, visitedObjects, targetDataBlock);

            stack.list.push(targetDataBlock);
          }
        }
      }

      return db;
    }

    static objectToDataBlock (name : string, obj : any, visitedObjects? : Map<object, DataBlock>, targetDataBlock? : DataBlock) : DataBlock
    {

      var stack = new Stack(name);
      var db : DataBlock;
      if (targetDataBlock != null)
      {
        targetDataBlock._stack = stack;
      }
      else
      {
        db = new DataBlock(stack, null);
      }

      if (visitedObjects === undefined)
      {
        visitedObjects = new Map<object, DataBlock>();
        visitedObjects.set(obj, db);
      }

      for (var key in obj)
      {
        var value : any = obj[key];
        var type = typeof(value);

        if (type === "number")
        {
          stack.list.push(this.encapsulateBlock(key, new NumberBlock(value)));
        }
        else if (type === "boolean")
        {
          stack.list.push(this.encapsulateBlock(key, new BooleanBlock(value)));
        }
        else if (type === "string")
        {
          stack.list.push(this.encapsulateBlock(key, new StringBlock(value)));
        }
        else if (type === "undefined" || value === null)
        {
          stack.list.push(this.encapsulateBlock(key, new NullBlock()));
        }
        else if (Array.isArray(value))
        {
          if (visitedObjects.has(value))
          {
            stack.list.push(this.encapsulateBlock(key, visitedObjects.get(value)));
          }
          else
          {
            var targetDataBlock = new DataBlock(null, null);
            visitedObjects.set(value, targetDataBlock);

            this.arrayToDataBlock(key + "Value", value, visitedObjects, targetDataBlock);

            stack.list.push(this.encapsulateBlock(key, targetDataBlock));
          }
        }
        else if (type === "object")
        {
          if (visitedObjects.has(value))
          {
            stack.list.push(this.encapsulateBlock(key, visitedObjects.get(value)));
          }
          else
          {
            var targetDataBlock = new DataBlock(null, null);
            visitedObjects.set(value, targetDataBlock);

            this.objectToDataBlock(key + "Value", value, visitedObjects, targetDataBlock);

            stack.list.push(this.encapsulateBlock(key, targetDataBlock));
          }
        }
      }
      //var keys = Object.getOwnPropertyNames(obj);

      return db;
    }

    static valueBlockToValue(valueBlock : Block, valueType : ValueTypeSignature, workspace : Polyscript.Workspace, visitedDataBlocks : Map<DataBlock, object>) : any
    {
      if (valueType == "number" && valueBlock instanceof NumberBlock)
      {
        return valueBlock.decimalValue;
      }
      else if (valueType == "boolean" && valueBlock instanceof BooleanBlock)
      {
        return valueBlock.value;
      }
      else if (valueType == "string" && valueBlock instanceof StringBlock)
      {
        return valueBlock.value;
      }
      else if (Array.isArray(valueType))
      {
        for (var type of valueType)
        {
          try {
            //console.log("trying type " + JSON.stringify(type));
            return this.valueBlockToValue(valueBlock, type, workspace, visitedDataBlocks);
          }
          catch (error)
          {
            // remove valueBlock from visited blocks, then keep going
            if (valueBlock instanceof DataBlock)
            {
              visitedDataBlocks.delete(valueBlock);
            }
            //console.log("trying next type: " + error);
          }
        }
      }
      else if (typeof(valueType) === "object" && valueBlock instanceof DataBlock)
      {
        valueBlock.findStackInWorkspace(valueBlock.workspace);
        valueBlock.findStackInWorkspace(workspace);

        if (valueType.hasOwnProperty("arrayOf") && Object.keys(valueType).length == 1)
        {
          if (visitedDataBlocks.has(valueBlock))
          {
            return visitedDataBlocks.get(valueBlock);
          }
          else
          {
            var array : any[] = [];
            visitedDataBlocks.set(valueBlock, array);

            var blockList = valueBlock._stack.list;

            for (var block of blockList)
            {
              array.push(this.valueBlockToValue(block, (valueType as ArrayTypeSignature).arrayOf, workspace, visitedDataBlocks));
            }

            return array;
          }
        }
        else
        {
          if (visitedDataBlocks.has(valueBlock))
          {
            return visitedDataBlocks.get(valueBlock);
          }
          else
          {
            var targetObject = {};
            visitedDataBlocks.set(valueBlock, targetObject);
            this.dataBlockToObject(valueBlock, valueType as ObjectTypeSignature, workspace, visitedDataBlocks, targetObject);

            return targetObject;
          }
        }
      }

      throw "Value " + valueBlock + " is not assignable to type " + JSON.stringify(valueType);
    }

    static propertyToValue(propertyBlock : DataBlock, valueType : ValueTypeSignature, workspace : Polyscript.Workspace, visitedDataBlocks : Map<DataBlock, object>) : any
    {
      propertyBlock.findStackInWorkspace(propertyBlock.workspace);
      propertyBlock.findStackInWorkspace(workspace);

      var list = propertyBlock._stack.list;

      if (list.length == 1)
      {
        return this.valueBlockToValue(list[0], valueType, workspace, visitedDataBlocks);
      }

      throw "Property " + propertyBlock.toString() + " must contain exactly one value.";
    }

    static dataBlockToObject(dataBlock : DataBlock, typeSignature : ObjectTypeSignature, workspace? : Polyscript.Workspace, visitedDataBlocks? : Map<DataBlock, object>, targetObject? : any) : object
    {
      if (dataBlock instanceof NullBlock)
      {
        return null;
      }

      dataBlock.findStackInWorkspace(dataBlock.workspace);
      dataBlock.findStackInWorkspace(workspace);

      var blockList = dataBlock._stack.list;

      var result : any = {};

      if (targetObject !== undefined)
      {
        result = targetObject;
      }

      if (visitedDataBlocks === undefined)
      {
        visitedDataBlocks = new Map<DataBlock, object>();
        visitedDataBlocks.set(dataBlock, result);
      }


      for (var propertyName in typeSignature)
      {
        var propertyBlock = blockList.find((x => x instanceof DataBlock && x._stack.name == propertyName)) as DataBlock;

        if (propertyBlock != null)
        {
          try {
            result[propertyName] = this.propertyToValue(propertyBlock, typeSignature[propertyName], workspace, visitedDataBlocks);
          }
          catch (error)
          {
            // do we want error handling here?
            console.error(error);
            throw error;
          }
        }
        else
        {
          throw "DataBlock " + dataBlock.toStringVerbose() + " is missing property " + propertyName;
        }
      }

      return result;
    }
  }

  export type ValueTypeSignature = "number" | "string" | "boolean" | ArrayTypeSignature | ObjectTypeSignature | MultiTypeSignature;

  export type ObjectTypeSignature = {[key:string] : ValueTypeSignature };

  export type MultiTypeSignature = ["number" | "string" | "boolean" | ArrayTypeSignature | ObjectTypeSignature];

  export class ArrayTypeSignature
  {
    public arrayOf : ValueTypeSignature;
  }

  export enum RandMode
  {
    min,
    max,
    random
  }

  export class MachineState
  {
    public objects : {[key: string] : ObjectState};

    constructor ()
    {
      this.objects = {};
    }

    static serialize (mac : MachineState) : string
    {
      var objects : {[key: string] : string} = {};
      for (var objId in mac.objects)
      {
        objects[objId] = ObjectState.serialize(mac.objects[objId]);
      }

      return JSON.stringify(objects);
    }

    static deserialize (serial : string) : MachineState
    {
      var mac = new MachineState();

      if (!serial)
      {
        return mac;
      }

      try {
        var objDict = JSON.parse(serial);

        for (var objId in objDict)
        {
          mac.objects[objId] = ObjectState.deserialize(objDict[objId]);
        }
      }
      catch (e)
      {
        console.warn("failed to parse serialized machine state " + serial + ": " + e);
      }

      return mac;
    }

    static Clone (state : MachineState) : MachineState
    {
      var copy = new MachineState();

      if (state)
      {
        for (var objKey in state.objects)
        {
          copy.objects[objKey] = ObjectState.Clone(state.objects[objKey]);
        }
      }

      return copy;
    }
  }

  export class ObjectState
  {
    public stateVariables : {[key:string] : Block};
    public defaults : {[key:string] : string};

    constructor ()
    {
      this.stateVariables = {};
      this.defaults = {};
    }

    static serialize(obj : ObjectState) : string
    {
      // temporarily remove obj.stateVariables; we don't want to serialize them
      // since they are session-specific
      var stateVariables = obj.stateVariables;
      obj.stateVariables = undefined;
      var serialized = JSON.stringify(obj);
      obj.stateVariables = stateVariables;

      return serialized;
    }

    static deserialize(serial : string) : ObjectState
    {
      var obj : ObjectState = JSON.parse(serial);

      obj.stateVariables = {};

      // old serialization had objectId; don't need it any more
      if ((obj as any).objectId)
      {
        delete (obj as any).objectId;
      }

      if (obj.defaults)
      {
        Object.assign(obj.stateVariables, obj.defaults);
      }

      return obj;
    }

    static Clone (state : ObjectState) : ObjectState
    {
      var copy = new ObjectState();
      Object.assign(copy.stateVariables, state.stateVariables);
      Object.assign(copy.defaults, state.defaults);
      return copy;
    }
  }


  export class VirtualMachine
  {
    public stack : Array<Block> = [];
    public maxSteps : number = 10000;
    public anonStackIndex : number = 0;
    public randModes : RandMode[] = [];
    public randModeIndex : number = 0;

    public workspace = new Workspace();
    public mainProgram : ProgramState;
    public state : MachineState;
    static runtime : VirtualMachine;

    constructor()
    {
      this.mainProgram = new ProgramState(this, undefined, undefined);
      this.state = new MachineState();
    }

    public reset() : void
    {
      this.anonStackIndex = 0;
      this.randModeIndex = 0;
      this.mainProgram.program = [];
      this.mainProgram.variableAssignments = {};
      this.mainProgram.activeProgram.state = this.mainProgram;
      this.mainProgram.activeProgram.steps = 0;

      this.stack = [];
    }

    public reloadState() : void
    {
      for (var key in this.state.objects)
      {
        var objectState = this.state.objects[key];
        objectState.stateVariables = {};
        for (var defaultName in objectState.defaults)
        {
          objectState.stateVariables[defaultName] = CreateBlock(objectState.defaults[defaultName]);
        }
      }
    }

    public clearState() : void
    {
      this.state = new MachineState();
    }

    public loadState(state : MachineState | string)
    {
      if (state)
      {
        if (typeof state == "string")
        {
          this.state = MachineState.deserialize(state);
        }
        else
        {
          this.state = MachineState.Clone(state);
        }
      }
    }

    public setStateVariable(objectId : string, name : string, value : Block, runView? : IRunView)
    {
      if (!this.state.objects[objectId])
      {
        this.state.objects[objectId] = new ObjectState();
      }

      if (value instanceof DataBlock || value instanceof CodeBlock)
      {
        throw "DataBlock and CodeBlock are not yet supported.";
      }

      if (!value)
      {
        delete this.state.objects[objectId].stateVariables[name];
      }
      else
      {
        var oldValue = this.state.objects[objectId].stateVariables[name];
        if (runView && (!oldValue || !value.Eq(oldValue)))
        {
          runView.memoryChanged(objectId, name, value);
        }
        this.state.objects[objectId].stateVariables[name] = value;
      }
    }

    public getStateVariable(objectId : string, name : string) : Block
    {
      var object = this.state.objects[objectId];
      if (object)
      {
        var variable = object.stateVariables[name];
        if (variable !== undefined)
        {
          return variable.CloneBlock();
        }
      }
      return new ErrorBlock(localizer.get("Errors.getStateVariable", "Could not find variable {{name}} of object {{objectId}}.", {name:localizer.get("StateVariableNames." + name, name), objectId:objectId}));
    }

    public setStateDefault(objectId : string, name : string, value : Block)
    {
      if (!this.state.objects[objectId])
      {
        this.state.objects[objectId] = new ObjectState();
      }

      if (value instanceof DataBlock || value instanceof CodeBlock)
      {
        throw "DataBlock and CodeBlock are not yet supported.";
      }

      if (!value)
      {
        delete this.state.objects[objectId].defaults[name];
      }
      else
      {
        this.state.objects[objectId].defaults[name] = value.serialize();
      }
    }

    public setStateDefaults(objectId : string, inherited : {[key:string] : Block}, variables : {[key:string] : Block})
    {
      if (!this.state.objects[objectId])
      {
        this.state.objects[objectId] = new ObjectState();
      }

      this.state.objects[objectId].stateVariables = {};

      for (var variable in inherited)
      {
        this.setStateDefault(objectId, variable, inherited[variable]);
      }

      for (var variable in variables)
      {
        this.setStateDefault(objectId, variable, variables[variable]);
      }
    }

    public getStateDefault(objectId : string, name : string) : Block
    {
      var object = this.state.objects[objectId];
      if (object)
      {
        var variable = object.defaults[name];
        if (variable !== undefined)
        {
          return Polyscript.CreateBlock(variable);
        }
      }
      return new ErrorBlock(localizer.get("Errors.getStateDefault", "Could not find default {{name}} of object {{objectId}}", {name:name, objectId:objectId}));
    }

    public getObjectState(objectId : string)
    {
      return this.state.objects[objectId];
    }

    public renameObjectState(oldId : string, newId :string)
    {
      if (this.state.objects[newId])
      {
        console.warn("overwriting " + newId + " with" + oldId + ".");
      }

      this.state.objects[newId] = this.state.objects[oldId];
      delete this.state.objects[oldId];

      for (var objName in this.state.objects)
      {
        var object = this.state.objects[objName];
        for (var varName in object.defaults)
        {
          var defaultBlock = this.getStateDefault(objName, varName);
          if (defaultBlock instanceof MemoryBlock && defaultBlock._objectReference == oldId)
          {
            defaultBlock._objectReference = newId;
            this.setStateDefault(objName, varName, defaultBlock);
          }
        }

        for (var varName in object.stateVariables)
        {
          var stateBlock = object.stateVariables[varName];
          if (stateBlock instanceof MemoryBlock && stateBlock._objectReference == oldId)
          {
            stateBlock._objectReference = newId;
          }
        }
      }
    }

    public createObjectState(objectId : string)
    {
      if (!this.state.objects[objectId])
      {
        this.state.objects[objectId] = new ObjectState();
      }
      return this.state.objects[objectId];
    }

    public getNextRandMode() : RandMode
    {
      if (this.randModeIndex < this.randModes.length)
      {
        return this.randModes[this.randModeIndex++];
      }
      return RandMode.random;
    }

    public EvaluateStep() : Array<Block>
    {
      return this.mainProgram.EvaluateStep();
    }

    public EvaluateFully (verbose : boolean) : Array<Block>
    {
      return this.mainProgram.EvaluateFully(this.maxSteps, verbose);
    }

    public LoadInputDefinition (inputDefinition : string) : void
    {
      if (Workspace._typeRegex == null)
      {
        Workspace.BuildTypeData();
      }

      var blockPattern = "(?:" + Workspace._typeRegex.source + ")[\\s]+";
      var blockRegex = new RegExp(blockPattern, "g");

      var inputPattern = "#([^\\s\\{\\}]+)[\\s]*(\\{[\\s]+(?:(?:" + Workspace._typeRegex.source + ")[\\s]+)*\\})[\\s]*";
      var inputRegex = new RegExp(inputPattern, "g");

      var inputDefinitionPattern = "^(" + inputPattern + ")*[\\s]*$";
      var inputDefinitionRegex = new RegExp(inputDefinitionPattern);

      //var workspacePattern = "^(?:" + stackPattern + "[\\s]*)*[\\s]*$";
      //var workspaceRegex = new RegExp(workspacePattern);

      //var InputRegex = new RegExp("^(#([^\\s\\{\\}]+)[\\s]*\\{[\\s]+(?:(?:" + Polyscript.Workspace.prototype._typeRegex + ")[\\s]+)*\\}[\\s]*)*[\\s]*$");

      var inputs : Array<Array<Block>> = [];
      var firstInputCount = 0;

      if (inputDefinitionRegex.test(inputDefinition))
      {
        var i = 0;
  			var inputMatch;
  			while (inputMatch = inputRegex.exec(inputDefinition))
  			{
  				var inputBlocks : Array<Block> = [];

  				var blockMatch;
  				var inputBlocksString = inputMatch[2];
  				inputBlocksString = inputBlocksString.substring(2, inputBlocksString.length - 2) + " ";
  				var j = 0;
  				while (blockMatch = blockRegex.exec(inputBlocksString))
  				{
  					for (var k = 0; k < Workspace._typeList.length; k++)
  					{
  						if (blockMatch[k+1] != null)
  						{
  							var type = Workspace._typeList[k];
  							var blockString = blockMatch[k+1];
                //console.log("deserialize " + blockString + " type " + k + ": "+ this.typeList[k].prototype.serializationPattern);
  							inputBlocks[j] = type.deserialize(blockString);
                break;
  						}
  					}
  					j++;
  				}

          if (i == 0)
          {
            firstInputCount = j;
          }

          inputs[i] = inputBlocks;

  				i++;
  			}

        var inputList = [];
        var selection = RNG.int(0, firstInputCount);
        for (i = 0; i < inputs.length; i++)
        {
          inputList[i] = inputs[i][selection];
        }
        this.LoadInputList(inputList);
      }
    }

    public LoadInputList (inputList : Array<Block>)
    {
      this.stack = [];

      for (var i = 0; i < inputList.length; i++)
      {
        this.stack[i] = inputList[i].CloneBlock();
        if (this.stack[i].isType('DataBlock'))
        {
          (this.stack[i] as DataBlock).findStackInWorkspace(this.workspace);
        }
        else if (this.stack[i].isType('CodeBlock'))
        {
          (this.stack[i] as CodeBlock).findStackInWorkspace(this.workspace);
        }
      }
    }
  }

  export class ProgramState extends ProgramObject
  {
    public parent : ProgramState = null;
    public program : Array<ProgramObject> = [];
    public variableAssignments : {[key:string]:{parameter: boolean, block:Block}} = {};
    public stackName : string = '';
    public vm : VirtualMachine;
    public runView : IRunView = null;
    public activeProgram : { state : ProgramState,
      steps : number,
      maxSteps : number
    };

    constructor(vm : VirtualMachine, stack : Stack, parent : ProgramState)
    {
      super();
      this.types.push('ProgramState');
      this.vm = vm;

      if (parent !== undefined)
      {
        this.parent = parent;
        this.runView = parent.runView;
        this.activeProgram = parent.activeProgram;
      }
      else
      {
        this.activeProgram = { state : this, steps : 0, maxSteps : undefined };
      }

      if (stack !== undefined)
      {
        this.insertInProgram(stack);
      }
    }

    public copyVariableAssignments(other : ProgramState, copyParameters : boolean)
    {
      for (var key in other.variableAssignments)
      {
        if (copyParameters || !other.variableAssignments[key].parameter)
        {
          this.assign(key, other.variableAssignments[key].block, false);
        }
      }
    }

    public isFinished () : boolean {
      return this.program.length == 0;
    }

    public globalStack () : Array<Block> {
      return this.vm.stack;
    }

    public toString () : string
    {
      var stackString = "";

      if (this.parent == null)
      {
        stackString = "{ ";
        this.vm.stack.forEach(function (block : Block) : void {
          stackString += block.toString() + " ";
        });
        stackString += "} ";
      }

      var programString = "[ ";
      this.program.forEach(function (o : ProgramObject) : void
      {
        programString += o.toString() + " ";
      });
      programString += "]";

      return stackString + programString;
    }

    public EvaluateFully (maxSteps : number, verbose : boolean) : Array<Block>
    {
      if (maxSteps === undefined)
      {
        this.activeProgram.maxSteps = this.vm.maxSteps;
      }
      else
      {
        this.activeProgram.maxSteps = maxSteps;
      }

      if (verbose)
      {
        console.log(this.toString());
      }

      for (this.activeProgram.steps = 1; this.activeProgram.steps <= this.activeProgram.maxSteps; this.activeProgram.steps++)
      {
        var result = this.EvaluateStep();

        if (verbose)
        {
          console.log(this.toString());
        }

        if (result != null)
        {
          return result;
        }
      }

      return [new ErrorBlock(localizer.get("Errors.stepLimitExceeded","Evaluation step limit exceeded."))];
    }

    public EvaluateStep () : Array<Block>
    {
      if (this.program.length == 0)
  		{
  			return this.vm.stack;
  		}

      if (this.activeProgram.state != this)
      {
        var result = this.activeProgram.state.EvaluateStep();

        if (result != null)
        {
          this.activeProgram.state.parent.program.splice(0, 1);
          if (this.runView != null)
          {
            this.runView.poppedState(this.activeProgram.state);
          }

          if (this.activeProgram.state.view != null) {
            this.activeProgram.state.view.finishedEvaluate ();
          }

          this.activeProgram.state = this.activeProgram.state.parent;
        }
      }
      else
      {
    		var ev = this.program [0];

    		if (ev == null)
    		{
    			this.program.splice (0, 1);
    			this.push (new ErrorBlock (localizer.get("Errors.nullInProgram", "Null block in program.")));
    		}
    		else if (ev.isType('Block'))
    		{
    			this.program.splice(0, 1);
    			(ev as Block).Evaluate (this);

          if (this.runView != null)
          {
            //if((ev as Block).toString() == "i"){

            //}

            this.runView.evaluatedBlock(ev as Block);
          }

    			if (ev.view != null)
    			{
    				ev.view.finishedEvaluate();
    			}
    		}
    		else if (ev.isType('ProgramState'))
    		{
          console.error("evaluating program state in program; should not be possible with the new activeProgram system");
    			var results = (ev as ProgramState).EvaluateStep ();

    			if (results != null)
    			{
    				this.program.splice (0, 1);

            if (this.runView != null)
            {
              this.runView.poppedState(ev as ProgramState);
            }

    				if (ev.view != null) {
    					ev.view.finishedEvaluate ();
    				}
    			}
    		}

    		if (this.program.length == 0)
    		{
          for (var module of modules)
          {
            // postprocess result. Note that this will be called for intermediate ProgramState
            // completions, not just the main program.
            if (module.postEvaluate)
            {
              module.postEvaluate(this.vm.stack, this);
            }
          }
    			return this.vm.stack;
    		}

    		return null;
      }
    }

    public assign (name : string, value : Block, isParameter : boolean) : void
    {
      if (this.variableAssignments[name] && this.variableAssignments[name].parameter)
      {
        isParameter = true;
      }
      this.variableAssignments[name] = {parameter: isParameter, block: value.CloneBlock()};

      var oldValue = this.recallByName(name);

      if (this.runView && (!oldValue || !value.Eq(oldValue)))
      {
        this.runView.variableChanged(name, value, isParameter);
      }

      if (!isParameter && this.parent)
      {
        this.parent.assign(name, value, false);
      }
    }

    public recallByName (name: string) : Block
    {
      var result = this.variableAssignments[name];
      if (result !== undefined)
      {
        return result.block.CloneBlock();
      }
      else if (this.parent !== null)
      {
        return this.parent.recallByName(name);
      }

      return null;
    }

    public recallByBlock (block : RecallBlock) : Block
    {
      if (this.program.indexOf(block) != -1)
      {
        return this.recallByName(block.name);
      }
      else if (this.program.length > 0 && this.program[0].isType('ProgramState'))
      {
        return (this.program[0] as ProgramState).recallByBlock(block);
      }

      return null;
    }

    public peek () : Block
    {
      if (this.vm.stack.length == 0)
      {
        return null;
      }

      return this.vm.stack[this.vm.stack.length - 1];
    }

    public peekT (t : string) : Block
    {
      var o = this.peek();

      if (o !== null && o.isType(t))
      {
        return o;
      }
      else
      {
        return null;
      }
    }

    public push (block : Block) : void
    {
      if (block !== null)
      {
        this.vm.stack.push(block);

        if (this.runView != null)
        {
          this.runView.pushedBlock(block);
        }
      }
    }

    public pushList (list : Array<Block>) : void
    {
      if (list !== null)
      {
        for (var b of list)
        {
          this.push(b);
        }
      }
    }

    public pop (caller : ProgramObject) : void
    {
      if (this.vm.stack.length != 0)
      {
        var block = this.vm.stack.pop();

        if (block !== undefined && this.runView != null)
        {
          this.runView.poppedBlock(block);
        }

        if (block !== undefined && block.view !== null && caller != null)
        {
          block.view.ConsumedBy(caller);
        }
      }
    }

    public insertInProgram (stack : Stack) : ProgramState
    {
      // tail recursion case
      if (this.program.length == 0)
      {
        this.activeProgram.state = this; // fallback in case the previous runtime was aborted
        var inputs = stack.inputs;
        var variableAssignments : {[key:string]:{parameter: boolean, block: Block}} = {};

        for (var i = inputs.length - 1; i >= 0; i--)
        {
          var block = this.peek();
          if (block == null)
          {
            this.push(new ErrorBlock(localizer.get("Errors.functionRequiresInputs", "That Function requires {{blocksAsInput}}.",
              {
                blocksAsInput : localizer.get("Errors.blocksAsInput", "{{count}} block as input", {count:inputs.length})
              })));
            return;
          }
          this.pop(null);
          variableAssignments[inputs[i]] = {parameter: true, block: block};
        }

        if (stack.list.length == 0)
        {
          if (this.runView != null)
          {
            this.runView.tailRecursedState(this);
          }
          return this; // empty stacks don't do anything, so shortcut out
        }

        for (var i = 0; i < stack.list.length; i++)
        {
          this.program.push(stack.list[i].CloneBlock());
        }
        this.stackName = stack.name;

        for (var variable in variableAssignments)
        {
          this.variableAssignments[variable] = variableAssignments[variable];
        }

        if (this.runView != null)
        {
          this.runView.tailRecursedState(this);
        }
        //console.log("tail recursion case");
        return this;
      }
      else
      {
        var newState = new ProgramState(this.vm, stack, this);
        newState.activeProgram.state = newState;
        this.program.splice(0, 0, newState);

        if (this.runView != null)
        {
          this.runView.pushedState(newState);
        }
        return newState;
        //console.log("push case");
      }
    }

    static createFromBlock (blockToExecute : DataBlock, parent : ProgramState)
    {
      return new ProgramState(parent.vm, blockToExecute._stack, parent);
    }
  }

  ////////////////////////////////// BLOCKS //////////////////////////////////
  // abstract class Block extends ProgramObject
  // the primary object that the Polyscript engine manipulates for computation.
  // a block may be
  export interface BlockConstructor {
    new () : Block;
    deserialize(s : string) : Block;

    serializationPattern : RegExp;
  }

  export abstract class Block extends ProgramObject
  {
    public serializationPattern : RegExp;

    constructor()
    {
      super();
      this.types.push('Block');
    }

    public CloneBlock () : Block
    {
      // default functionality: call the default constructor for this object's type
      return new (Polyscript as any)[this.types[this.types.length - 1]]();
    }

    public abstract Evaluate (currentState : ProgramState) : void;

    public serialize () : string
    {
      if (this.serializationPattern == undefined)
      {
        return '';
      }
      return this.serializationPattern.source;
    }

    public GetType() : string
    {
      return this.types[this.types.length - 1];
    }

    static deserialize (_s : string) : Block {
      return null;
    }
  }


  export abstract class IdentityBlock extends Block
  {
    constructor()
    {
      super();
      this.types.push('IdentityBlock');
    }

    public Evaluate (currentState : ProgramState) : void
    {
      currentState.push(this);
    }
  }

  export class ErrorBlock extends IdentityBlock
  {
    public message : string;

    constructor(message : string, warn : boolean = false)
    {
      super();
      this.types.push('ErrorBlock');

      if (message === undefined)
      {
        this.message = '';
      }
      else
      {
        this.message = message;
      }
      if (warn)
      {
        console.warn(this.message);
      }
    }

    public CloneBlock()
    {
      return new ErrorBlock(this.message);
    }

    public toString() : string
    {
      return "Err";
    }

    public serialize () : string
    {
      if (this.message !== undefined && this.message !== null && this.message !== '')
      {
        return 'Err("' + this.message + '")';
      }
      else {
        return 'Err';
      }
    }

    static deserialize (serial : string)
    {
      if (serial.length > 5)
      {
        var message = serial.substring (5, serial.length - 2);
        return new ErrorBlock (message);
      }
      else
      {
        return new ErrorBlock (undefined);
      }
    }
  }

  ErrorBlock.prototype.serializationPattern = /Err(?:\("[^\n"]*"\))?/

  export enum NumberMode
  {
    DECIMAL = 0,
    REDUCED_FRACTION,
    INT_AND_FRACTION
  }

  export class RationalNumber
  {
    protected _numerator : number;
    protected _denominator : number;

    public get numerator () {
      return this._numerator;
    }

    public get denominator () {
      return this._denominator;
    }

    public get value () {
      return this._numerator / this._denominator;
    }

    constructor(numerator : number, denominator : number = 1)
    {
      this._numerator = numerator;
      this._denominator = denominator;

      if (!Number.isInteger(this._denominator))
      {
        this.reduce();
      }
    }

    public reduce()
    {
      // if numerator or denominator are decimals, just divide them and set denominator to 1.
      // if denominator is 0, or if either the numerator or denominator are NaN or infinite, just do the division now and get NaN or ±Infinity or 0
      if (!Number.isInteger(this._denominator) || !Number.isInteger(this._numerator) || this._denominator == 0)
      {
        this._numerator = this._numerator/this._denominator;
        this._denominator = 1;
      }
      else if (this.denominator != 1)
      {
        var sign = Math.sign(this._numerator) * Math.sign(this._denominator);
        this._numerator = Math.abs(this._numerator);
        this._denominator = Math.abs(this._denominator);

        // calculate GCD; result is stored in a
        var a = Math.max(this._numerator, this._denominator);
        var b = Math.min(this._numerator, this._denominator);
        while (b != 0)
        {
          var t = b;
          b = a % b;
          a = t;
        }

        this._numerator /= a;
        this._denominator /= a;

        this._numerator *= sign;
      }

      return this;
    }

    public toString(mode : NumberMode = NumberMode.INT_AND_FRACTION, shouldRound : boolean = true, serialize : boolean = false)
    {
      if (this._numerator == 0 && this._denominator == 0)
      {
        return serialize? "NaN" : localizer.get("NumberBlock.notANumber", "NaN");
      }
      else if (this._numerator == 0)
      {
        return serialize? "0" : localizer.get("NumberBlock.zero", "0");
      }
      else if (this._denominator == 1 || mode == NumberMode.DECIMAL)
      {
        var n = this.value;

        if (n == Math.PI)
        {
          return serialize? "π" : localizer.get("NumberBlock.pi", "π");
        }
        else if (n == Math.E)
        {
          return serialize? "e" : localizer.get("NumberBlock.eulersNumber", "e");
        }
        else if (Math.abs(n) < 1e-15 && shouldRound)
        {
          return serialize? "0" : localizer.get("NumberBlock.zero", "0");  // kludgey way to handle floating point errors near zero
        }
        else if (n == Number.POSITIVE_INFINITY)
        {
          return serialize? "∞" : localizer.get("NumberBlock.infinity", "∞");
        }
        else if (n == Number.NEGATIVE_INFINITY)
        {
          return serialize? "-∞" : localizer.get("NumberBlock.negativeInfinity", "-∞");
        }
        else if (Number.isNaN(n))
        {
          return serialize? "NaN" : localizer.get("NumberBlock.notANumber", "NaN");
        }

        // if we're not rounding, just truncate it after three decimals
        if (!shouldRound && !Number.isInteger(n))
        {
          var fullString = n.toString();
          if (serialize)
          {
            return fullString;
          }
          else
          {
            return fullString.substr(0, Math.min(fullString.indexOf(".") + 4, fullString.length));
          }
        }
        else
        {
          // limit string length and try to make it relatively pretty

          var exactString = n.toLocaleString(serialize? "en-US" : undefined);

          var sign = 1;

          if (n < 0)
          {
            n = -n;
            sign = -1;
          }

          var mostSignificantDigit = Math.floor(Math.log10(n));

          if (mostSignificantDigit > 7 || mostSignificantDigit < -3)
          {
            return (sign * n).toExponential(2);
          }

          var intPart = Math.floor(n);

          var decimalPart = n - intPart;

          if (decimalPart < 1e-15 || !shouldRound)
          {
            return exactString;
          }
          else
          {
            var fixedString = (sign * n).toFixed(3);

            if (exactString.length <= 9)
            {
              return exactString;
            }
            else if (fixedString.length > 8)
            {
              return (sign * n).toExponential(2);
            }
            else
            {
              return fixedString;
            }
          }
        }
      }
      else if (mode == NumberMode.INT_AND_FRACTION)
      {
        var intPart = this._numerator / this._denominator;
        if (intPart < 0)
        {
          intPart = Math.ceil(intPart);
        }
        else
        {
          intPart = Math.floor(intPart);
        }
        var fractionalNumerator = Math.abs((this._numerator - this._denominator * intPart) % this._denominator);

        if (fractionalNumerator == 0)
        {
          return intPart.toLocaleString(serialize? "en-US" : undefined);
        }

        return (intPart != 0? intPart + " " : "") + fractionalNumerator + "/" + this._denominator;
      }
      else
      {
        return this._numerator + "/" + this.denominator;
      }
    }

    public plus(b : RationalNumber)
    {
      return new RationalNumber(this.numerator * b.denominator + b.numerator * this.denominator, this.denominator * b.denominator).reduce();
    }

    public minus(b : RationalNumber)
    {
      return new RationalNumber(this.numerator * b.denominator - b.numerator * this.denominator, this.denominator * b.denominator).reduce();
    }

    public times(b: RationalNumber)
    {
      return new RationalNumber(this.numerator * b.numerator, this.denominator * b.denominator).reduce();
    }

    public dividedBy(b : RationalNumber)
    {
      return new RationalNumber(this.numerator * b.denominator, this.denominator * b.numerator).reduce();
    }

    public pow(b : RationalNumber | number)
    {
      if (b instanceof RationalNumber)
      {
        if (b.value < 0)
        {
          return new RationalNumber(Math.pow(this.denominator, -b.value), Math.pow(this.numerator, -b.value)).reduce();
        }
        else
        {
          return new RationalNumber(Math.pow(this.numerator, b.value), Math.pow(this.denominator, b.value)).reduce();
        }
      }
      else
      {
        return new RationalNumber(Math.pow(this.numerator, b), Math.pow(this.denominator, b)).reduce();
      }
    }

    public modulo (b : RationalNumber)
    {
      var d = this.denominator * b.denominator;
      var n1 = this.numerator * b.denominator;
      var n2 = b.numerator * this.denominator;
      return new RationalNumber(n1 % n2, d).reduce();
    }

    public Eq (b : RationalNumber) : boolean
    {
      // fuzzy equals -- if the values are very close and either demoninator is 1, return true and assume a floating-point error
      // otherwise return true only if the values are exactly equal.
      return (this.value == b.value || ((this.denominator == 1 || b.denominator == 1) && Math.abs(this.value - b.value) < Math.pow(0.1, 10)));
    }
  }

  export class NumberBlock extends IdentityBlock
  {
    public rValue : RationalNumber; // rationalValue
    public shouldRound : boolean;

    public get decimalValue ()
    {
      return this.rValue.value;
    }

    constructor (value : RationalNumber | number, shouldRound : boolean = true)
    {
      super();
      this.types.push('NumberBlock');

      if (value === undefined)
      {
        this.rValue = new RationalNumber(0);
      }
      else if (value instanceof RationalNumber)
      {
        this.rValue = value;
      }
      else
      {
        this.rValue = new RationalNumber(value);
      }

      this.shouldRound = shouldRound;
    }

    public Eq (b : Block) : boolean
    {
      var closeEnough = b instanceof NumberBlock && this.rValue.Eq(b.rValue);

      return this.sameType(b) && closeEnough;
    }

    public CloneBlock() : Block
    {
      return new NumberBlock(this.rValue, this.shouldRound);
    }

    public toString(mode : NumberMode = NumberMode.INT_AND_FRACTION) : string
    {
      return this.rValue.toString(mode, this.shouldRound);
    }

    public serialize () : string
    {
      var value = this.rValue.value;
      if (value == Math.PI)
      {
        return 'π';
      }
      else if (value == Math.E)
      {
        return 'e';
      }
      else if (value == Number.POSITIVE_INFINITY)
      {
        return 'Infinity';
      }
      else if (value == Number.NEGATIVE_INFINITY)
      {
        return '-Infinity';
      }

      // TODO: test whether this is round-trip safe
      return this.rValue.toString(NumberMode.REDUCED_FRACTION, false, true);
    }

    static deserialize (serial : string)
    {
      var numerator : number;
      var denominator = 1;
      var divisionIndex = serial.indexOf('/');
      serial = serial.replace(/,/g, '');
      if (serial == 'π')
      {
        numerator = Math.PI;
      }
      else if (serial == 'e')
      {
        numerator = Math.E;
      }
      else if (divisionIndex != -1)
      {
        numerator = Number.parseFloat(serial.substring(0, divisionIndex));
        denominator = Number.parseInt(serial.substring(divisionIndex + 1));
      }
      else
      {
        numerator = Number.parseFloat(serial);
      }

      return new NumberBlock(new RationalNumber(numerator, denominator));
    }
  }

  NumberBlock.prototype.serializationPattern = /(?:-?[0-9,]+\.?[0-9]*(?:[eE][+-]?[0-9]+)?(?:\/-?[0-9]+)?|-?Infinity|NaN|π|e)/;


  export class BooleanBlock extends IdentityBlock
  {
    public value : boolean;

    constructor(value : boolean)
    {
      super();
      this.types.push('BooleanBlock');

      if (value !== true)
      {
        this.value = false;
      }
      else
      {
        this.value = true;
      }
    }

    public Eq (b : Block) : boolean
    {
      return this.sameType(b) && ((b as BooleanBlock).value == this.value);
    }

    public CloneBlock () : Block
    {
      return new BooleanBlock(this.value);
    }

    public toString() : string
    {
      return localizer.get("BooleanBlock." + this.value, this.value == true? 'T' : 'F');
    }

    public serialize() : string
    {
      return this.value == true? 'T' : 'F';
    }

    static deserialize (serial : string) : BooleanBlock
    {
      if (serial == "T")
      {
        return new BooleanBlock(true);
      }
      else
      {
        return new BooleanBlock(false);
      }
    }
  }

  BooleanBlock.prototype.serializationPattern = /[TF]/;

  export class StringBlock extends IdentityBlock
  {
    public value : string;

    constructor(value : string)
    {
      super();
      this.types.push('StringBlock');

      if (value === undefined)
      {
        this.value = '';
      }
      else
      {
      	this.value = value;
      }
    }

  	public Eq(b : Block) : boolean
  	{
  		return this.sameType(b) && (b as StringBlock).value == this.value;
  	}

  	public CloneBlock() : Block
  	{
  		return new StringBlock (this.value);
  	}

  	public toString() : string
  	{
  		return this.serialize ();
  	}

    public serialize() : string
    {
  		return '"' + this.value.replace(/\\/g, '\\\\').replace (/"/g, '\\"') + '"';
    }

    static deserialize (serial : string) : StringBlock
    {
    	var s = serial.substr(1, serial.length-2);

      s = s.replace(/\\"/g, '"');

      s = s.replace(/\\\\/g, '\\');

    	return new StringBlock (s);
    }
  }

  StringBlock.prototype.serializationPattern = /"(?:[^\\\"]|\\.)*"/;

  export class MemoryReferenceBlock extends IdentityBlock
  {
    public memoryReference : string;

    constructor(memoryReference : string)
    {
      super();
      this.types.push('MemoryReferenceBlock');
      this.memoryReference = memoryReference;
    }

    public CloneBlock() : MemoryReferenceBlock
    {
      return new MemoryReferenceBlock(this.memoryReference);
    }

    public Eq(b : Block) : boolean
    {
      return this.sameType(b) && this.memoryReference == (b as MemoryReferenceBlock).memoryReference;
    }

    public serialize()
    {
      return "MemRef[" + this.memoryReference + "]";
    }

    public toString()
    {
      return this.memoryReference;
    }

    static deserialize(serial : string)
    {
      return new MemoryReferenceBlock(serial.substring(7, serial.length - 1));
    }
  }

  MemoryReferenceBlock.prototype.serializationPattern = /MemRef\[[^\[\]]*\]/;

  export class MemoryBlock extends IdentityBlock
  {
    public _objectReference : string;

    constructor(objectReference : string)
    {
      super();
      this.types.push('MemoryBlock');
      this._objectReference = objectReference;
    }

    public CloneBlock() : MemoryBlock
    {
      var clone = new MemoryBlock(this._objectReference);
      return clone;
    }

    public getReferenceId() : string
    {
      return this._objectReference;
    }

    public Eq (b : Block) : boolean
    {
      return this.sameType(b) && (b as MemoryBlock).getReferenceId() == this.getReferenceId();
    }

    public getStateVariable(key : string, vm : Polyscript.VirtualMachine) : Block
    {
      var variable = vm.getStateVariable(this.getReferenceId(), key);

      if (variable)
      {
        return variable;
      }
      else
      {
        return new Polyscript.ErrorBlock(localizer.get("Errors.getStateVariable", "Could not find variable {{name}} of object {{objectId}}.", {name:localizer.get("StateVariableNames." + key, key), objectId:this.getReferenceId()}));
      }
    }

    public serialize() : string
    {
      return "Object[" + this._objectReference + "]";
    }

    public toString() : string
    {
      return this._objectReference;
    }

    static deserialize (serial : string) : MemoryBlock
    {
      var commaIndex = serial.indexOf(",");
      var objectName : string;
      var stateVariables : string;

      if (commaIndex >= 0)
      {
        objectName = serial.substring(7, commaIndex);
        stateVariables = serial.substring(commaIndex + 2, serial.length - 1);
      }
      else
      {
        objectName = serial.substring(7, serial.length - 1);
      }

      var ob = new MemoryBlock(objectName);

      // ignore stateVariables; need to parse for backwards-compatibility but don't need to use them any more

      return ob;
    }
  }

  MemoryBlock.prototype.serializationPattern = /Object\[[\w]*(?:, \{.*\})?\]/

  export class RandomIntBlock extends NumberBlock
  {
    public min : number;
    public max : number;

    constructor(min : number, max : number)
    {
      var value;
      if (min === undefined || max === undefined || min > max)
      {
        value = RNG.int(-128, 128);
      }
      else
      {
        value = RNG.int(min, max);
      }

      super(new RationalNumber(value));

      this.types.push('RandomIntBlock');
      this.min = min;
      this.max = max;
    }

    public CloneBlock() : Block
    {
      var block = new RandomIntBlock(this.min, this.max);
      block.rValue = this.rValue;

      return block;
    }

    public serialize() : string
    {
      if (this.min === undefined || this.max === undefined || this.min > this.max)
      {
        return "int";
      }
      else
      {
        return "int(" + this.min + "-" + this.max + ")";
      }
    }

    static deserialize (serial : string) : RandomIntBlock
    {
      var matches = /(-?\d+)-(-?\d+)/.exec(serial);
      if (matches !== null)
      {
        var min = Number.parseInt(matches[1]);
        var max = Number.parseInt(matches[2]);
        return new RandomIntBlock(min, max);
      }
      else
      {
        return new RandomIntBlock(undefined, undefined);
      }
    }
  }

  RandomIntBlock.prototype.serializationPattern = /int(?:\(-?\d+--?\d+\))?/;


  export class RandomRealBlock extends NumberBlock
  {
    public min : number;
    public max : number;

    constructor(min : number, max : number)
    {
      var value;
      if (min === undefined || max === undefined || min > max)
      {
        value = RNG.real(-100, 100);
      }
      else
      {
        value = RNG.real(min, max);
      }

      super(new RationalNumber(value));
      this.types.push('RandomRealBlock');

      this.min = min;
      this.max = max;
    }

    public CloneBlock() : Block
    {
      var rrb = new RandomRealBlock(this.min, this.max);
      rrb.rValue = this.rValue;

      return rrb;
    }

    public serialize() : string
    {
      if (this.min === undefined || this.max === undefined || this.min > this.max)
      {
        return "real";
      }
      else
      {
        return "real(" + this.min + "-" + this.max + ")";
      }
    }

    static deserialize (serial : string) : RandomRealBlock
    {
      var matches = /(-?[0-9,]+\.?[0-9]*(?:[eE][+-]?[0-9]+)?)-(-?[0-9,]+\.?[0-9]*(?:[eE][+-]?[0-9]+)?)/.exec(serial);
      if (matches !== null)
      {
        var min = Number.parseFloat(matches[1]);
        var max = Number.parseFloat(matches[2]);
        return new RandomRealBlock(min, max);
      }
      else
      {
        return new RandomRealBlock(undefined, undefined);
      }
    }
  }

  RandomRealBlock.prototype.serializationPattern = /real(?:\(-?[0-9,]+\.?[0-9]*(?:[eE][+-]?[0-9]+)?--?[0-9,]+\.?[0-9]*(?:[eE][+-]?[0-9]+)?\))?/;

  export class RandomBoolBlock extends BooleanBlock
  {
    constructor()
    {
      var value = RNG.real(0, 1) >= 0.5;

      super(value);
      this.types.push('RandomBoolBlock');
    }

    public CloneBlock() : Block
    {
      var rbb = new RandomBoolBlock();
      rbb.value = this.value;
      return rbb;
    }

    public serialize() : string
    {
      return "bool";
    }

    static deserialize (_serial : string) : RandomBoolBlock
    {
      return new RandomBoolBlock();
    }
  }

  RandomBoolBlock.prototype.serializationPattern = /bool/;

  export class RandBlock extends Block
  {
    constructor()
    {
      super();
      this.types.push('RandBlock');
    }

    public Evaluate(currentState : ProgramState) : void
    {
      var randMode = currentState.vm.getNextRandMode();

      if (randMode == RandMode.max)
      {
        currentState.push(new NumberBlock(new RationalNumber(1 - Number.EPSILON), false));
      }
      else if (randMode == RandMode.min)
      {
        currentState.push(new NumberBlock(new RationalNumber(0)));
      }
      else
      {
        currentState.push(new NumberBlock(new RationalNumber(Math.random())));
      }
    }

    public CloneBlock() : Block
    {
      return new RandBlock();
    }

    public serialize() : string
    {
      return "rand";
    }

    public toString() : string
    {
      return localizer.get("RandBlock.string", "rand");
    }

    static deserialize (_serial : string) : RandBlock
    {
      return new RandBlock();
    }
  }

  RandBlock.prototype.serializationPattern = /rand/;

  /////////////////////////////// Operator Blocks ///////////////////////////////

  export abstract class UnaryOperator extends Block
  {
    public T : string;

    constructor(T : string)
    {
      super();
      this.types.push('UnaryOperator');
      this.T = T;
    }

    public abstract performOperation (a : Block, currentState? : ProgramState) : Block;

    public Evaluate(currentState : ProgramState) : void
    {
      var a : Block;
      a = currentState.peekT(this.T);
      currentState.pop(this);

      if (a != null)
      {
        currentState.push(this.performOperation(a, currentState));
      }
      else
      {
        var errorMessage = localizer.get("Errors.UnaryOperator", "{{operatorName}} requires a {{operandType}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get(this.T + ".name", this.T)});

        currentState.push(new ErrorBlock(errorMessage));
      }
    }
  }

  export abstract class BinaryOperator extends Block
  {
    public T : string;
    public U : string;

    constructor (T : string, U : string)
    {
      super();
      this.types.push('BinaryOperator');
      this.T = T;
      this.U = U;
    }

    public abstract performOperation(a : Block, b : Block, currentState? : ProgramState) : Block;

    public Evaluate(currentState : ProgramState) : void
    {
      var a : Block, b : Block;

      b = currentState.peekT(this.U);
      currentState.pop(this);
      a = currentState.peekT(this.T);
      currentState.pop(this);

      if (a != null && b != null)
      {
        currentState.push(this.performOperation(a, b, currentState));
      }
      else
      {
        var errorMessage;
        if (this.T === this.U)
        {
          errorMessage = localizer.get("Errors.BinaryOperator_A", "{{operatorName}} requires two {{operandType}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get(this.T + ".name", this.T)});
        }
        else
        {
          errorMessage = localizer.get("Errors.BinaryOperator_B", "{{operatorName}} requires a {{operandType1}} and a {{operandType2}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U)});
        }

        currentState.push(new ErrorBlock(errorMessage));
      }
    }
  }

  export abstract class TrinaryOperator extends Block
  {
    public T : string;
    public U : string;
    public V : string;

    constructor(T : string, U : string, V : string)
    {
      super();
      this.types.push('TrinaryOperator');
      this.T = T;
      this.U = U;
      this.V = V;
    }

    public abstract performOperation(a : Block, b : Block, c : Block, currentState? : ProgramState) : Block;

    public Evaluate(currentState : ProgramState) : void
    {
      var a : Block, b : Block, c : Block;

      c = currentState.peekT(this.V);
      currentState.pop(this);
      b = currentState.peekT(this.U);
      currentState.pop(this);
      a = currentState.peekT(this.T);
      currentState.pop(this);

      if (a != null && b != null && c != null)
      {
        currentState.push(this.performOperation(a, b, c, currentState));
      }
      else
      {
        var errorMessage;
        if (this.T === this.U && this.U === this.V)
        {
          errorMessage = localizer.get("Errors.TrinaryOperator_A", "{{operatorName}} requires three {{operandType}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get(this.T + ".name", this.T)});
        }
        else if (this.T === this.U)
        {
          errorMessage = localizer.get("Errors.TrinaryOperator_B", "{{operatorName}} requires two {{operandType1}}s and a {{operandType2}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.V + ".name", this.V)});
        }
        else if (this.U === this.V)
        {
          errorMessage = localizer.get("Errors.TrinaryOperator_C", "{{operatorName}} requires a {{operandType1}} and two {{operandType2}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U)});
        }
        else
        {
          errorMessage = localizer.get("Errors.TrinaryOperator_D", "{{operatorName}} requires a {{operandType1}}, a {{operandType2}}, and a {{operandType3}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U), operandType3:localizer.get(this.V + ".name", this.V)});
        }

        currentState.push(new ErrorBlock(errorMessage));
      }
    }
  }

  export abstract class QuaternaryOperator extends Block
  {
    public T : string;
    public U : string;
    public V : string;
    public W : string;

    constructor(T : string, U : string, V : string, W : string)
    {
      super();
      this.types.push('QuaternaryOperator');
      this.T = T;
      this.U = U;
      this.V = V;
      this.W = W;
    }

    public abstract performOperation(a : Block, b : Block, c : Block, d : Block, currentState? : ProgramState) : Block;

    public Evaluate(currentState : ProgramState) : void
    {
      var a : Block;
  		var b : Block;
  		var c : Block;
      var d : Block;

      d = currentState.peekT(this.W);
      currentState.pop (this);
  		c = currentState.peekT(this.V);
  		currentState.pop (this);
  		b = currentState.peekT(this.U);
  		currentState.pop (this);
  		a = currentState.peekT(this.T);
  		currentState.pop (this);

  		if (a != null && b != null && c != null && d != null) {
  			currentState.push(this.performOperation (a, b, c, d, currentState));
  		}
  		else {
  			var errorMessage;
  			if (this.T == this.U && this.U == this.V && this.V == this.W)
  			{
  				errorMessage = localizer.get("Errors.QuaternaryOperator_TTTT", "{{operatorName}} requires four {{operandType}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get(this.T + ".name", this.T)});
  			}
        else if (this.T == this.U && this.T == this.V)
        {
          errorMessage = localizer.get("Errors.QuaternaryOperator_TTTW", "{{operatorName}} requires three {{operandType1}}s and a {{operandtype2}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.W + ".name", this.W)});
        }
  			else if (this.T == this.U)
  			{
          if (this.V == this.W)
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TTVV", "{{operatorName}} requires two {{operandType1}}s and two {{operandType2}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.V + ".name", this.V)});
          }
          else
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TTVW", "{{operatorName}} requires two {{operandType1}}s, a {{operandType2}}, and a {{operandType3}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.V + ".name", this.V), operandType3:localizer.get(this.W + ".name", this.W)});
          }
  			}
  			else
        {
          if (this.U == this.V && this.U == this.W)
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TUUU", "{{operatorName}} requires a {{operandType1}} and three {{operandType2}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U)});
          }
          else if (this.U == this.V)
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TUUW", "{{operatorName}} requires a {{operandType1}}, two {{operandType2}}s, and a {{operandType3}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U), operandType3:localizer.get(this.W + ".name", this.W)});
          }
          else
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TUVW", "{{operatorName}} requires a {{operandType1}}, a {{operandType2}}, a {{operandType3}}, and a {{operandType4}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U), operandType3:localizer.get(this.V + ".name", this.V), operandType4:localizer.get(this.W + ".name", this.W)});
          }
        }
  			currentState.push (new ErrorBlock (errorMessage));
  		}
  	}
  }

  export abstract class BinaryOperatorOverloaded extends BinaryOperator
  {
    public TTypes : string[];
    public UTypes : string[];

    constructor (T : string[], U : string[])
    {
      super("Block", "Block");
      this.types.push('BinaryOperatorOverloaded');
      this.TTypes = T.slice();
      this.UTypes = U.slice();
    }

    public performOperation(_a : Block, _b : Block, _currentState? : ProgramState) : Block
    {
      throw "Not implemented.  Use performOperationWithTypes instead.";
    }

    public abstract performOperationWithTypes(a: Block, b : Block, typeCombination : number, currentState?: ProgramState) : Block;

    public Evaluate(currentState : ProgramState) : void
    {
      var a : Block, b : Block;

      b = currentState.peek();
      currentState.pop(this);
      a = currentState.peek();
      currentState.pop(this);

      if (a != null && b != null)
      {
        //var aType = a.GetType (), bType = b.GetType ();
				var validTypes = false;
				var i : number;

				for (i = 0; i < this.TTypes.length; i++)
				{
					if (a.types.find((x) => x == this.TTypes[i]) && b.types.find((x) => x == this.UTypes[i]))//(this.TTypes[i].IsAssignableFrom(aType) && UTypes[i].IsAssignableFrom(bType))
					{
						validTypes = true;
						break;
					}
				}

				if (!validTypes)
				{
					currentState.push(this.GetTypeErrorBlock ());
				}
				else
				{
					currentState.push(this.performOperationWithTypes (a, b, i, currentState));
				}
      }
      else
      {
        currentState.push(this.GetTypeErrorBlock());
      }
    }

    public GetTypeErrorBlock() : ErrorBlock
    {
      var errorMessage : string;

			var typeStrings = "";
      var separator = localizer.get("Errors.BinaryOperandPhrase_Separator", ",");

			for (var i = 0; i < this.TTypes.length; i++)
			{
        var phrase : string;

        if (this.TTypes[i] == this.UTypes[i])
        {
          phrase = localizer.get("Errors.BinaryOperandPhrase_A", "two {{operandType}}s", {operandType: localizer.get(this.TTypes[i] + ".name", this.TTypes[i])});
        }
        else
        {
          phrase = localizer.get("Errors.BinaryOperandPhrase_B", "a {{operandType1}} and a {{operandType2}}", {operandType1:localizer.get(this.TTypes[i] + ".name", this.TTypes[i]), operandType2:localizer.get(this.UTypes[i] + ".name", this.UTypes[i])});
        }

        if (i > 0 && i == this.TTypes.length - 1)
        {
          phrase = localizer.get("Errors.OperandPhraseEnd", "{{operandPhraseSeparator}} or {{operandPhrase}}", {operandPhraseSeparator: separator, operandPhrase:phrase});
        }
        else if (i > 0)
        {
          phrase = localizer.get("Errors.OperandPhraseMid", "{{operandPhraseSeparator}} {{operandPhrase}}", {operandPhraseSeparator: separator, operandPhrase:phrase});
        }
        else
        {
          phrase = localizer.get("Errors.OperandPhraseStart", "{{operandPhrase}}", {operandPhrase:phrase});
        }
        typeStrings += phrase;
			}

			errorMessage = localizer.get("Errors.OverloadedOperator", "{{operatorName}} requires {{operandPhrases}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandPhrases: typeStrings});

			return new ErrorBlock (errorMessage);
		}
  }

  export abstract class TrinaryOperatorOverloaded extends TrinaryOperator
  {
    public TTypes : string[];
    public UTypes : string[];
    public VTypes : string[]

    constructor (T : string[], U : string[], V : string[])
    {
      super("Block", "Block", "Block");
      this.types.push('TrinaryOperatorOverloaded');
      this.TTypes = T.slice();
      this.UTypes = U.slice();
      this.VTypes = V.slice();
    }

    public performOperation(_a : Block, _b : Block, _c : Block, _currentState? : ProgramState) : Block
    {
      throw "Not implemented.  Use performOperationWithTypes instead.";
    }

    public abstract performOperationWithTypes(a: Block, b : Block, c : Block, typeCombination : number, currentState? : ProgramState) : Block;

    public Evaluate(currentState : ProgramState) : void
    {
      var a : Block, b : Block, c : Block;
      c = currentState.peek();
      currentState.pop(this);
      b = currentState.peek();
      currentState.pop(this);
      a = currentState.peek();
      currentState.pop(this);

      if (a != null && b != null && c != null)
      {
        //var aType = a.GetType (), bType = b.GetType ();
				var validTypes = false;
				var i : number;

				for (i = 0; i < this.TTypes.length; i++)
				{
					if (a.types.find((x) => x == this.TTypes[i]) && b.types.find((x) => x == this.UTypes[i]) && c.types.find((x) => x == this.VTypes[i]))
					{
						validTypes = true;
						break;
					}
				}

				if (!validTypes)
				{
					currentState.push(this.GetTypeErrorBlock ());
				}
				else
				{
					currentState.push(this.performOperationWithTypes (a, b, c, i, currentState));
				}
      }
      else
      {
        currentState.push(this.GetTypeErrorBlock());
      }
    }

    public GetTypeErrorBlock() : ErrorBlock
    {
      var errorMessage : string;

      var typeStrings = "";
      var separator = localizer.get("Errors.TrinaryOperandPhrase_Separator", ",");

      for (var i = 0; i < this.TTypes.length; i++)
      {
        var phrase : string;
      	if (this.TTypes[i] == this.UTypes[i] && this.UTypes[i] == this.VTypes[i])
				{
					phrase = localizer.get("Errors.TrinaryOperandPhrase_A", "three {{operandType}}s", {operandType: localizer.get(this.TTypes[i] + ".name", this.TTypes[i])});
				}
				else if (this.TTypes[i] == this.UTypes[i])
				{
          phrase = localizer.get("Errors.TrinaryOperandPhrase_B", "two {{operandType1}}s and a {{operandType2}}", {operandType1: localizer.get(this.TTypes[i] + ".name", this.TTypes[i]), operandType2: localizer.get(this.VTypes[i] + ".name", this.VTypes[i])});
				}
				else if (this.UTypes[i] == this.VTypes[i])
				{
          phrase = localizer.get("Errors.TrinaryOperandPhrase_C", "a {{operandType1}}s and two {{operandType2}}", {operandType1: localizer.get(this.TTypes[i] + ".name", this.TTypes[i]), operandType2: localizer.get(this.UTypes[i] + ".name", this.UTypes[i])});
				}
				else
				{
          phrase = localizer.get("Errors.TrinaryOperandPhrase_D", "a {{operandType1}}, a {{operandType2}}, and a {{operandType3}}", {operandType1: localizer.get(this.TTypes[i] + ".name", this.TTypes[i]), operandType2: localizer.get(this.UTypes[i] + ".name", this.UTypes[i]), operandType3: localizer.get(this.VTypes[i] + ".name", this.VTypes[i])});
				}

        if (i > 0 && i == this.TTypes.length - 1)
        {
          phrase = localizer.get("Errors.OperandPhraseEnd", "{{operandPhraseSeparator}} or {{operandPhrase}}", {operandPhraseSeparator: separator, operandPhrase:phrase});
        }
        else if (i > 0)
        {
          phrase = localizer.get("Errors.OperandPhraseMid", "{{operandPhraseSeparator}} {{operandPhrase}}", {operandPhraseSeparator: separator, operandPhrase:phrase});
        }
        else
        {
          phrase = localizer.get("Errors.OperandPhraseStart", "{{operandPhrase}}", {operandPhrase:phrase});
        }
        typeStrings += phrase;
			}

      errorMessage = localizer.get("Errors.OverloadedOperator", "{{operatorName}} requires {{operandPhrases}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandPhrases: typeStrings});

			return new ErrorBlock (errorMessage);
		}
  }

  export class PlusOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('PlusOperator');
    }

    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new NumberBlock(a.rValue.plus(b.rValue));
    }
    public toString() : string
    {
      return localizer.get("PlusOperator.string", "+");
    }
    public serialize() : string
    {
      return "+";
    }

    static deserialize(_serial : string) : PlusOperator
    {
      return new PlusOperator();
    }
  }

  PlusOperator.prototype.serializationPattern = /\+/;

  export class MinusOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('MinusOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new NumberBlock(a.rValue.minus(b.rValue));
    }
    public toString() : string
    {
      return localizer.get("MinusOperator.string", "-");
    }
    public serialize() : string
    {
      return "-";
    }
    static deserialize(_serial : string) : MinusOperator
    {
      return new MinusOperator();
    }
  }

  MinusOperator.prototype.serializationPattern = /-/;

  export class MultiplyOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('MultiplyOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new NumberBlock(a.rValue.times(b.rValue));
    }
    public toString() : string
    {
      return localizer.get("MultiplyOperator.string", "*");
    }
    public serialize() : string
    {
      return "*";
    }
    static deserialize(_serial : string) : MultiplyOperator
    {
      return new MultiplyOperator();
    }
  }

  MultiplyOperator.prototype.serializationPattern = /\*/;

  export class DivideOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('DivideOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new NumberBlock(a.rValue.dividedBy(b.rValue));
    }
    public toString() : string
    {
      return localizer.get("DivideOperator.string", "÷");
    }
    public serialize() : string
    {
      return '/';
    }
    static deserialize(_serial : string) : DivideOperator
    {
      return new DivideOperator();
    }
  }

  DivideOperator.prototype.serializationPattern = /\//;

  export class PowerOperator extends BinaryOperator
  {
    constructor ()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('PowerOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new NumberBlock(a.rValue.pow(b.rValue));
    }
    public toString() : string
    {
      return localizer.get("PowerOperator.string", "pow");
    }
    public serialize() : string
    {
      return 'pow';
    }
    static deserialize(_serial : string) : PowerOperator
    {
      return new PowerOperator();
    }
  }

  PowerOperator.prototype.serializationPattern = /pow/;

  export class ModuloOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('ModuloOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new NumberBlock(a.rValue.modulo(b.rValue));
    }
    public toString() : string
    {
      return localizer.get("ModuloOperator.string", "mod");
    }
    public serialize() : string
    {
      return 'mod';
    }
    static deserialize(_serial : string) : ModuloOperator
    {
      return new ModuloOperator();
    }
  }

  ModuloOperator.prototype.serializationPattern = /%|mod|modulo/;

  export class MinOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('MinOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      if (a.decimalValue < b.decimalValue)
      {
        return a.CloneBlock();
      }
      else
      {
        return b.CloneBlock();
      }
    }
    public toString() : string
    {
      return localizer.get("MinOperator.string", "min");
    }
    public serialize() : string
    {
      return 'min';
    }
    static deserialize(_serial : string) : MinOperator
    {
      return new MinOperator();
    }
  }

  MinOperator.prototype.serializationPattern = /min/;

  export class MaxOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('MaxOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      if (a.decimalValue > b.decimalValue)
      {
        return a.CloneBlock();
      }
      else
      {
        return b.CloneBlock();
      }
    }
    public toString() : string
    {
      return localizer.get("MaxOperator.string", "max");
    }
    public serialize() : string
    {
      return 'max';
    }
    static deserialize(_serial : string) : MaxOperator
    {
      return new MaxOperator();
    }
  }

  MaxOperator.prototype.serializationPattern = /max/;

  export class CeilOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('CeilOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.ceil(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("CeilOperator.string", "ceil");
    }
    public serialize() : string
    {
      return 'ceil';
    }
    static deserialize(_serial : string) : CeilOperator
    {
      return new CeilOperator();
    }
  }

  CeilOperator.prototype.serializationPattern = /ceil/;

  export class FloorOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('FloorOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.floor(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("FloorOperator.string", "floor");
    }
    public serialize() : string
    {
      return 'floor';
    }
    static deserialize(_serial : string) : FloorOperator
    {
      return new FloorOperator();
    }
  }

  FloorOperator.prototype.serializationPattern = /floor/;

  export class RoundOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('RoundOperator');
    }

    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.round(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("RoundOperator.string", "round");
    }
    public serialize() : string
    {
      return 'round';
    }
    static deserialize(_serial : string) : RoundOperator
    {
      return new RoundOperator();
    }
  }

  RoundOperator.prototype.serializationPattern = /round/;
  export class AbsOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('AbsOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(new RationalNumber(Math.abs(a.rValue.numerator), Math.abs(a.rValue.denominator)));
    }
    public toString() : string
    {
      return localizer.get("AbsOperator.string", "abs");
    }
    public serialize() : string
    {
      return 'abs';
    }
    static deserialize(_serial : string) : AbsOperator
    {
      return new AbsOperator();
    }
  }

  AbsOperator.prototype.serializationPattern = /abs/;

  export class FactorialOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('FactorialOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      if (a.decimalValue < 0 || !Number.isInteger(a.decimalValue))
      {
        return new ErrorBlock (localizer.get("Errors.naturalNumber", "Input must be a natural number."));
      }

      var result = 1;
      for (var i = 2; i <= a.decimalValue; i++)
      {
        result *= i;
        if (!Number.isFinite(result))
        {
          return new NumberBlock(result);
        }
      }

      return new NumberBlock(result);
    }
    public toString() : string
    {
      return localizer.get("FactorialOperator.string", "!");
    }
    public serialize() : string
    {
      return '!';
    }
    static deserialize(_serial : string) : FactorialOperator
    {
      return new FactorialOperator();
    }
  }

  FactorialOperator.prototype.serializationPattern = /!/;

  export class SquareRootOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('SquareRootOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(a.rValue.pow(0.5));
    }
    public toString() : string
    {
      return localizer.get("SquareRootOperator.string", "√");
    }
    public serialize() : string
    {
      return '√';
    }
    static deserialize(_serial : string) : SquareRootOperator
    {
      return new SquareRootOperator();
    }
  }

  SquareRootOperator.prototype.serializationPattern = /√|sqrt/;

  export class LogarithmOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('LogarithmOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.log10(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("LogarithmOperator.string", "log");
    }
    public serialize() : string
    {
      return 'log';
    }
    static deserialize(_serial : string) : LogarithmOperator
    {
      return new LogarithmOperator();
    }
  }

  LogarithmOperator.prototype.serializationPattern = /log/;

  export class NaturalLogarithmOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('NaturalLogarithmOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.log(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("NaturalLogarithmOperator.string", "ln");
    }
    public serialize() : string
    {
      return 'ln';
    }
    static deserialize(_serial : string) : NaturalLogarithmOperator
    {
      return new NaturalLogarithmOperator();
    }
  }

  NaturalLogarithmOperator.prototype.serializationPattern = /ln/;

  export class SineOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('SineOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.sin(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("SineOperator.string", "sin");
    }
    public serialize() : string
    {
      return 'sin';
    }
    static deserialize(_serial : string) : SineOperator
    {
      return new SineOperator();
    }
  }

  SineOperator.prototype.serializationPattern = /sin/;

  export class CosineOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('CosineOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.cos(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("CosineOperator.string", "cos");
    }
    public serialize() : string
    {
      return 'cos';
    }
    static deserialize(_serial : string) : CosineOperator
    {
      return new CosineOperator();
    }
  }

  CosineOperator.prototype.serializationPattern = /cos/;

  export class TangentOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('TangentOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.tan(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("TangentOperator.string", "tan");
    }
    public serialize() : string
    {
      return 'tan';
    }
    static deserialize(_serial : string) : TangentOperator
    {
      return new TangentOperator();
    }
  }

  TangentOperator.prototype.serializationPattern = /tan/;

  export class ArcSineOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('ArcSineOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.asin(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("ArcSineOperator.string", "sin⁻¹");
    }
    public serialize() : string
    {
      return 'arcsin';
    }
    static deserialize(_serial : string) : ArcSineOperator
    {
      return new ArcSineOperator();
    }
  }

  ArcSineOperator.prototype.serializationPattern = /arcsin/;

  export class ArcCosineOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('ArcCosineOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.acos(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("ArcCosineOperator.string", "cos⁻¹");
    }
    public serialize() : string
    {
      return 'arccos';
    }
    static deserialize(_serial : string) : ArcCosineOperator
    {
      return new ArcCosineOperator();
    }
  }

  ArcCosineOperator.prototype.serializationPattern = /arccos/;

  export class ArcTangentOperator extends UnaryOperator
  {
    constructor()
    {
      super('NumberBlock');
      this.types.push('ArcTangentOperator');
    }
    public performOperation(a : NumberBlock) : Block
    {
      return new NumberBlock(Math.atan(a.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("ArcTangentOperator.string", "tan⁻¹");
    }
    public serialize() : string
    {
      return 'arctan';
    }
    static deserialize(_serial : string) : ArcTangentOperator
    {
      return new ArcTangentOperator();
    }
  }

  ArcTangentOperator.prototype.serializationPattern = /arctan/;

  export class ArcTangent2Operator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('ArcTangent2Operator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new NumberBlock(Math.atan2(a.decimalValue, b.decimalValue));
    }
    public toString() : string
    {
      return localizer.get("ArcTangent2Operator.string", "tan⁻¹\u00a02");
    }
    public serialize() : string
    {
      return 'arctan2';
    }
    static deserialize(_serial : string) : ArcTangent2Operator
    {
      return new ArcTangent2Operator();
    }
  }

  ArcTangent2Operator.prototype.serializationPattern = /arctan2/;

  export class LTOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('LTOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new BooleanBlock(a.decimalValue < b.decimalValue && !a.Eq(b));
    }
    public toString() : string
    {
      return localizer.get("LTOperator.string", "<");
    }
    public serialize() : string
    {
      return '<';
    }
    static deserialize(_serial : string) : LTOperator
    {
      return new LTOperator();
    }
  }

  LTOperator.prototype.serializationPattern = /</;

  export class GTOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('GTOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new BooleanBlock(a.decimalValue > b.decimalValue && !a.Eq(b));
    }
    public toString() : string
    {
      return localizer.get("GTOperator.string", ">");
    }
    public serialize() : string
    {
      return '>';
    }
    static deserialize(_serial : string) : GTOperator
    {
      return new GTOperator();
    }
  }

  GTOperator.prototype.serializationPattern = />/;

  export class LEQOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('LEQOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new BooleanBlock(a.decimalValue <= b.decimalValue || a.Eq(b));
    }
    public toString() : string
    {
      return localizer.get("LEQOperator.string", "≤");
    }
    public serialize() : string
    {
      return '<=';
    }
    static deserialize(_serial : string) : LEQOperator
    {
      return new LEQOperator();
    }
  }

  LEQOperator.prototype.serializationPattern = /<=/;

  export class GEQOperator extends BinaryOperator
  {
    constructor()
    {
      super('NumberBlock', 'NumberBlock');
      this.types.push('GEQOperator');
    }
    public performOperation(a : NumberBlock, b : NumberBlock) : Block
    {
      return new BooleanBlock(a.decimalValue >= b.decimalValue || a.Eq(b));
    }
    public toString() : string
    {
      return localizer.get("GEQOperator.string", "≥");
    }
    public serialize() : string
    {
      return '>=';
    }
    static deserialize(_serial : string) : GEQOperator
    {
      return new GEQOperator();
    }
  }

  GEQOperator.prototype.serializationPattern = />=/;

  export class EQOperator extends BinaryOperator
  {
    constructor()
    {
      super('Block', 'Block');
      this.types.push('EQOperator');
    }
    public performOperation(a : Block, b : Block) : Block
    {
      return new BooleanBlock(a.Eq(b));
    }
    public toString() : string
    {
      return localizer.get("EQOperator.string", "=");
    }
    public serialize() : string
    {
      return '=';
    }
    static deserialize(_serial : string) : EQOperator
    {
      return new EQOperator();
    }
  }

  EQOperator.prototype.serializationPattern = /=/;

  export class NotOperator extends UnaryOperator
  {
    constructor()
    {
      super('BooleanBlock');
      this.types.push('NotOperator');
    }
    public performOperation(a : BooleanBlock) : Block
    {
      return new BooleanBlock(!a.value);
    }
    public toString() : string
    {
      return localizer.get("NotOperator.string", "~");
    }
    public serialize() : string
    {
      return '~';
    }
    static deserialize(_serial : string) : NotOperator
    {
      return new NotOperator();
    }
  }

  NotOperator.prototype.serializationPattern = /~/;

  export class AndOperator extends BinaryOperator
  {
    constructor()
    {
      super('BooleanBlock', 'BooleanBlock');
      this.types.push('AndOperator');
    }
    public performOperation(a : BooleanBlock, b : BooleanBlock) : Block
    {
      return new BooleanBlock(a.value && b.value);
    }
    public toString() : string
    {
      return localizer.get("AndOperator.string", "&");
    }
    public serialize() : string
    {
      return '&';
    }
    static deserialize(_serial : string) : AndOperator
    {
      return new AndOperator();
    }
  }

  AndOperator.prototype.serializationPattern = /&/;

  export class OrOperator extends BinaryOperator
  {
    constructor()
    {
      super('BooleanBlock', 'BooleanBlock');
      this.types.push('OrOperator');
    }
    public performOperation(a : BooleanBlock, b : BooleanBlock) : Block
    {
      return new BooleanBlock(a.value || b.value);
    }
    public toString() : string
    {
      return localizer.get("OrOperator.string", "|");
    }
    public serialize() : string
    {
      return '|';
    }
    static deserialize(_serial : string) : OrOperator
    {
      return new OrOperator();
    }
  }

  OrOperator.prototype.serializationPattern = /\|/;

  /////////////////////////////// Variable Blocks ///////////////////////////////

  export class LetBlock extends Block
  {
    public name : string;
    public isInput : boolean;

    constructor(name : string)
    {
      super();
      this.types.push('LetBlock');
      this.isInput = false;

      if (name === undefined)
      {
        this.name = 'x';
      }
      else
      {
        this.name = name;
      }
    }

    public Evaluate(currentState : ProgramState) : void
    {
      var a = currentState.peekT('Block');
  		currentState.pop (this);

  		if (a != null) {
  			currentState.assign (this.name, a, false);
  		}
  		else {
  			currentState.push (new ErrorBlock (localizer.get("Errors.UnaryOperator", "{{operatorName}} requires a {{operandType}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get("Block.name", "Block")})));
  		}
    }

    public Eq(b : Block) : boolean
    {
      return this.sameType(b) && (b as LetBlock).name == this.name;
    }

    public CloneBlock() : Block
    {
      var lb = new LetBlock(this.name);
      lb.isInput = this.isInput;
      return lb;
    }

    public toString() : string
    {
      if (this.isInput)
      {
        return localizer.get("ParameterBlock.string", '↓\n{{varName}}', {varName:localizer.get("VariableNames." + this.name, this.name)});
      }
      return localizer.get("LetBlock.string", '→\u00a0{{varName}}', {varName:localizer.get("VariableNames." + this.name, this.name)});
    }

    public serialize() : string
    {
      return "->$" + this.name;
    }
    static deserialize(serial : string) : LetBlock
    {
      var name = serial.substr(3);
      return new LetBlock(name);
    }
  }

  LetBlock.prototype.serializationPattern = /->\$[^\s\{\}()\[\]\"]+/;

  export class RecallBlock extends Block
  {
    public name : string;

    constructor(name : string) {
      super();
      this.types.push('RecallBlock');

      if (name === undefined)
      {
        this.name = 'x';
      }
      else
      {
        this.name = name;
      }
    }

    public Evaluate(currentState : ProgramState) : void
    {
      var value = currentState.recallByName(this.name);

      if (value != null)
      {
        currentState.push(value);
      }
      else
      {
        var errorMessage = localizer.get("Errors.unassignedVariable", "Variable {{varName}} must be assigned before it is used.", {varName: this.toString()});
        currentState.push (new ErrorBlock (errorMessage));
      }
    }

    public Eq(b : Block) : boolean
    {
      return this.sameType(b) && (b as RecallBlock).name == this.name;
    }

    public CloneBlock() : Block
    {
      var rb = new RecallBlock(this.name);
      return rb;
    }

    public toString() : string
    {
      return localizer.get("VariableNames." + this.name, this.name);
    }

    public serialize() : string
    {
      return '$' + this.name;
    }
    static deserialize(serial : string) : RecallBlock
    {
      var name = serial.substr(1);

      return new RecallBlock(name);
    }
  }

  RecallBlock.prototype.serializationPattern = /\$[^\s\{\}()\[\]\"]+/;

  ///////////////////////// First-Class Function Blocks /////////////////////////

  export abstract class QuaternaryControlOperator extends Block
  {
    public T : string;
    public U : string;
    public V : string;
    public W : string;

    constructor(T : string, U : string, V : string, W : string)
    {
      super();
      this.types.push('QuaternaryControlOperator');

      this.T = T;
      this.U = U;
      this.V = V;
      this.W = W;
    }

  	public abstract performOperation(a : Block, b : Block, c : Block, d : Block, currentState : ProgramState) : void;

  	public Evaluate(currentState : ProgramState) : void
  	{
  		var a : Block;
  		var b : Block;
  		var c : Block;
      var d : Block;

      d = currentState.peekT(this.W);
      currentState.pop (this);
  		c = currentState.peekT(this.V);
  		currentState.pop (this);
  		b = currentState.peekT(this.U);
  		currentState.pop (this);
  		a = currentState.peekT(this.T);
  		currentState.pop (this);

  		if (a != null && b != null && c != null && d != null) {
  			this.performOperation (a, b, c, d, currentState);
  		}
  		else {
        var errorMessage;
  			if (this.T == this.U && this.U == this.V && this.V == this.W)
  			{
  				errorMessage = localizer.get("Errors.QuaternaryOperator_TTTT", "{{operatorName}} requires four {{operandType}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get(this.T + ".name", this.T)});
  			}
        else if (this.T == this.U && this.T == this.V)
        {
          errorMessage = localizer.get("Errors.QuaternaryOperator_TTTW", "{{operatorName}} requires three {{operandType1}}s and a {{operandtype2}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.W + ".name", this.W)});
        }
  			else if (this.T == this.U)
  			{
          if (this.V == this.W)
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TTVV", "{{operatorName}} requires two {{operandType1}}s and two {{operandType2}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.V + ".name", this.V)});
          }
          else
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TTVW", "{{operatorName}} requires two {{operandType1}}s, a {{operandType2}}, and a {{operandType3}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.V + ".name", this.V), operandType3:localizer.get(this.W + ".name", this.W)});
          }
  			}
  			else
        {
          if (this.U == this.V && this.U == this.W)
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TUUU", "{{operatorName}} requires a {{operandType1}} and three {{operandType2}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U)});
          }
          else if (this.U == this.V)
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TUUW", "{{operatorName}} requires a {{operandType1}}, two {{operandType2}}s, and a {{operandType3}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U), operandType3:localizer.get(this.W + ".name", this.W)});
          }
          else
          {
            errorMessage = localizer.get("Errors.QuaternaryOperator_TUVW", "{{operatorName}} requires a {{operandType1}}, a {{operandType2}}, a {{operandType3}}, and a {{operandType4}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U), operandType3:localizer.get(this.V + ".name", this.V), operandType4:localizer.get(this.W + ".name", this.W)});
          }
        }
  			currentState.push (new ErrorBlock (errorMessage));
  		}
  	}
  }

  export abstract class TrinaryControlOperator extends Block
  {
    public T : string;
    public U : string;
    public V : string;

    constructor(T : string, U : string, V : string)
    {
      super();
      this.types.push('TrinaryControlOperator');

      this.T = T;
      this.U = U;
      this.V = V;
    }

  	public abstract performOperation(a : Block, b : Block, c : Block, currentState : ProgramState) : void;

  	public Evaluate(currentState : ProgramState) : void
  	{
  		var a : Block;
  		var b : Block;
  		var c : Block;

  		c = currentState.peekT(this.V);
  		currentState.pop (this);
  		b = currentState.peekT(this.U);
  		currentState.pop (this);
  		a = currentState.peekT(this.T);
  		currentState.pop (this);

  		if (a != null && b != null && c != null) {
  			this.performOperation (a, b, c, currentState);
  		}
  		else {
        var errorMessage;
        if (this.T === this.U && this.U === this.V)
        {
          errorMessage = localizer.get("Errors.TrinaryOperator_A", "{{operatorName}} requires three {{operandType}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get(this.T + ".name", this.T)});
        }
        else if (this.T === this.U)
        {
          errorMessage = localizer.get("Errors.TrinaryOperator_B", "{{operatorName}} requires two {{operandType1}}s and a {{operandType2}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.V + ".name", this.V)});
        }
        else if (this.U === this.V)
        {
          errorMessage = localizer.get("Errors.TrinaryOperator_C", "{{operatorName}} requires a {{operandType1}} and two {{operandType2}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U)});
        }
        else
        {
          errorMessage = localizer.get("Errors.TrinaryOperator_D", "{{operatorName}} requires a {{operandType1}}, a {{operandType2}}, and a {{operandType3}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U), operandType3:localizer.get(this.V + ".name", this.V)});
        }

        currentState.push(new ErrorBlock(errorMessage));
  		}
  	}
  }

  export abstract class BinaryControlOperator extends Block
  {
    public T : string;
    public U : string;

    constructor(T : string, U: string) {
      super();
      this.types.push('BinaryControlOperator');

      this.T = T;
      this.U = U;
    }

    public abstract performOperation(a : Block, b : Block, currentState : ProgramState) : void;

    public Evaluate(currentState : ProgramState) : void
    {
      var a;
      var b;

      b = currentState.peekT(this.U);
      currentState.pop (this);
      a = currentState.peekT(this.T);
      currentState.pop (this);

      if (a != null && b != null) {
        this.performOperation (a, b, currentState);
      }
      else {
        var errorMessage;
        if (this.T === this.U)
        {
          errorMessage = localizer.get("Errors.BinaryOperator_A", "{{operatorName}} requires two {{operandType}}s as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get(this.T + ".name", this.T)});
        }
        else
        {
          errorMessage = localizer.get("Errors.BinaryOperator_B", "{{operatorName}} requires a {{operandType1}} and a {{operandType2}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType1:localizer.get(this.T + ".name", this.T), operandType2:localizer.get(this.U + ".name", this.U)});
        }

        currentState.push(new ErrorBlock(errorMessage));
      }
    }
  }

  export abstract class UnaryControlOperator extends Block
  {
    public T : string;

    constructor(T : string) {
      super();
      this.types.push('UnaryControlOperator');

      this.T = T;
    }

  	public abstract performOperation(a : Block, currentState : ProgramState) : void;

  	public Evaluate(currentState : ProgramState) : void
  	{
  		var a;

  		a = currentState.peekT(this.T);
  		currentState.pop (this);

  		if (a != null) {
  			this.performOperation (a, currentState);
  		}
  		else {
        var errorMessage = localizer.get("Errors.UnaryOperator", "{{operatorName}} requires a {{operandType}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get(this.T + ".name", this.T)});

        currentState.push(new ErrorBlock(errorMessage));
  		}
  	}
  }

  export class ExecBlock extends UnaryControlOperator
  {
    constructor() {
      super('DataBlock');
      this.types.push('ExecBlock');
    }

  	public performOperation(a : DataBlock, currentState : ProgramState) : void
  	{
      a.findStackInWorkspace(currentState.vm.workspace);
  		currentState.insertInProgram (a.getStack());
  	}

  	public CloneBlock() : Block
  	{
  		return new ExecBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("ExecBlock.string", "exec");
  	}
    static deserialize(_serial : string) : ExecBlock
    {
      return new ExecBlock();
    }
  }

  ExecBlock.prototype.serializationPattern = /exec/;

  export class BranchBlock extends TrinaryControlOperator
  {
    constructor() {
      super('BooleanBlock', 'DataBlock', 'DataBlock');
      this.types.push('BranchBlock');
    }

    public performOperation(a : BooleanBlock, b : DataBlock, c : DataBlock, currentState : ProgramState)
    {
      if (a.value == true)
  		{
        b.findStackInWorkspace(currentState.vm.workspace);
  			currentState.insertInProgram (b.getStack());
  		}
  		else
  		{
        c.findStackInWorkspace(currentState.vm.workspace);
  			currentState.insertInProgram (c.getStack());
  		}
  	}

  	public CloneBlock() : Block
  	{
  		return new BranchBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("BranchBlock.string", "if");
  	}

    static deserialize(_serial : string) : BranchBlock
    {
      return new BranchBlock();
    }
  }

  BranchBlock.prototype.serializationPattern = /if/;

  export class MapBlock extends BinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'DataBlock');
      this.types.push('MapBlock');
    }

  	public performOperation(array : DataBlock, f : DataBlock, currentState : ProgramState)
  	{
  		var append = new Stack ("append");
  		append.list.push(new AppendOperator());
  		var map = new Stack ("map");
  		map.list.push (new NullBlock ());
  		map.list.push (array);
  		map.list.push (f);
  		map.list.push (new DataBlock(append, null));
  		map.list.push (new ReadBlock());
  		map.list.push (new AppendOperator());
  		map.list.push (new FoldBlock());
  		currentState.insertInProgram (map);
  	}

  	public CloneBlock() : Block
  	{
  		return new MapBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("MapBlock.string", "map");
  	}

    static deserialize(_serial : string) : MapBlock
    {
      return new MapBlock();
    }
  }

  MapBlock.prototype.serializationPattern = /map/;

  export class FoldBlock extends BinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'DataBlock');
      this.types.push('FoldBlock');
    }

  	public performOperation(array : DataBlock, f : DataBlock, currentState : ProgramState)
  	{
      array.findStackInWorkspace(currentState.vm.workspace);
  		var i = new NumberBlock (1);
  		if (i.decimalValue > array.count())
  		{
  			// do nothing
  		}
  		else
  		{
  			var fold = new Stack ("fold");
  			fold.list.push (array._stack.list[0].CloneBlock());
  			fold.list.push (new CodeBlock (f._stack, null, null));
  			fold.list.push (array);
  			fold.list.push (f);
  			fold.list.push (new NumberBlock (i.decimalValue + 1));
  			fold.list.push (new FoldHelperBlock ());
  			currentState.insertInProgram (fold);
  		}
  	}

  	public CloneBlock() : Block
  	{
  		return new FoldBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("FoldBlock.string", "fold");
  	}

    static deserialize(_serial : string) : FoldBlock
    {
      return new FoldBlock();
    }
  }

  FoldBlock.prototype.serializationPattern = /fold/;

  export class FoldHelperBlock extends TrinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'DataBlock', 'NumberBlock');
      this.types.push('FoldHelperBlock');
    }

    public performOperation(array : DataBlock, f : DataBlock, i : NumberBlock, currentState : ProgramState)
  	{
      array.findStackInWorkspace(currentState.vm.workspace);
  		if (i.decimalValue > array.count())
  		{
  			// do nothing
  		}
  		else
  		{
  			var fold = new Stack ("fold`");
  			fold.list.push (array._stack.list[Math.floor(i.decimalValue) - 1].CloneBlock());
  			fold.list.push (new CodeBlock (f._stack, null, null));
  			fold.list.push (array);
  			fold.list.push (f);
  			fold.list.push (new NumberBlock (i.decimalValue + 1));
  			fold.list.push (new FoldHelperBlock ());
  			currentState.insertInProgram (fold);
  		}
  	}

  	public CloneBlock() : Block
  	{
  		return new FoldHelperBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("FoldHelperBlock.string", "fold`");
  	}

    static deserialize(_serial : string) : FoldHelperBlock
    {
      return new FoldHelperBlock();
    }
  }

  FoldHelperBlock.prototype.serializationPattern = /fold`/;

  export class MaybeBlock extends TrinaryControlOperator
  {
    constructor() {
      super('Block', 'DataBlock', 'DataBlock');
      this.types.push('MaybeBlock');
    }

    public performOperation(value : Block, condition : DataBlock, operation : DataBlock, currentState : ProgramState)
  	{
      operation.findStackInWorkspace(currentState.vm.workspace);
      condition.findStackInWorkspace(currentState.vm.workspace);
  		var doOp = new Stack ("do-op");
  		doOp.list.push (value.CloneBlock ());
  		doOp.list.push (new CodeBlock (operation._stack, null, null));

  		var maybe = new Stack ("maybe");
  		maybe.list.push (value.CloneBlock ());
  		maybe.list.push (new CodeBlock (condition._stack, null, null));
  		maybe.list.push (new DataBlock (doOp, null));
  		maybe.list.push (new NullBlock ());
  		maybe.list.push (new BranchBlock ());

  		currentState.insertInProgram (maybe);
  	}

  	public CloneBlock() : Block
  	{
  		return new MaybeBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("MaybeBlock.string", "maybe");
  	}
    static deserialize(_serial : string) : MaybeBlock
    {
      return new MaybeBlock();
    }
  }

  MaybeBlock.prototype.serializationPattern = /maybe/;

  export class FilterBlock extends BinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'DataBlock');
      this.types.push('FilterBlock');
    }

    public performOperation(array : DataBlock, f : DataBlock, currentState : ProgramState)
  	{
      array.findStackInWorkspace(currentState.vm.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);
      if (array.count() == 0)
      {
        currentState.push(array);
      }
      else
      {
        var filter = new Stack("filter");
        filter.list.push(array._stack.list[0].CloneBlock());
        filter.list.push(new CodeBlock(f._stack, null, null));
        filter.list.push(array);
        filter.list.push(f);
        filter.list.push(new NumberBlock(2));
        filter.list.push(new FilterHelperBlock());
        currentState.insertInProgram(filter);
      }
  	}

    public CloneBlock() : Block
  	{
  		return new FilterBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("FilterBlock.string", "filter");
  	}
    static deserialize(_serial : string) : FilterBlock
    {
      return new FilterBlock();
    }
  }

  FilterBlock.prototype.serializationPattern = /filter/;

  export class FilterHelperBlock extends QuaternaryControlOperator
  {
    constructor() {
      super('BooleanBlock', 'DataBlock', 'DataBlock', 'NumberBlock');
      this.types.push('FilterHelperBlock');
    }

    public performOperation(lastFilterResult : BooleanBlock, array : DataBlock, f : DataBlock, i : NumberBlock, currentState : ProgramState)
  	{
      array.findStackInWorkspace(currentState.vm.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);
      if (lastFilterResult.value == false)
      {
        var name = getNextDataBlockVersion(array, currentState.vm);

        var newArray = new Stack(name);

        array.findStackInWorkspace(currentState.vm.workspace);
        newArray.list = array.getStack().list; // clone of original
        newArray.list.splice(i.decimalValue - 2, 1);

        i = new NumberBlock(i.decimalValue - 1);

        array = new DataBlock(newArray, array.workspace);
      }

      if (i.decimalValue > array.count())
      {
        currentState.push(array);
      }
      else
      {
        var filter = new Stack("filter`");
        filter.list.push(array._stack.list[Math.floor(i.decimalValue) - 1].CloneBlock());
        filter.list.push(new CodeBlock(f._stack, null, null));
        filter.list.push(array);
        filter.list.push(f);
        filter.list.push(new NumberBlock(i.decimalValue + 1));
        filter.list.push(new FilterHelperBlock);
        currentState.insertInProgram(filter);
      }
  	}

  	public CloneBlock() : Block
  	{
  		return new FilterHelperBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("FilterHelperBlock.string", "filter`");
  	}

    static deserialize(_serial : string) : FilterHelperBlock
    {
      return new FilterHelperBlock();
    }
  }

  FoldHelperBlock.prototype.serializationPattern = /filter`/;

  export class ComposeBlock extends BinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock');
      this.types.push('ComposeBlock');
    }

    public performOperation(a : DataBlock, b : NumberBlock, currentState : ProgramState)
  	{
      a.findStackInWorkspace(currentState.vm.workspace);
  		if (b.decimalValue > 0) {
  			var f = new Stack ("repeat");
  			f.list.push (new CodeBlock (a._stack, null, null));
  			f.list.push (a);
  			f.list.push (new NumberBlock (b.decimalValue - 1));
  			f.list.push (new ComposeBlock ());

  			currentState.insertInProgram (f);
  		}
  	}

    public CloneBlock() : Block
  	{
  		return new ComposeBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("ComposeBlock.string", "repeat");
  	}

  	public serialize () : string
  	{
  		return "comp";
  	}

    static deserialize(_serial : string) : ComposeBlock
    {
      return new ComposeBlock();
    }
  }

  ComposeBlock.prototype.serializationPattern = /compose|comp|repeat/;

  export class IterateBlock extends TrinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock', 'NumberBlock');
      this.types.push('IterateBlock');
    }

    public performOperation(f : DataBlock, i : NumberBlock, n : NumberBlock, currentState : ProgramState)
  	{
      f.findStackInWorkspace(currentState.vm.workspace);
  		if (i.decimalValue <= n.decimalValue)
  		{
  			var iter = new Stack ("iter");
  			iter.list.push (i);
  			iter.list.push (new CodeBlock (f._stack, null, null));
  			iter.list.push (f);
  			iter.list.push (new NumberBlock (i.decimalValue + 1));
  			iter.list.push (n);
  			iter.list.push (new IterateBlock ());

  			currentState.insertInProgram (iter);
  		}
  	}

  	public CloneBlock() : Block
  	{
  		return new IterateBlock ();
  	}

  	public toString() : string
  	{
  		return localizer.get("IterateBlock.string", "iter");
  	}

  	public serialize () : string
  	{
  		return "iter";
  	}

    static deserialize(_serial : string) : IterateBlock
    {
      return new IterateBlock();
    }
  }

  IterateBlock.prototype.serializationPattern = /iterate|iter/;

  ///////////////////////////////// stack blocks /////////////////////////////////

  export class DataBlock extends IdentityBlock
  {
    public _stack : Stack;
    public workspace : Workspace;
    public baseEvaluate = IdentityBlock.prototype.Evaluate;
    public foundStack = false;

    constructor(stack : Stack, workspace : Workspace, name? : string)
    {
      super();
      this.types.push('DataBlock');

      if (stack != null)
      {
        this._stack = stack;
        this.foundStack = true;
      }
      else if (name)
      {
        this._stack = new Stack(name);
        this.foundStack = false;
      }
      else
      {
        this._stack = new Stack("a1");
        this.foundStack = false;
      }

      this.workspace = workspace;
    }

    public getStack () : Stack
    {
      return this._stack.Clone();
    }

    public count = function() : number
    {
      return this._stack.list.length;
    }

    public Evaluate(currentState : ProgramState) : void
    {
      this.findStackInWorkspace(currentState.vm.workspace);
      this.baseEvaluate(currentState);
    }

    public findStackInWorkspace (workspace : Workspace) : void
    {
      if (workspace != null && !this.foundStack)
      {
        var that = this;
        var stack = workspace.stacks.find(function(stack) { return stack.name === that._stack.name });
        if (stack !== undefined)
        {
          this._stack = stack;
          this.foundStack = true;
        }
      }
    }

    public Eq(b : Block) : boolean
    {
      if (!(b.isType('DataBlock')))
      {
        return false;
      }

      this.findStackInWorkspace(this.workspace);
      (b as DataBlock).findStackInWorkspace((b as DataBlock).workspace);

      return Stack.cyclicEq(this._stack, (b as DataBlock)._stack, [], []);
    }

    public CloneBlock() : DataBlock
    {
      var db = new DataBlock(this._stack, this.workspace);
      db.foundStack = this.foundStack;
      return db;
    }

    public toString() : string
    {
      return '@' + (this._stack.displayName? this._stack.displayName : this._stack.name.replace(/_/g, ' '));
    }

    public toStringVerbose = function(visitedDataBlocks? : DataBlock[]) : string
    {
      if (visitedDataBlocks === undefined)
      {
        visitedDataBlocks = [this];
      }

      var result = this.toString() + ' [ ';
      this._stack.list.forEach(function(block : Block) {
        if (block.isType('DataBlock') && !block.isType('NullBlock'))
        {
          if (visitedDataBlocks.find(db => db == block))
          {
            result += block.toString() + ' ';
          }
          else
          {
            visitedDataBlocks.push(block as DataBlock);
            result += (block as DataBlock).toStringVerbose(visitedDataBlocks) + ' ';
          }
        }
        else
        {
          result += block.toString() + ' ';
        }
      });
      result += ']';
      return result;
    }

    public serialize() : string
    {
      return '@' + WhitespaceEscaper.escape(this._stack.name);
    }

    static deserialize(serial : string) : DataBlock
    {
      var name = WhitespaceEscaper.escape(serial.substr(1));

      var sb = new DataBlock(null, null);
      sb._stack.name = name;

      return sb;
    }
  }

  DataBlock.prototype.serializationPattern = /@[^\s\{\}()\[\]\"]+/;

  export class NullBlock extends DataBlock
  {
    constructor()
    {
      var stack = new Stack("null");
      super(stack, null);
      this.types.push('NullBlock');
    }

    public findStackInWorkspace (_workspace : Workspace) {
      // do nothing -- null blocks don't need it
    }

    public toString()
    {
      return localizer.get('NullBlock.string', "@null");
    }

    public CloneBlock() : NullBlock
    {
      return new NullBlock();
    }
    static deserialize (_serial : string) : NullBlock
    {
      return new NullBlock();
    }
  }

  NullBlock.prototype.serializationPattern = /@null/;

  export class PackageBlock extends DataBlock
  {
    constructor(blockToPackage : Block)
    {
      var stack = new Stack(blockToPackage.toString());
      stack.list.push(blockToPackage);
      super(stack, null);
      this.types.push('PackageBlock');
    }

    public findStackInWorkspace (_workspace : Workspace) {
      // do nothing -- package blocks don't need it
    }

    public CloneBlock() : PackageBlock
    {
      return new PackageBlock(this._stack.list[0].CloneBlock());
    }

    public serialize() : string
    {
      return "[" + this._stack.list[0].serialize() + "]";
    }

    public toString() : string
    {
      return "[" + this._stack.list[0].toString() + "]";
    }

    static deserialize (serial : string) : PackageBlock
    {
      var blockSerialized = serial.substring(1, serial.length - 1);
      var block = CreateBlock(blockSerialized);

      return new PackageBlock(block);
    }
  }

  PackageBlock.prototype.serializationPattern = /\[[^\"\[\]]*?\]|\["(?:[^\\\"]|\\.)*"\]/

  export class CountOperator extends UnaryOperator
  {
    constructor()
    {
      super('DataBlock');
      this.types.push('CountOperator');
    }

    public performOperation(a : DataBlock) : Block
    {
      return new NumberBlock(a.count());
    }

    public CloneBlock() : Block
    {
      return new CountOperator();
    }

    public toString() : string
    {
      return localizer.get("CountOperator.string", 'count');
    }

    static deserialize(_serial : string) : CountOperator
    {
      return new CountOperator();
    }
  }

  CountOperator.prototype.serializationPattern = /count/;

  export class ReadBlock extends Block
  {
    constructor() {
      super();
      this.types.push('ReadBlock');
    }

    public Evaluate(currentState : ProgramState) : void
    {
      var a = currentState.peekT('DataBlock');
      currentState.pop(this);

      if (a != null)
      {
        (a as DataBlock).findStackInWorkspace(currentState.vm.workspace);
        var list = (a as DataBlock).getStack().list;

        for (var i = 0; i < list.length; i++)
        {
          currentState.push(list[i]);
        }
      }
      else
      {
        var errorMessage = localizer.get("Errors.UnaryOperator", "{{operatorName}} requires a {{operandType}} as input.", {operatorName:localizer.get(this.GetType()+".name", this.GetType()), operandType:localizer.get("DataBlock.name", "DataBlock")});
        currentState.push(new ErrorBlock(errorMessage));
      }
    }

    public CloneBlock() : Block
    {
      return new ReadBlock();
    }

    public toString() : string
    {
      return localizer.get("ReadBlock.string", 'read');
    }

    public serialize() : string
    {
      return 'read';
    }
    static deserialize(_serial : string) : ReadBlock
    {
      return new ReadBlock();
    }
  }

  ReadBlock.prototype.serializationPattern = /read/;

  export class ElemOperator extends BinaryOperatorOverloaded
  {
    constructor()
    {
      super(['DataBlock', 'DataBlock'], ['NumberBlock', 'StringBlock']);
      this.types.push('ElemOperator');
    }

    public performOperationWithTypes(a : DataBlock, b : NumberBlock | StringBlock, i : number, currentState : ProgramState) : Block
    {
      a.findStackInWorkspace(currentState.vm.workspace);
      a.findStackInWorkspace(a.workspace);

      if (i == 0)
      {
        var index = Math.floor((b as NumberBlock).decimalValue);

        if (index >= 1 && index <= a.count())
        {
          return a._stack.list[index - 1].CloneBlock();
        }
        else
        {
          var errorMessage = localizer.get("Errors.indexOutOfRange", "Index {{index}} out of range.", {index: index});
          return new ErrorBlock(errorMessage);
        }
      }
      else
      {
        var name = (b as StringBlock).value;

				for (var block of a._stack.list)
				{
					if (block instanceof DataBlock)
					{
            block.findStackInWorkspace(block.workspace);
            block.findStackInWorkspace(currentState.vm.workspace);
						if (block._stack != null && block._stack.name == name)
						{
							if (block.count() == 0)
							{
								return new ErrorBlock (localizer.get("Errors.propertyUndefined", "Property {{propertyName}} of {{stackName}} is undefined.", {propertyName: name, stackName : a._stack.name}));
							}
							else
							{
								return block._stack.list [0].CloneBlock ();
							}
						}
					}
				}

				return new ErrorBlock (localizer.get("Errors.propertyUndefined", "Property {{propertyName}} of {{stackName}} is undefined.", {propertyName: name, stackName : a._stack.name}));
      }
    }

    public CloneBlock() : Block
    {
      return new ElemOperator();
    }

    public toString() : string
    {
      return localizer.get("ElemOperator.string", 'elem');
    }
    static deserialize(_serial : string) : ElemOperator
    {
      return new ElemOperator();
    }
  }

  ElemOperator.prototype.serializationPattern = /elem/;

  export class InsertOperator extends TrinaryOperatorOverloaded
  {
    constructor()
    {
      super(['DataBlock', 'DataBlock'], ['Block', 'Block'], ['NumberBlock', 'StringBlock']);
      this.types.push('InsertOperator');
    }

    public performOperationWithTypes(a : DataBlock, b : Block, c : NumberBlock | StringBlock, i : number, currentState : ProgramState) : Block
    {
      a.findStackInWorkspace(currentState.vm.workspace);
      if (i == 0)
      {
        var index = Math.floor((c as NumberBlock).decimalValue);

        if (index >= 1 && index <= a.count() + 1)
        {
          var name = getNextDataBlockVersion(a, currentState.vm);

          var f = new Stack(name);

          f.list = a.getStack().list; // clone of original
          f.list.splice(index - 1, 0, b.CloneBlock());

          return new DataBlock(f, null);
        }
        else
        {
          var errorMessage = localizer.get("Errors.indexOutOfRange", "Index {{index}} out of range.", {index: index});
          return new ErrorBlock(errorMessage);
        }
      }
      else
      {
        var elemName = (c as StringBlock).value;
				var mf = new Stack (elemName);
				mf.list.push(b.CloneBlock ());

				var member = new DataBlock (mf, null);

        var name = getNextDataBlockVersion(a, currentState.vm);
				var f = new Stack (name);

				f.list = a.getStack().list;

				for (var i = 0; i < f.list.length; i++)
				{
					var block = f.list [i];
					if (block instanceof DataBlock)
					{
						if (block._stack != null && block._stack.name == elemName)
						{

							f.list [i] = member;

							return new DataBlock (f, null);
						}
					}
				}

				f.list.push (member);
				return new DataBlock(f, null);
      }
    }

    public CloneBlock() : Block
    {
      return new InsertOperator();
    }

    public toString() : string
    {
      return localizer.get("InsertOperator.string", 'insert');
    }
    static deserialize(_serial : string) : InsertOperator
    {
      return new InsertOperator();
    }
  }

  InsertOperator.prototype.serializationPattern = /insert/;

  export class AppendOperator extends BinaryOperator
  {
    constructor()
    {
      super('DataBlock', 'Block');
      this.types.push('AppendOperator');
    }

    public performOperation(a : DataBlock, b : Block, currentState : ProgramState) : Block
    {
      var name = getNextDataBlockVersion(a, currentState.vm);

      var f = new Stack(name);

      a.findStackInWorkspace(currentState.vm.workspace);
      f.list = a.getStack().list; // clone of original
      f.list.push(b.CloneBlock());

      return new DataBlock(f, null);

    }

    public CloneBlock() : Block
    {
      return new AppendOperator();
    }

    public toString() : string
    {
      return localizer.get("AppendOperator.string", 'append');
    }
    static deserialize(_serial : string) : AppendOperator
    {
      return new AppendOperator();
    }
  }

  AppendOperator.prototype.serializationPattern = /append/;

  export class ReplaceOperator extends TrinaryOperatorOverloaded
  {
    constructor()
    {
      super(['DataBlock', 'DataBlock'], ['Block', 'Block'], ['NumberBlock', 'StringBlock']);
      this.types.push('ReplaceOperator');
    }

    public performOperationWithTypes(a : DataBlock, b : Block, c : NumberBlock | StringBlock, i : number, currentState : ProgramState) : Block
    {
      a.findStackInWorkspace(currentState.vm.workspace);
      if (i == 0)
      {
        var index = Math.floor((c as NumberBlock).decimalValue);

        if (index >= 1 && index <= a.count() + 1)
        {
          var name = getNextDataBlockVersion(a, currentState.vm);

          var f = new Stack(name);

          f.list = a.getStack().list; // clone of original
          f.list.splice(index - 1, 1, b.CloneBlock());

          return new DataBlock(f, null);
        }
        else
        {
          var errorMessage = localizer.get("Errors.indexOutOfRange", "Index {{index}} out of range.", {index: index});
          return new ErrorBlock(errorMessage);
        }
      }
      else
      {
        var elemName = (c as StringBlock).value;
				var mf = new Stack (elemName);
				mf.list.push(b.CloneBlock ());

				var member = new DataBlock (mf, null);

        var name = getNextDataBlockVersion(a, currentState.vm);
				var f = new Stack (name);

				f.list = a.getStack().list;

				for (var i = 0; i < f.list.length; i++)
				{
					var block = f.list [i];
					if (block instanceof DataBlock)
					{
						if (block._stack != null && block._stack.name == elemName)
						{

							f.list [i] = member;

							return new DataBlock (f, null);
						}
					}
				}

				f.list.push (member);
				return new DataBlock(f, null);
      }
    }

    public CloneBlock() : Block
    {
      return new ReplaceOperator();
    }

    public toString() : string
    {
      return localizer.get("ReplaceOperator.string", 'replace');
    }
    static deserialize(_serial : string) : ReplaceOperator
    {
      return new ReplaceOperator();
    }
  }

  ReplaceOperator.prototype.serializationPattern = /replace/;

  export class DeleteOperator extends BinaryOperatorOverloaded
  {
    constructor()
    {
      super(['DataBlock', 'DataBlock'], ['NumberBlock', 'StringBlock']);
      this.types.push('DeleteOperator');
    }

    public performOperationWithTypes(a : DataBlock, b : NumberBlock | StringBlock, i : number, currentState : ProgramState) : Block
    {
      a.findStackInWorkspace(currentState.vm.workspace);
      if (i == 0)
      {
        var index = Math.floor((b as NumberBlock).decimalValue);

        if (index >= 1 && index <= a.count() + 1)
        {
          var name = getNextDataBlockVersion(a, currentState.vm);

          var f = new Stack(name);

          f.list = a.getStack().list; // clone of original
          f.list.splice(index - 1, 1);

          return new DataBlock(f, null);
        }
        else
        {
          var errorMessage = localizer.get("Errors.indexOutOfRange", "Index {{index}} out of range", {index: index});
          return new ErrorBlock(errorMessage);
        }
      }
      else
      {
        var elemName = (b as StringBlock).value;

        var name = getNextDataBlockVersion(a, currentState.vm);
				var f = new Stack (name);

				f.list = a.getStack().list;

				for (var i = 0; i < f.list.length; i++)
				{
					var block = f.list [i];
					if (block instanceof DataBlock)
					{
						if (block._stack != null && block._stack.name == elemName)
						{

							f.list.splice(i, 1);

							return new DataBlock (f, null);
						}
					}
				}

				return new ErrorBlock (localizer.get("Errors.propertyUndefined", "Property {{propertyName}} of {{stackName}} is undefined.", {propertyName: elemName, stackName : a.toString()}));
      }
    }

    public CloneBlock() : Block
    {
      return new DeleteOperator();
    }

    public toString() : string
    {
      return localizer.get("DeleteOperator.string", 'delete');
    }
    static deserialize(_serial : string) : DeleteOperator
    {
      return new DeleteOperator();
    }
  }

  DeleteOperator.prototype.serializationPattern = /delete/;

  export class WriteBlock extends Block
  {
    constructor() {
      super();
      this.types.push('WriteBlock');
    }

    public Evaluate(currentState : ProgramState) : void
    {
      var n = currentState.peekT('NumberBlock');
  		currentState.pop (this);

  		if (n != null) {
  			var count = Math.floor((n as NumberBlock).decimalValue);
  			var b = new Stack ("a" + ++currentState.vm.anonStackIndex);

  			for (var i = 0; i < count; i++)
  			{
  				var s = currentState.peek();
  				currentState.pop (this);

  				if (s != null)
  				{
  					//b.list.push (s);
  					b.list.splice(0, 0, s);
  				}
  				else
  				{
  					var errorMessage = localizer.get("Errors.writeBlockNotEnoughInputs", "{{writeBlock}} expected {{blocksAsInput}} but only found {{count}}.",
              {
                writeBlock: localizer.get(this.GetType()+".name", this.GetType()),
                blocksAsInput: localizer.get("Errors.blocksAsInput", "{{count}} blocks as input", {count:count}),
                count : i
              });
  					currentState.push (new ErrorBlock (errorMessage));
  					return;
  				}
  			}

  			currentState.push (new DataBlock (b, null));
  		}
  		else {
  			var errorMessage = localizer.get("Errors.writeBlockNoCount", "{{writeBlock}} expected a {{numberBlock}} to determine the number of blocks to write to the stack.",
          {
            writeBlock : localizer.get(this.GetType()+".name", this.GetType()),
            numberBlock: localizer.get("NumberBlock.name", "Number Block")
          });
  			currentState.push (new ErrorBlock (errorMessage));
  		}
    }

    public CloneBlock() : Block
    {
      return new WriteBlock();
    }

    public toString() : string
    {
      return localizer.get("WriteBlock.string", 'write');
    }
    static deserialize(_serial : string) : WriteBlock
    {
      return new WriteBlock();
    }
  }

  WriteBlock.prototype.serializationPattern = /write/;

  export class IntegralOperator extends TrinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock', 'NumberBlock');
      this.types.push('IntegralOperator');
    }

    public performOperation(f : DataBlock, a : NumberBlock, b : NumberBlock, currentState : ProgramState)
  	{
      if (a.Eq(b))
      {
        currentState.push(new NumberBlock(0));
        return;
      }

      f.findStackInWorkspace(f.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);

      // approximate integration using 4th-order runge-kutta
      var integralVM = new VirtualMachine();
      integralVM.loadState(currentState.vm.state);
      integralVM.workspace = currentState.vm.workspace;
      var stepCount = 64;
      var interval = b.rValue.minus(a.rValue).value;
      while (stepCount < interval * 4 && stepCount < 4096)
      {
        stepCount *= 2;
      }
      var h = interval / stepCount;
      var t = a.decimalValue;
      var total = 0;

      // k1 = h * f(t_n)
      integralVM.reset();
      integralVM.mainProgram.push(new NumberBlock(t));
      integralVM.mainProgram.copyVariableAssignments(currentState, true);
      integralVM.mainProgram.insertInProgram(f._stack);
      integralVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
      var result = integralVM.EvaluateFully(false);

      // currentState.copyVariableAssignments(integralVM.mainProgram, false);

      if (result.length != 1 || !(result[0] instanceof NumberBlock))
      {
        currentState.push(new ErrorBlock(localizer.get("Errors.integrateOneToOne","The function you want to integrate must take one number as input and produce one number as output.")));
        return;
      }

      var k4 = h * (result[0] as NumberBlock).decimalValue;

      for (var i = 0; i < stepCount; i++)
      {
        t = a.decimalValue + i * h;

        // k1 = h * f(t_n) = k4 from the previous iteration
        var k1 = k4;

        // k2 = h * f(t_n + h/2)
        integralVM.reset();
        integralVM.mainProgram.push(new NumberBlock(t + h/2));
        integralVM.mainProgram.copyVariableAssignments(currentState, true);
        integralVM.mainProgram.insertInProgram(f._stack);
        integralVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
        result = integralVM.EvaluateFully(false);

        // currentState.copyVariableAssignments(integralVM.mainProgram, false);

        if (result.length != 1 || !(result[0] instanceof NumberBlock))
        {
          currentState.push(new ErrorBlock(localizer.get("Errors.integrateOneToOne","The function you want to integrate must take one number as input and produce one number as output.")));
          return;
        }

        var k2 = h * (result[0] as NumberBlock).decimalValue;

        // k3 = h * f(t_n + h/2) = k2; this value would differ from k2 if we
        // were trying to integrate a differential equation, but since we're
        // only integrating a single-variable function we don't care

        var k3 = k2;

        // k4 = h * f(t_n + h)
        integralVM.reset();
        integralVM.mainProgram.push(new NumberBlock(t + h));
        integralVM.mainProgram.copyVariableAssignments(currentState, true);
        integralVM.mainProgram.insertInProgram(f._stack);
        integralVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
        var result = integralVM.EvaluateFully(false);

        // currentState.copyVariableAssignments(integralVM.mainProgram, false);
        if (result.length != 1 || !(result[0] instanceof NumberBlock))
        {
          currentState.push(new ErrorBlock(localizer.get("Errors.integrateOneToOne","The function you want to integrate must take one number as input and produce one number as output.")));
          return;
        }

        k4 = h * (result[0] as NumberBlock).decimalValue;

        total += (k1 + 2 * k2 + 2 * k3 + k4) / 6;
      }

      currentState.push(new NumberBlock(total));
  	}

  	public CloneBlock() : Block
  	{
  		return new IntegralOperator ();
  	}

  	public toString() : string
  	{
  		return localizer.get("IntegralOperator.string", "∫");
  	}

  	public serialize () : string
  	{
  		return "integral";
  	}

    static deserialize(_serial : string) : IntegralOperator
    {
      return new IntegralOperator();
    }
  }

  IntegralOperator.prototype.serializationPattern = /∫|integral/;

  export class DerivativeOperator extends BinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock');
      this.types.push('DerivativeOperator');
    }

    public performOperation(f : DataBlock, x : NumberBlock, currentState : ProgramState)
    {
      f.findStackInWorkspace(f.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);

      var derivativeVM = new VirtualMachine();
      derivativeVM.loadState(currentState.vm.state);
      derivativeVM.workspace = currentState.vm.workspace;

      var h = Math.pow(2, -12);
      var t = x.decimalValue;

      derivativeVM.reset();
      derivativeVM.mainProgram.push(new NumberBlock(t - h));
      derivativeVM.mainProgram.copyVariableAssignments(currentState, true);
      derivativeVM.mainProgram.insertInProgram(f._stack);
      derivativeVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
      var result = derivativeVM.EvaluateFully(false);

      // currentState.copyVariableAssignments(derivativeVM.mainProgram, false);
      if (result.length != 1 || !(result[0] instanceof NumberBlock))
      {
        currentState.push(new ErrorBlock(localizer.get("Errors.derivativeOneToOne", "The function you want to differentiate must take one number as input and produce one number as output.")));
        return;
      }

      var f1 = (result[0] as NumberBlock).decimalValue;

      derivativeVM.reset();
      derivativeVM.mainProgram.push(new NumberBlock(t + h));
      derivativeVM.mainProgram.copyVariableAssignments(currentState, true);
      derivativeVM.mainProgram.insertInProgram(f._stack);
      derivativeVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
      var result = derivativeVM.EvaluateFully(false);

      // currentState.copyVariableAssignments(derivativeVM.mainProgram, false);
      if (result.length != 1 || !(result[0] instanceof NumberBlock))
      {
        currentState.push(new ErrorBlock(localizer.get("Errors.derivativeOneToOne", "The function you want to differentiate must take one number as input and produce one number as output.")));
        return;
      }

      var f2 = (result[0] as NumberBlock).decimalValue;
      currentState.push(new NumberBlock((f2 - f1) / (2 * h)));
    }

    public CloneBlock() : Block
    {
      return new DerivativeOperator ();
    }

    public toString() : string
    {
      return localizer.get("DerivativeOperator.string", "𝑑");
    }

    public serialize () : string
    {
      return "derivative";
    }

    static deserialize(_serial : string) : DerivativeOperator
    {
      return new DerivativeOperator();
    }
  }

  DerivativeOperator.prototype.serializationPattern = /𝑑|derivative/;

  export class SumOperator extends TrinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock', 'NumberBlock');
      this.types.push('SumOperator');
    }

    public performOperation(f : DataBlock, a : NumberBlock, b : NumberBlock, currentState : ProgramState)
  	{
      f.findStackInWorkspace(f.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);

      var summationVM = new VirtualMachine();
      summationVM.loadState(currentState.vm.state);
      summationVM.workspace = currentState.vm.workspace;

      if (!Number.isInteger(a.decimalValue) || !Number.isInteger(b.decimalValue))
      {
        currentState.push(new ErrorBlock(localizer.get("Errors.summationBounds", "The upper and lower bounds of the summation must be integers.")));
        return;
      }

      var increment = a.decimalValue > b.decimalValue? -1 : 1;
      var sum = new RationalNumber(0);

      var interval = Math.abs(a.decimalValue - b.decimalValue);

      for (var i = 0; i <= interval; i++)
      {
        summationVM.reset();
        summationVM.mainProgram.push(new NumberBlock(i * increment + a.decimalValue));
        summationVM.mainProgram.copyVariableAssignments(currentState, true);
        summationVM.mainProgram.insertInProgram(f._stack);
        summationVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
        var result = summationVM.EvaluateFully(false);

        // currentState.copyVariableAssignments(summationVM.mainProgram, false);
        if (result.length != 1 || !(result[0] instanceof NumberBlock))
        {
          currentState.push(new ErrorBlock(localizer.get("Errors.summationOneToOne", "The function you want to sum must take one number as input and produce one number as output.")));
          return;
        }

        sum = sum.plus((result[0] as NumberBlock).rValue);
      }

      currentState.push(new NumberBlock(sum));
  	}

  	public CloneBlock() : Block
  	{
  		return new SumOperator ();
  	}

  	public toString() : string
  	{
  		return localizer.get("SumOperator.string", "∑");
  	}

  	public serialize () : string
  	{
  		return "sum";
  	}

    static deserialize(_serial : string) : SumOperator
    {
      return new SumOperator();
    }
  }

  SumOperator.prototype.serializationPattern = /∑|sum/;

  export class ProductOperator extends TrinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock', 'NumberBlock');
      this.types.push('ProductOperator');
    }

    public performOperation(f : DataBlock, a : NumberBlock, b : NumberBlock, currentState : ProgramState)
  	{
      f.findStackInWorkspace(f.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);

      var productVM = new VirtualMachine();
      productVM.loadState(currentState.vm.state);
      productVM.workspace = currentState.vm.workspace;

      if (!Number.isInteger(a.decimalValue) || !Number.isInteger(b.decimalValue))
      {
        currentState.push(new ErrorBlock(localizer.get("Errors.productBounds", "The upper and lower bounds of the product must be integers.")));
        return;
      }

      var increment = a.decimalValue > b.decimalValue? -1 : 1;
      var product = new RationalNumber(1);

      var interval = Math.abs(a.decimalValue - b.decimalValue);

      for (var i = 0; i <= interval; i++)
      {
        productVM.reset();
        productVM.mainProgram.push(new NumberBlock(i * increment + a.decimalValue));
        productVM.mainProgram.copyVariableAssignments(currentState, true);
        productVM.mainProgram.insertInProgram(f._stack);
        productVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
        var result = productVM.EvaluateFully(false);

        // currentState.copyVariableAssignments(productVM.mainProgram, false);
        if (result.length != 1 || !(result[0] instanceof NumberBlock))
        {
          currentState.push(new ErrorBlock(localizer.get("Errors.productOneToOne", "The function you want to multiply must take one number as input and produce one number as output.")));
          return;
        }

        product = product.times((result[0] as NumberBlock).rValue);
      }

      currentState.push(new NumberBlock(product));
  	}

  	public CloneBlock() : Block
  	{
  		return new ProductOperator ();
  	}

  	public toString() : string
  	{
  		return localizer.get("ProductOperator.string", "∏");
  	}

  	public serialize () : string
  	{
  		return "product";
  	}

    static deserialize(_serial : string) : ProductOperator
    {
      return new ProductOperator();
    }
  }

  ProductOperator.prototype.serializationPattern = /∏|product/;

  // approximate the nth derivative of f(x) at x=a
  export function derivative(f : DataBlock, a: number, n : number, side : 1 | 0 | -1, workspace : Workspace) : NumberBlock | ErrorBlock
  {
    f.findStackInWorkspace(workspace);
    const h = Math.pow(2, -16 + n);
    var fprime0 : NumberBlock | ErrorBlock;
    var fprime1 : NumberBlock | ErrorBlock;
    var interval : number;
    var x0 : number;
    var x1 : number;
    if (side == 0)
    {
      x0 = a - h;
      x1 = a + h;
      interval = 2 * h;
    }
    else if (side == 1)
    {
      x0 = a;
      x1 = a + h;
      interval = h;
    }
    else
    {
      x0 = a - h;
      x1 = a;
      interval = h;
    }

    if (n > 1)
    {
      fprime0 = derivative(f, x0, n - 1, side, workspace);
      fprime1 = derivative(f, x1, n - 1, side, workspace);
      if (fprime0 instanceof ErrorBlock)
      {
        return fprime0;
      }
      else if (fprime1 instanceof ErrorBlock)
      {
        return fprime1;
      }
    }
    else if (n == 0)
    {
      var evalVM = new VirtualMachine();
      evalVM.loadState(VirtualMachine.runtime.state);
      evalVM.workspace = workspace;
      evalVM.reset();
      evalVM.mainProgram.push(new NumberBlock(a));
      evalVM.mainProgram.insertInProgram(f._stack);
      var result = evalVM.EvaluateFully(false);
      if (result.length != 1 || !(result[0] instanceof NumberBlock))
      {
        return new ErrorBlock(localizer.get("Errors.derivativeOneToOne", "The function you want to differentiate must take one number as input and produce one number as output."));
      }

      return result[0] as NumberBlock;
    }
    else
    {
      var derivativeVM = new VirtualMachine();
      derivativeVM.loadState(VirtualMachine.runtime.state);
      derivativeVM.workspace = workspace;

      derivativeVM.reset();
      derivativeVM.mainProgram.push(new NumberBlock(x0));
      derivativeVM.mainProgram.insertInProgram(f._stack);
      var result = derivativeVM.EvaluateFully(false);
      if (result.length != 1 || !(result[0] instanceof NumberBlock))
      {
        return new ErrorBlock(localizer.get("Errors.derivativeOneToOne", "The function you want to differentiate must take one number as input and produce one number as output."));
      }

      fprime0 = (result[0] as NumberBlock);

      derivativeVM.reset();
      derivativeVM.mainProgram.push(new NumberBlock(x1));
      derivativeVM.mainProgram.insertInProgram(f._stack);
      var result = derivativeVM.EvaluateFully(false);
      if (result.length != 1 || !(result[0] instanceof NumberBlock))
      {
        return new ErrorBlock(localizer.get("Errors.derivativeOneToOne", "The function you want to differentiate must take one number as input and produce one number as output."));
      }

      fprime1 = (result[0] as NumberBlock);
    }

    var fprime = (fprime1.decimalValue - fprime0.decimalValue) / interval;
    return new NumberBlock(fprime);
  }

  export class PositiveLimitOperator extends BinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock');
      this.types.push('PositiveLimitOperator');
    }

    public performOperation(f : DataBlock, x : NumberBlock, currentState : ProgramState)
    {
      f.findStackInWorkspace(f.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);

      var limitVM = new VirtualMachine();
      limitVM.loadState(currentState.vm.state);
      limitVM.workspace = currentState.vm.workspace;

      // first evaluate the function at the limit; if it is defined and finite, just use that.
      limitVM.reset();
      limitVM.mainProgram.push(new NumberBlock(x.rValue));
      limitVM.mainProgram.copyVariableAssignments(currentState, true);
      limitVM.mainProgram.insertInProgram(f._stack);
      limitVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
      var result = limitVM.EvaluateFully(false);

      // currentState.copyVariableAssignments(limitVM.mainProgram, false);
      if (result.length != 1 || !(result[0] instanceof NumberBlock))
      {
        currentState.push(new ErrorBlock(localizer.get("Errors.limitOneToOne", "The function for which you want to find the limit must take one number as input and produce one number as output.")));
        return;
      }

      var f_x = (result[0] as NumberBlock).decimalValue;

      if (Number.isFinite(f_x) && Math.abs(f_x) < 1e12)
      {
        currentState.push(new NumberBlock(f_x));
        return;
      }

      var taylorExpansion = 0;
      var taylorTerms : number[] = [];
      var a = x.decimalValue + Math.pow(2, -6);
      var i_fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600];

      for (var i = 0; i <= 8; i++)
      {
        var taylor_i = derivative(f, a, i, 1, currentState.vm.workspace);
        if (taylor_i instanceof ErrorBlock || !Number.isFinite(taylor_i.decimalValue))
        {
          currentState.push(taylor_i);
          return;
        }
        else
        {
          taylorTerms[i] = taylor_i.decimalValue / i_fact[i] * Math.pow(-1, i);
          // console.log("term " + i + ": " + taylorTerms[i]);
          taylorExpansion += taylorTerms[i] * Math.pow(Math.abs(x.decimalValue - a), i);
        }
      }

      var areTermsDiverging = true;
      var areTermsAllPositive = true;
      var areTermsAllNegative = true;
      for (var i = 2; i < 8; i++)
      {
        if (Math.abs(taylorTerms[i]) <= Math.abs(taylorTerms[i-1]))
        {
          areTermsDiverging = false;
        }
        if (taylorTerms[i] <= 0)
        {
          areTermsAllPositive = false;
        }
        if (taylorTerms[i] >= 0)
        {
          areTermsAllNegative = false;
        }
      }

      if (areTermsDiverging)
      {
        if (areTermsAllPositive)
        {
          currentState.push(new NumberBlock(Number.POSITIVE_INFINITY));
        }
        else if (areTermsAllNegative)
        {
          currentState.push(new NumberBlock(Number.NEGATIVE_INFINITY));
        }
        else
        {
          currentState.push(new NumberBlock(Number.NaN));
        }
      }
      else
      {
        currentState.push(new NumberBlock(taylorExpansion));
      }
    }

    public CloneBlock() : Block
    {
      return new PositiveLimitOperator ();
    }

    public toString() : string
    {
      return localizer.get("PositiveLimitOperator.string", "lim+");
    }

    public serialize () : string
    {
      return "lim+";
    }

    static deserialize(_serial : string) : PositiveLimitOperator
    {
      return new PositiveLimitOperator();
    }
  }

  PositiveLimitOperator.prototype.serializationPattern = /lim\+/;

  export class NegativeLimitOperator extends BinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock');
      this.types.push('NegativeLimitOperator');
    }

    public performOperation(f : DataBlock, x : NumberBlock, currentState : ProgramState)
    {
      f.findStackInWorkspace(f.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);

      var limitVM = new VirtualMachine();
      limitVM.loadState(currentState.vm.state);
      limitVM.workspace = currentState.vm.workspace;

      // first evaluate the function at the limit; if it is defined and finite, just use that.
      limitVM.reset();
      limitVM.mainProgram.push(new NumberBlock(x.decimalValue));
      limitVM.mainProgram.copyVariableAssignments(currentState, true);
      limitVM.mainProgram.insertInProgram(f._stack);
      limitVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
      var result = limitVM.EvaluateFully(false);

      // currentState.copyVariableAssignments(limitVM.mainProgram, false);
      if (result.length != 1 || !(result[0] instanceof NumberBlock))
      {
        currentState.push(new ErrorBlock(localizer.get("Errors.limitOneToOne", "The function for which you want to find the limit must take one number as input and produce one number as output.")));
        return;
      }

      var f_x = (result[0] as NumberBlock).decimalValue;

      if (Number.isFinite(f_x) && Math.abs(f_x) < 1e12)
      {
        currentState.push(new NumberBlock(f_x));
        return;
      }

      var taylorExpansion = 0;
      var taylorTerms : number[] = [];
      var a = x.decimalValue - Math.pow(2, -6);
      var i_fact = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600];

      for (var i = 0; i <= 8; i++)
      {
        var taylor_i = derivative(f, a, i, -1, currentState.vm.workspace);
        if (taylor_i instanceof ErrorBlock || !Number.isFinite(taylor_i.decimalValue))
        {
          currentState.push(taylor_i);
          return;
        }
        else
        {
          taylorTerms[i] = taylor_i.decimalValue / i_fact[i];
          taylorExpansion += taylorTerms[i] * Math.pow(x.decimalValue - a, i);
        }
      }

      var areTermsDiverging = true;
      var areTermsAllPositive = true;
      var areTermsAllNegative = true;
      for (var i = 2; i < 8; i++)
      {
        if (Math.abs(taylorTerms[i]) <= Math.abs(taylorTerms[i-1]))
        {
          areTermsDiverging = false;
        }
        if (taylorTerms[i] <= 0)
        {
          areTermsAllPositive = false;
        }
        if (taylorTerms[i] >= 0)
        {
          areTermsAllNegative = false;
        }
      }

      if (areTermsDiverging)
      {
        if (areTermsAllPositive)
        {
          currentState.push(new NumberBlock(Number.POSITIVE_INFINITY));
        }
        else if (areTermsAllNegative)
        {
          currentState.push(new NumberBlock(Number.NEGATIVE_INFINITY));
        }
        else
        {
          currentState.push(new NumberBlock(Number.NaN));
        }
      }
      else
      {
        currentState.push(new NumberBlock(taylorExpansion));
      }
    }

    public CloneBlock() : Block
    {
      return new NegativeLimitOperator ();
    }

    public toString() : string
    {
      return localizer.get("NegativeLimitOperator.string", "lim-");
    }

    public serialize () : string
    {
      return "lim-";
    }

    static deserialize(_serial : string) : NegativeLimitOperator
    {
      return new NegativeLimitOperator();
    }
  }

  NegativeLimitOperator.prototype.serializationPattern = /lim-/;

  // two-sided limit
  export class LimitOperator extends BinaryControlOperator
  {
    constructor() {
      super('DataBlock', 'NumberBlock');
      this.types.push('LimitOperator');
    }

    public performOperation(f : DataBlock, x : NumberBlock, currentState : ProgramState)
    {
      f.findStackInWorkspace(f.workspace);
      f.findStackInWorkspace(currentState.vm.workspace);

      var limitVM = new VirtualMachine();
      limitVM.loadState(currentState.vm.state);
      limitVM.workspace = currentState.vm.workspace;

      var negativeStack = new Stack("negative");

      negativeStack.list = [f, x, new NegativeLimitOperator()];
      limitVM.reset();
      limitVM.mainProgram.copyVariableAssignments(currentState, true);
      limitVM.mainProgram.insertInProgram(negativeStack);
      limitVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
      var negativeLimit = limitVM.EvaluateFully(false)[0];

      // currentState.copyVariableAssignments(limitVM.mainProgram, false);

      var positiveStack = new Stack("positive");
      positiveStack.list = [f, x, new PositiveLimitOperator()];
      limitVM.reset();
      limitVM.mainProgram.copyVariableAssignments(currentState, true);
      limitVM.mainProgram.insertInProgram(positiveStack);
      limitVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) / 2 - currentState.activeProgram.steps;
      var positiveLimit = limitVM.EvaluateFully(false)[0];

      // currentState.copyVariableAssignments(limitVM.mainProgram, false);

      if (negativeLimit instanceof ErrorBlock)
      {
        currentState.push(negativeLimit);
      }
      else if (positiveLimit instanceof ErrorBlock)
      {
        currentState.push(positiveLimit);
      }
      else
      {
        var fpos = (positiveLimit as NumberBlock).decimalValue;
        var fneg = (negativeLimit as NumberBlock).decimalValue;
        if (Math.abs(fpos - fneg) < 1e-6)
        {
          currentState.push(new NumberBlock((fpos + fneg) / 2));
        }
        else
        {
          currentState.push(new NumberBlock(NaN));
        }
      }
    }

    public CloneBlock() : Block
    {
      return new LimitOperator ();
    }

    public toString() : string
    {
      return localizer.get("LimitOperator.string", "lim");
    }

    public serialize () : string
    {
      return "lim";
    }

    static deserialize(_serial : string) : LimitOperator
    {
      return new LimitOperator();
    }
  }

  LimitOperator.prototype.serializationPattern = /lim/;

  export class GetOperator extends Polyscript.BinaryOperator
  {
    constructor()
    {
      super('MemoryBlock', 'MemoryReferenceBlock');
      this.types.push('GetOperator');
    }

    public CloneBlock() : GetOperator
    {
      return new GetOperator();
    }

    public performOperation(a : MemoryBlock, b : MemoryReferenceBlock, currentState : Polyscript.ProgramState)
    {
      var key = b.memoryReference;

      return a.getStateVariable(key, currentState.vm);
    }

    public serialize()
    {
      return 'Get';
    }

    public toString()
    {
      return localizer.get("GetOperator.string", 'Get Memory');
    }

    static deserialize(serial : string)
    {
      return new GetOperator();
    }
  }

  GetOperator.prototype.serializationPattern = /Get/;

  // state operators
  export class SetOperator extends Polyscript.TrinaryOperator
  {
    constructor()
    {
      super('MemoryBlock', 'Block', 'MemoryReferenceBlock');
      this.types.push('SetOperator');
    }

    public CloneBlock() : SetOperator
    {
      return new SetOperator();
    }

    public performOperation(a : MemoryBlock, b : Polyscript.Block, c : Polyscript.MemoryReferenceBlock, currentState : ProgramState)
    {
      var key = c.memoryReference;

      if (b.GetType() == 'DataBlock' || b.GetType() == 'CodeBlock')
      {
        return new Polyscript.ErrorBlock(localizer.get("Errors.setOperatorNotSupported", "{{setOperatorName}} cannot set a state variable to a {{dataBlockName}} or a {{codeBlockName}}.",
          {
            setOperatorName: localizer.get("SetOperator.name", "Set Memory Operator"),
            dataBlockName: localizer.get("DataBlock.name", "Data Block"),
            codeBlockName: localizer.get("CodeBlock.name", "Function")
          }));
      }

      currentState.vm.setStateVariable(a.getReferenceId(), key, b, currentState.runView);
      return null;
    }

    public serialize()
    {
      return 'Set';
    }

    public toString()
    {
      return localizer.get("SetOperator.string", 'Set Memory');
    }

    static deserialize(serial : string)
    {
      return new SetOperator();
    }
  }

  SetOperator.prototype.serializationPattern = /Set/;

  export class GetSymbolOperator extends Polyscript.UnaryOperator
  {
    public memoryReference : string;

    constructor(memoryReference : string)
    {
      super('MemoryBlock');
      this.types.push('GetSymbolOperator');
      this.memoryReference = memoryReference;
    }

    public CloneBlock() : GetSymbolOperator
    {
      return new GetSymbolOperator(this.memoryReference);
    }

    public performOperation(a : MemoryBlock, currentState : Polyscript.ProgramState)
    {
      var key = this.memoryReference;

      return a.getStateVariable(key, currentState.vm);
    }

    public serialize()
    {
      return 'Get[' + this.memoryReference + ']';
    }

    public toString()
    {
      return localizer.get("GetSymbolOperator.string", 'Get');
    }

    static deserialize(serial : string)
    {
      var symbol = serial.substring(4, serial.length-1);
      return new GetSymbolOperator(symbol);
    }
  }

  GetSymbolOperator.prototype.serializationPattern = /Get\[[^\[\]]*\]/;

  export class SetSymbolOperator extends Polyscript.BinaryOperator
  {
    public memoryReference : string;

    constructor(memoryReference : string)
    {
      super('Block', 'MemoryBlock');
      this.types.push('SetSymbolOperator');
      this.memoryReference = memoryReference;
    }

    public CloneBlock() : SetSymbolOperator
    {
      return new SetSymbolOperator(this.memoryReference);
    }

    public performOperation(b : Polyscript.Block, a : MemoryBlock, currentState : ProgramState)
    {
      var key = this.memoryReference;

      if (b.GetType() == 'DataBlock' || b.GetType() == 'CodeBlock')
      {
        return new Polyscript.ErrorBlock(localizer.get("Errors.setOperatorNotSupported", "{{setOperatorName}} cannot set a state variable to a {{dataBlockName}} or a {{codeBlockName}}.",
          {
            setOperatorName: localizer.get("SetOperator.name", "Set Memory Operator"),
            dataBlockName: localizer.get("DataBlock.name", "Data Block"),
            codeBlockName: localizer.get("CodeBlock.name", "Function")
          }));
      }

      currentState.vm.setStateVariable(a.getReferenceId(), key, b, currentState.runView);
      return null;
    }

    public serialize()
    {
      return 'Set[' + this.memoryReference + ']';
    }

    public toString()
    {
      return localizer.get("SetSymbolOperator.string", 'Set');
    }

    static deserialize(serial : string)
    {
      var symbol = serial.substring(4, serial.length-1);
      return new SetSymbolOperator(symbol);
    }
  }

  SetSymbolOperator.prototype.serializationPattern = /Set\[[^\[\]]*\]/;

  // executable blocks
  export class CodeBlock extends Block
  {
    public stack : Stack;
    public name : string;
    public workspace : Workspace;

    constructor(stack : Stack, name : string, workspace : Workspace) {
      super();
      this.types.push('CodeBlock');

      this.stack = stack;
      if (this.stack != null)
      {
        this.name = this.stack.name;
      }
      else {
        this.name = name;
      }
      this.workspace = workspace;
    }

    public CloneBlock() : Block
    {
      return new CodeBlock(this.stack, this.name, this.workspace);
    }

    public toString() : string
    {
      if (this.stack != null)
      {
        return this.stack.displayName? this.stack.displayName : this.stack.name.replace(/_/g, ' ');
      }
      else
      {
        return this.name.replace(/_/g, ' ');
      }
    }

    public findStackInWorkspace (workspace : Workspace) : void
    {
      if (workspace != null && this.stack == null)
      {
        this.stack = workspace.getStack(this.name);
      }
    }

    public Evaluate(currentState : ProgramState) : void
    {
      if (this.stack == null)
      {
        if (this.workspace == null)
        {
          this.workspace = currentState.vm.workspace;
        }

        this.findStackInWorkspace(this.workspace);
      }

      if (this.stack != null)
      {
        if (this.stack.obfuscated) {
          this.stack.obfuscated = false;

          var codeVM = new VirtualMachine();
          codeVM.state = currentState.vm.state; // don't copy; just share the original
          //codeVM.loadState(currentState.vm.state);
          codeVM.workspace = currentState.vm.workspace;
          codeVM.reset();
          codeVM.stack = currentState.vm.stack.slice(); // shallow copy of stack
          codeVM.mainProgram.runView = new PassthroughRunView(currentState); // if we pop a block from the copy of the stack and that block is in the real stack, pop that one too.
          codeVM.mainProgram.copyVariableAssignments(currentState, true);
          codeVM.mainProgram.insertInProgram(this.stack);
          codeVM.maxSteps = (currentState.activeProgram.maxSteps || currentState.vm.maxSteps) - currentState.activeProgram.steps;
          var result = codeVM.EvaluateFully(false);

          currentState.copyVariableAssignments(codeVM.mainProgram, false);

          // ignore any blocks in the result that were already in the stack to begin with
          var ignoreIndex = -1;
          for (var i = 0; i < result.length && i < currentState.vm.stack.length; i++)
          {
            if (result[i] === currentState.vm.stack[i])
            {
              ignoreIndex = i;
            }
            else
            {
              break;
            }
          }

          if (ignoreIndex >= 0)
          {
            result = result.slice(ignoreIndex + 1);
          }

          currentState.pushList(result);

          this.stack.obfuscated = true;
        } else {
          currentState.insertInProgram (this.stack);
        }
      }
    }

    public Eq(b : Block) : boolean
    {
      if (!this.sameType(b))
      {
        return false;
      }
      this.findStackInWorkspace(this.workspace);
      (b as CodeBlock).findStackInWorkspace(this.workspace);

      return Stack.cyclicEq(this.stack, (b as CodeBlock).stack, [], []);
    }

    public serialize() : string
    {
      return WhitespaceEscaper.escape(this.name);
    }
    static deserialize(serial : string) : CodeBlock
    {
      var name = WhitespaceEscaper.unescape(serial);
      return new CodeBlock(null, name, null);
    }
  }

  CodeBlock.prototype.serializationPattern = /[^\s\{\}()\[\]\"]+/;

  export class ColorBlock extends IdentityBlock
  {
    public r : number;
    public g : number;
    public b : number;

    constructor(r : number, g : number, b : number)
    {
      super();
      this.types.push('ColorBlock');
      this.r = Math.min(Math.max(Math.round(r), 0), 255);
      this.g = Math.min(Math.max(Math.round(g), 0), 255);
      this.b = Math.min(Math.max(Math.round(b), 0), 255);
    }

    public Eq (b : Block) : boolean
    {
      return b instanceof ColorBlock && this.r == b.r && this.g == b.g && this.b == b.b;
    }

    public CloneBlock() : Block
    {
      return new ColorBlock(this.r, this.g, this.b);
    }

    public toString() : string
    {
      return this.r + ", " + this.g + ", " + this.b;
    }

    public toHexString() : string
    {
      var r = this.r.toString(16);
      if (r.length == 1)
      {
        r = "0" + r;
      }
      var g = this.g.toString(16);
      if (g.length == 1)
      {
        g = "0" + g;
      }
      var b = this.b.toString(16);
      if (b.length == 1)
      {
        b = "0" + b;
      }
      return "#" + r + g + b;
    }

    public serialize () : string
    {
      return "Color[" + this.r + "," + this.g + "," + this.b + "]";
    }

    static deserialize (serial : string)
    {
      var bracketIndex = serial.indexOf("[");
      var firstCommaIndex = serial.indexOf(",");
      var secondCommaIndex = serial.indexOf(",", firstCommaIndex+1);
      var rBracketIndex = serial.length - 1;

      var r = Number.parseInt(serial.substring(bracketIndex+1, firstCommaIndex));
      var g = Number.parseInt(serial.substring(firstCommaIndex+1, secondCommaIndex));
      var b = Number.parseInt(serial.substring(secondCommaIndex+1, rBracketIndex));

      return new ColorBlock(r, g, b);
    }
  }

  ColorBlock.prototype.serializationPattern = /Color\[\d+,\d+,\d+]/;

  export function CreateBlock(blockString : string) : Block
  {
    if (Workspace._typeRegex == null)
    {
      Workspace.BuildTypeData();
    }

    var blockPattern = "^(?:" + Workspace._typeRegex.source + ")$";
    var blockRegex = new RegExp(blockPattern);

    if (blockString == null)
    {
      return new ErrorBlock(localizer.get("Errors.CreateBlock.null", "Invalid argument to CreateBlock: null"));
    }

    var blockMatch : RegExpExecArray = blockRegex.exec(blockString);
    if (blockMatch != null)
    {
      for (var k = 0; k < Workspace._typeList.length; k++)
      {
        if (blockMatch[k+1] != null)
        {
          var type = Workspace._typeList[k];
          //console.log("deserialize " + blockString + " type " + k + ": "+ this.typeList[k].prototype.serializationPattern);
          return type.deserialize(blockString);
        }
      }
    }

    return new ErrorBlock(localizer.get("Errors.CreateBlock.nomatch", "Input \"{{blockString}}\" to CreateBlock does not match any block's serialization pattern.", {blockString : blockString}));
  }

  export function getNextDataBlockVersion(block : DataBlock, vm : Polyscript.VirtualMachine)
  {
    var name = block._stack.displayName || block._stack.name;
    if (name === 'null')
    {
      name = 'a' + ++vm.anonStackIndex;
    }
    var version = 1;
    var match = /(.*):(\d+)/.exec(name);
    if (match != null)
    {
      version = Number.parseInt(match[2]) + 1;
      name = match[1];
    }

    return name + ':' + version;
  }

  export class test
  {
    constructor() {
      var runtime = VirtualMachine.runtime;
      runtime.workspace = Workspace.deserialize("@Poly { read 3 ->$x 0 @TaylorTerm 0 10 iter }\n@TaylorTerm { ->$n 1 @mulX $n comp 1 @* 1 $n iter / + }\n@mulX { $x * }\n@x { $x } @* { * } @append { append }")

      runtime.mainProgram.insertInProgram(runtime.workspace.getStack('Poly'));
      runtime.LoadInputDefinition("#in1 { @mulX }");

      console.log(VirtualMachine.runtime.EvaluateFully(true));
    }
  }

  VirtualMachine.runtime = new VirtualMachine();
}

export default Polyscript;
