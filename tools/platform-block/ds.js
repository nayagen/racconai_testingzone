const React=require('react'); const {renderToStaticMarkup}=require('react-dom/server');
global.window=globalThis; globalThis.React=React; globalThis.ReactDOM=require('react-dom');
globalThis.document=undefined;
const D=process.env.DSDIR; require('vm').runInThisContext(require('fs').readFileSync(D+'/components/bundle.js','utf8'));
module.exports={React,R:renderToStaticMarkup,DS:globalThis.RaccoonDS,h:React.createElement};
