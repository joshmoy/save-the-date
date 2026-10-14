import test from 'node:test';
import assert from 'node:assert/strict';
// The runner is native ESM and executes before TypeScript is loaded.
// @ts-expect-error Native orchestration module has no declaration file.
import {testSelection} from '../scripts/test-selection.mjs';
const available=['guests.test.ts','invitations.test.ts'];
test('focused verification selects exact files without silently expanding scope',()=>{
 assert.deepEqual(testSelection(['--file=tests/guests.test.ts','--file=guests.test.ts','--name=capacity'],available),{full:false,files:['tests/guests.test.ts'],nodeOptions:['--test-name-pattern=capacity']});
 assert.deepEqual(testSelection(['--full'],available).files,['tests/guests.test.ts','tests/invitations.test.ts']);
 for(const args of [['--files=guests.test.ts'],['--file=missing.test.ts'],['--file=../guests.test.ts'],['--name='],['--name=['],['--full','--file=guests.test.ts']])assert.throws(()=>testSelection(args,available));
});
