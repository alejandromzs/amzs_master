if ("" == 0) { 
    console.log("It is true! But why?? JS converts \"\" to \"falsy\"  but when \"\"  is converted to a number to be compared with 0, it becomes 0 also. So 0 = 0 is true.");
  }

  let x ='a';
  if (1 < x < 3) {
    console.log("True for *any* value of x! The reason is that the expression is evaluated from left to right, so the first comparison is 1 < a, which is false (a is not a number and is always converted to NaN. NaN compared with a number is always false), and the second comparison is then false < 3. false is converted to 0 with JS, so 0<3 is true."); 
    console.log("it is recommender to use && :" + (1 < x && x < 3));
    let y = 'b';
    console.log("1<x: " + (1 < y));    
    console.log("x<1: " + (y > 1));      
    console.log("x == NaN: " + (y == NaN));  
  }

  const obj = { width: 10, height: 15 }; 
const area = obj.width * obj.heightIncorrectSpelling;
console.log('area is Nan because incorrect spelling of object property:', area);

// Run option 1: node 2_basics.js