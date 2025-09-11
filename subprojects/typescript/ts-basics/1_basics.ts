let userName: string = 'John'; 
let hasLoggedIn: boolean = true;

// hasLoggedIn += " Herrington";    //TS will catch this error 

console.log(hasLoggedIn);

let myNumber: number = 6;
let myRegex: RegExp = /foo/;

const names: string[] = userName.split(' ');
// const myValues: Array<number> = [1, 2, 3,'a']; //TS will catch this error

const myPersonObject: {
    name: string,
     age: number
} = {
    name: 'John',
     age: 20,
    //  cool: true //TS will catch this error
};

const IdsA = {
    10: 'a',
    20: 'b'
}
// IdsA[30] = 'c'; //TS will catch this error (IdsA is an object)

const mapsOfIdsB: Record<number, string> = {
    10: 'a',
    20: 'b'
}
mapsOfIdsB[30] = 'c'; // mapsOfIdsB is a record (similar to an object but allows to add new keys)


// for (let i = 0; mapsOfIdsB.size; i++) { console.log(mapsOfIdsB[i]); }
// You can't use .length on a Record/object. Instead, loop over its values.
for (const value of Object.values(mapsOfIdsB)) {
    console.log(value);
}

[1,2,3].forEach(value => console.log(value));
const out = [4,5,6].map(value => value * 2);
console.log(out);

// Run option 1:
// npm init
// npm add typescript -D
// npm add ts-node 
// npx tsc --init   //add a new tsconfig.json
// npx ts-node 1_basics.ts
