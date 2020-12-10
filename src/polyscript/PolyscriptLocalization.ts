
export interface IPolyscriptLocalizer
{
  get(key : string, fallback?: string, variables?: {[key:string] : string | number}) : string;
}

export class DefaultPolyscriptLocalizer implements IPolyscriptLocalizer
{
  get(key : string, fallback? : string, variables?: {[key:string] : string | number})
  {
    var result = fallback || key;
    if (variables)
    {
      for (var key in variables)
      {
        var value = variables[key];

        var regex = new RegExp("{{" + key + "}}", "g");
        if (typeof value == "number")
        {
          result = result.replace(regex, "" + value);
        }
        else
        {
          result = result.replace(regex, value);
        }
      }
    }
    return result;
  }
}
