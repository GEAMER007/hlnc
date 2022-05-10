var input=process.argv[2]
var output=process.argv[3]
if(!output&&!!input){
    const path =require("path")
    output= `${path.dirname(input)}/${path.basename(input,'.hlnb')}.njsbcs`
}
if(!input){console.error("no input provided:(");process.exit(1)}
require('./compiler')(input,output)