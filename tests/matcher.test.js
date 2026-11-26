const { test } = require('node:test');
const { strict: assert } = require('node:assert');
global.window = {};
require('../static/catalog');
const { rank, pick } = require('../static/matcher');
const catalog=window.MM_CATALOG;
const first=(q,mode='auto')=>rank(q,mode,catalog).items[0].id;
test('language maps to the intended moment, ignoring case and punctuation',()=>{
 assert.equal(first('We FINALLY got it working!!'),'eagle');
 assert.equal(first('Our first build just passed'),'step');
 assert.equal(first('Let’s go!'),'lift');
 assert.equal(first('we did it','gif'),'landing-gif');
});
test('unrelated or negative prompts are not passed off as a match',()=>{
 assert.equal(rank('That was awkward','auto',catalog).matched,false);
 assert.equal(rank('The fix never worked','auto',catalog).matched,false);
 assert.equal(rank('Something failed but it finally works','auto',catalog).items[0].id,'eagle');
});
test('formats, fallback, and no repeat random',()=>{
 assert.equal(rank('', 'gif', catalog).items.length,2);
 assert.equal(rank('', 'video', catalog).items.length,3);
 assert.equal(rank('quokka dances','auto',catalog).matched,false);
 assert.equal(pick(catalog,'eagle',()=>0).id,'step');
});
