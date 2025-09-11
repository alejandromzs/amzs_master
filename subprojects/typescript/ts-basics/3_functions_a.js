function addTwoNumbers(a, b) {
    return a + b;
}
export default addTwoNumbers;
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
//# sourceMappingURL=3_functions.js.map