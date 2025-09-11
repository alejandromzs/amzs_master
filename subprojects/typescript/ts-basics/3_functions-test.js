import {getName, getNameB, getNameC} from './3_functions.js'

console.log("it works: " + getName({
    first: 'John',
    last: 'Doe'
}))

console.log(getNameB())
// it returns: undefined undefined


console.log(getNameC())
// it returns: firstC lastC

//typescript enforces types at compile time but not at runtime:
console.log(getName())
// TypeError: Cannot read properties of undefined (reading 'first')
// Check getNameB and getNameC to fix 

