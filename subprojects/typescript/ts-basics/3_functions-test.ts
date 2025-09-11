import addTwoNumbersC from "./3_functions.js";
import { addStrings } from "./3_functions.js"; // Object destructing
import { introduce } from "./3_functions.js"; 

console.log(addTwoNumbersC(1, 2));

console.log(addStrings("Hello", "World"));


console.log(introduce("Good morning", "Alice", "Bob", "Charlie"));
// "Good morning Alice, Bob, Charlie."


// run option 1:
// node --loader ts-node/esm 3_functions-test.ts  
// It uses ts-node

// run option 2 (Better):
// npm install tsx --save-dev
// It uses modern typescript compiler tsx
// npx tsx 3_functions-test.ts