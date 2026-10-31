/* Render tests load the same shared symbol primitive as the built atlas. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const symbols=fs.readFileSync(path.join(__dirname,'../src/marker-shapes.js'),'utf8')+'\n';
module.exports={...vm,
  runInContext(source,...args){return vm.runInContext(symbols+source,...args);},
  runInNewContext(source,...args){return vm.runInNewContext(symbols+source,...args);}
};
