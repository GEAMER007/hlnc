const fs=require("fs");
const separators=['.','=','(',')','"',"'",'$','@',';']
const tokens={
    ';':class semicolonToken{
        constructor (){
            this.toInstructions=()=>['//;','pops']
            this.s=';'
        }
    },
    '.':class propertyToken{
        constructor(){
            this.toInstructions=(d,s,i)=>{
                let ind=s.indexOf(d[i+1])
                ind=ind<0?s.push(d[i+1])-1:ind
                return ['//.property',`push${ind>128?'s':'b'} ${ind}`,'pushp','getp']
                 
            }
            this.s='.'
        }
    },
    '=':class setValueToken{
        constructor(){
            this.toInstructions=(d,s,i)=>{
                return []
                 
            }
            this.s='='
        }
    },
    '(':class groupingStartToken{
        constructor (l){
            this.toInstructions=(d,s,i,ins)=>{
                var endtokensneeded=1
                var holds=[]
                var endfound=!1
                var ii
                for(ii=i+1;ii<d.length;ii++){
                    
                    if(d[ii] instanceof tokens[")"])endtokensneeded--
                    else if(d[ii] instanceof tokens['('])endtokensneeded++
                    if(endtokensneeded==0){endfound=!0;break} else holds.push(d[ii])
                }
                holds.pop()
                ins.push('//(')
                compileDigested(ins,s,holds)
                if(d[i]!='')ins.push('calls')
                if(!endfound)throw new Error(`[at ${l}]bracket not closed`)
                return ii
                 
            }
            this.s='('
        }
    },
    ')':class groupingEndToken{
        constructor (){
            this.toInstructions=(d,s,i)=>{
                return ['//)']
                 
            }
            this.s=')'
        }
    },
    '"':class doubleQuoteToken{
        constructor (l){
            this.toInstructions=(d,s,i,ins)=>{
                var ii;
                var contents =''
                var endfound=!1
                for(ii=i+1;ii<d.length;ii++){
                    if(typeof d[ii]=='string')contents+=d[ii]
                    else{
                    if(d[ii] instanceof doubleQuoteToken&&!contents.endsWith('\\')){
                        endfound=!0
                        break
                    }
                    contents+=d[ii].s
                }
                    
                }
                if(!endfound)throw new Error(`[at ${l}]bracket not closed`)
                let ind=s.indexOf(contents)
                ind=ind<0?s.push(contents)-1:ind
                ins.push('//string',`push${ind>128?'s':'b'} ${ind}`,'pushp')
                return ii+1
                 
            }
            this.s='"'
        }
    },
    "'":class singleQuoteToken{
        constructor (l){
            this.toInstructions=(d,s,i,ins)=>{
                var ii;
                var contents =''
                var endfound=!1
                for(ii=i+1;ii<d.length;ii++){
                    if(typeof d[ii]=='string')contents+=d[ii]
                    else{
                    if(d[ii] instanceof singleQuoteToken&&!contents.endsWith('\\')){
                        endfound=!0
                        break
                    }
                    contents+=d[ii].s
                }
                    
                }
                if(!endfound)throw new Error(`[at ${l}]bracket not closed`)
                let ind=s.indexOf(contents)
                ind=ind<0?s.push(contents)-1:ind
                ins.push('//string',`push${ind>128?'s':'b'} ${ind}`,'pushp')
                return ii+1
                 
            }
            this.s="'"
        }
    },
    '$':class variableCreationToken{
        constructor (l){
            this.toInstructions=(d,s,i)=>{
                //if(!(d[i]-2 instanceof setValueToken))throw new Error(`[at ${l}]Variable declaration without definition`)
                let ind=s.indexOf(d[i-1])
                ind=ind<0?s.push(d[i-1])-1:ind
                return ['//variableCreated',`push${ind>128?'s':'b'} ${ind}`,'pushp','store']
                 
            }
            this.s='$'
        }
    },
    '@':class variableIndexToken{
        constructor (){
            this.toInstructions=(d,s,i)=>{
                let ind=s.indexOf(d[i-1])
                ind=ind<0?s.push(d[ind+1])-1:ind
                return ['//variableIndexed',`push${ind>128?'s':'b'} ${ind}`,'pushp','pushvar']
                 
            }
            this.s='@'
        }
    }
}
function compileDigested(instructions,stringpool,digested){
    for(var i=-1; i<digested.length-1;){
        
        i++
        
        if(typeof digested[i] == "string"){ continue;}
        var outp=digested[i].toInstructions(digested,stringpool,i,instructions)
        typeof outp == "number"?i=outp-1:instructions.push(...outp)
        
    }
    
}
function compile (input, output){
    const incontent=fs.readFileSync(input, "utf8").split('\r\n').join('\n').split('\n').join('')
    var ptptr=0
    const digested=[]
    var linen=1
    for(var i=0; i<incontent.length; i++){
        if(incontent[i]=='\n')linen++
        else if(separators.includes(incontent[i])){
            // const s=
            
            digested.push(incontent.substring(ptptr,i).trim(), new tokens[incontent[i]](linen))
            ptptr=i+1
        }
        
    }
    const stringpool=['global','globals']
    const instructions=['//init','pushb 0','pushp','pushgl','pushb 1','pushp','store','//code']
    compileDigested(instructions,stringpool,digested)
    var outcontent=`#strpool\r\n${stringpool.join('\r\n')}\r\n#code\r\n${instructions.join('\r\n')}\r\n#metadata\r\n{\r\n\t"compiler_v":"alpha_0.1"\r\n}`
   // console.log(instructions,stringpool,digested)
fs.writeFileSync(output,outcontent)
}
module.exports=compile
global.compile=compile
