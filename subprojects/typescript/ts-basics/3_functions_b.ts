// Simulates an API call that always fails
function fakeApi(): Promise<string> {
    return Promise.reject("🔥 API failed!");
  }
  
  // Case 1: return the promise directly
  // - The error will "bubble up" and can only be caught by the caller
  // - This is simpler and slightly more efficient since there’s no extra try/catch here
  async function case1() {
    console.log("case1 started");
    return fakeApi(); // just forwards the promise (error handled outside)
  }
  
  // Case 2: use return await inside a try/catch
  // - The error is thrown *inside* this function
  // - This allows you to handle, log, transform, or wrap the error locally
  // - You can still rethrow the error to let the caller handle it as well
  async function case2() {
    console.log("case2 started");
    try {
      return await fakeApi(); // error is thrown here inside the function
    } catch (err) {
      console.log("case2 caught inside:", err);
      throw err; // optional: rethrow so the caller still knows about it
    }
  }