// This file is the BEHAVIOR of your page: what happens when you interact with it.

// Find the elements on the page by their id (see index.html)
const button = document.getElementById("click-button");
const countText = document.getElementById("click-count");

// A variable that remembers how many times the button was clicked
let clicks = 0;

// Run this code every time the button is clicked
button.addEventListener("click", function () {
  clicks = clicks + 1;
  countText.textContent = "You pressed " + clicks + " time(s)!";
});

// This message appears in the browser's console (right-click the page → Inspect → Console)
console.log("Hello from script.js!");
