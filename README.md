# promise-keeper

### Introduction

Promise Keeper is a minimalist (yet complete) implementation of JavaScript 
Promises.  Asynchronicity is at the core of JavaScript and use of promises is 
becoming a ubiquitous way to wrangle time-variant software operations.  This 
utility was written for demonstration and education purposes and to provide just 
one blueprint to understand Promises by looking at their implementation.  To 
make that inquiry process manageable the code footprint was kept as small as 
possible (about 200 lines) while maintaining the necessary structure and clarity.

This tool will work in a production environment.  Such usage is discouraged.
Promise Keeper was written for the expressed objectives and no effort has been 
made to optimize its code for the fullest performance.  Promises support is now 
standard in all modern browsers and node.js.  A developer is encouraged to rely
on those.

### Documentation

`promise-keeper` works the same way as `Promise` implementation in Firefox
browser.  Mozilla Development Network's [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
guide is a good reference to get started with promises.  Additionally, [test](https://github.com/aptivator/promise-keeper/tree/master/test)
folder contains a comprehensive set of Promise examples.
