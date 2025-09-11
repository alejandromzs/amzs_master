// function addTwoNumbersA(a, b) {
//     // a and b implicitly has an 'any' type. 
//     // which TS wants to avoid.
//     return a + b;
// }

// function addTwoNumbersB(a: number, b: number) {
//     // It will recomend return type. It can infer but add : number
//     return a + b;
// }

function addTwoNumbersC(a: number, b: number) : number { 
    return a + b;
}
 

export default addTwoNumbersC;

//Another option to export function
// arrow functions
// template literals
// ESM export
// Destructured imports when not default
//Default parameters
export const addStrings = (str1: string, str2: string = ""): string => {
    return `${str1} ${str2}`;
}

//Union Types ( When using |)
export const forma = (title: string, param: string | number) : string => `${title} ${param}`;

//Void functions
export const printFormat = (title: string, param: string | number): void => console.log(`${title} ${param}`);

//Promise functions
export const fetchData = (url: string): Promise<string> => Promise.resolve(`Data from ${url}. It is not a real call to an api but just a dummy example. `);

//Promise functions with a real call async/await
export const fetchDataReal = async (url: string): Promise<string> =>{
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const text = await response.text(); 
    return text;
  };

//Rest parameters
export const introduce = function introduce(salutation: string, ...names: string[]): string {
    return `${salutation} ${names.join(', ')}.`;
  }
  
//typescript enforces types at compile time but not at runtime:
export function getName(user: {first:string, last:string}): string {
    return `${user.first} ${user.last}`;
  }
// when ts is compiled to js, it will be:
    // function getname(user){
    //  return user.first + ' ' + user.last;
    //}
// so, at runtime, it won't check if the user object has the properties first and last.
//To correct it, it could be changed to:
export function getNameB(user: {first:string, last:string}): string {
    return `${user?.first} ${user?.last}`;
  }
// when compiled to js, it will be:
    // function getnameB(user){
    // return (user === null || user === void o ? void 0 : user.first) + " " + (user === null || user === void 0 ? void 0 : user.last);
    //}
//It would return undefined undefined.
// to improve it, we can use optional updated function:
export function getNameC(user: {first:string, last:string}): string {
    return `${user?.first ?? 'firstC'} ${user?.last ?? 'lastC'}`;
  }


// by 2025, TS requires to use the following configuration:
// tsconfig.json (created by default using npx tsc --init ) :
//{
    // "compilerOptions": {
    //     "module": "nodenext",
    //     "target": "esnext",
    //   }
    // }
// and add to package.json module so node.js can read .js as ESM modules:
// "type": "module"

// Run from 3_functions-test.ts
