function twoSum(nums: number[], target: number): number[] {
        for (let i = 0; i< nums.length; i++){
            for (let j=i+1; j < nums.length; j++){ 
                if (nums[i]! + nums[j]! === target) {
                    return [i, j];
                }
            }
        } 
    return [];
};

console.log(twoSum([3,1,5],8))
console.log(twoSum([3],8))
console.log(twoSum([3,0],8))
console.log ("complexity twoSum is O(n²) due to 2 dependent bucles")

function twoSumB(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();

    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i]!;
        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }
        seen.set(nums[i]!, i);
    }

    return [];
}

console.log ("complexity twoSumB is O(n) due to only one bucle")
console.log(twoSumB([3,1,5],8))
console.log("twosumB 3 3 3 3 6 : " + twoSumB([3,3,3,3,3,3],6))

//npx ts-node 1_exercise1.ts



function twosumC(nums: number[], sum: number) : number[] {
    const complementSeen = new Map<number, number>()
    const complementSeenB: Map<number, number> = new Map() //Another declaration option
    const complementSeenC = new Map() //Another declaration but with <any,any>
    const complementSeenD = new Map<'a'|'b'|'c', number> ([
        ["a",123],
        ["b",234],
        ["b",534], // If you enter the same key multiple times, the latest assignment overwrites the previous one.
    ]); //Another declaration option with specific details
    console.log("has a : " + complementSeenD.has("a"))
    console.log("has c : " + complementSeenD.has("c"))
    console.log("get b : " +complementSeenD.get("b"))  //If you enter the same key multiple times, the latest assignment overwrites the previous one.

    
    for (let i = 0; i < nums.length ; i++){
        const numbercomplement = sum - nums[i]!
        if (complementSeen.has(numbercomplement)){
            return [complementSeen.get(numbercomplement)!, i]
        }
        complementSeen.set(nums[i]!,i)
    }

    return []
}

console.log("twosumC: " + twosumC([4,2,3,4],8))