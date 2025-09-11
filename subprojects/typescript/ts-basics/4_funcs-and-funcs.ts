
//callback functions & higher order functions
 
// Callback function is a function that is passed as an argument to another function that is expected to be called later. In the example is the showSuccessMessage function.
//Higher-Order function is the function that accepts other functions, callback, as one of its arguments.
export function saveDataWithCallback(data: string, callback : () => void): void {  // () => void means the function doesn't take arguments and void doesn't return a value.
    setTimeout(() => {console.log("simulation data saved after 5 seconds: " + data);
    callback(); }, 5000);
}

//This is the callback function that should be called only after the data is saved in a async language
function showSuccessMessage(): void {
    console.log("success saved message");
}

//The saveDataWithCallback higher-order function executes showSuccessMessage only after their own code is executed, but it allows other code to be executed on the mindtime.
saveDataWithCallback("my_information_to_save", showSuccessMessage);



 // Another example of a higher-order function is the arrayMutate function because it accepts a function (mutateExample) as an argument. (mutate = callback function)
export function arrayMutate (numbers: number[], mutateFuncExample: (v: number) => number): number[] {
    return numbers.map(mutateFuncExample); //map is a higher-order function that accepts a callback function as an argument. 
    // for each number in the array, the callback function is executed and the result is returned.
}


 //(v) => v * 10 is the anonym arrow function that is passed as an argument to the arrayMutate function.
console.log(arrayMutate([1,2,3], (v) => v * 10));


// EXERCISE:
// Given a list of product objects, write a function that takes the array of products and a "transformation" function. The function should return a new array with the price of each product increased by 15%.

// 
// const products = [
//     { name: "Laptop", price: 1200 },
//     { name: "Mouse", price: 25 },
//     { name: "Keyboard", price: 75 },
//   ];
// Expected output:[1380, 28.75, 86.25]

//Solution: 
interface Product {
    name: string;
    price: number;
}
function applyPriceIncrease(productItem: Product[], transformation: (product: Product) => number): number[] {
    return productItem.map(transformation);
}

const products: Product[] = [
    { name: "Laptop", price: 1200 },
    { name: "Mouse", price: 25 },
    { name: "Keyboard", price: 75 },
  ];

const priceIncreaseFn = (product: Product): number => {
    return product.price * 1.15;
};

console.log(applyPriceIncrease(products, priceIncreaseFn));




// Functions as types
// it makes it more clear to read the mutation Function
export type MutationFunction = (v: number) => number;
export function arrayMutate2 (
    numbers: number[],
    mutateFuncExample: MutationFunction
) : number[] {
    return numbers.map(mutateFuncExample); 
}

const myNewMutateFunc: MutationFunction = (v: number) => v * 100;
console.log(`arrayMuate2: ${arrayMutate2([1,2,3], myNewMutateFunc)}`);


//Functions that are Returning Functions
type arrowFunctionExample = (val: number) => number; 
export function createAdder(num: number) : arrowFunctionExample {
    return (val: number) => num + val; // this is the function that is being returned. Note that val is not defined here. This is a closure function.
}

const addOne = createAdder(1);
console.log('addOne called: ' + addOne(55));
console.log('addOne called: ' + addOne(10));
const addTwo = createAdder(2);
console.log('addTwo called: ' + addTwo(10));


//Exercise:
// Create a function named createMultiplier that takes a single number, factor, as an argument. The function should return a new function that takes a number, inputNumber, and returns inputNumber multiplied by the factor.
// Use this function to create two specific functions: double and triple. Then, use these new functions to calculate and print the result of doubling 7 and tripling 5.

function createMultiplier(factor: number) {
    return (inputNumber: number) => inputNumber * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(7));
console.log(triple(5))