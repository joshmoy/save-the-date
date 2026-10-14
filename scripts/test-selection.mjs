/** Strict selection: a misspelled flag must never silently launch the full suite. */
export function testSelection(args, available) {
 const selected=[], patterns=[];let full=false;
 for(const arg of args){
  if(arg==='--full'){full=true;continue;}
  if(arg.startsWith('--file=')){
   const file=arg.slice(7).replace(/^tests\//,'');
   if(!available.includes(file))throw Error('Unknown test file: '+file);
   if(!selected.includes(file))selected.push(file);
  }else if(arg.startsWith('--name=')){
   const pattern=arg.slice(7);if(!pattern)throw Error('Test name pattern must not be empty');
   new RegExp(pattern);patterns.push(pattern);
  }else throw Error('Unknown verification argument: '+arg);
 }
 if(full&&(selected.length||patterns.length))throw Error('--full cannot be combined with focused test selectors');
 return {full,files:(selected.length?selected:available).map(file=>'tests/'+file),nodeOptions:patterns.map(pattern=>'--test-name-pattern='+pattern)};
}
