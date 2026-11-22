import {it} from 'node:test';
import assert from 'node:assert/strict';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {Database} from '@/integrations/supabase/types';
import {isQualifiedInvestor} from './access';
it('anonymous accounts never qualify or call the database',async()=>{let called=false;const client={rpc:()=>{called=true;}} as unknown as SupabaseClient<Database>;assert.equal(await isQualifiedInvestor(null,client),false);assert.equal(called,false);});
it('qualification uses only the verified database decision, not supplied account details',async()=>{const calls:string[]=[];const client={rpc:async(name:string)=>{calls.push(name);return {data:false,error:null};}} as unknown as SupabaseClient<Database>;assert.equal(await isQualifiedInvestor({id:'investor'},client),false);assert.deepEqual(calls,['is_qualified_investor']);});
it('qualification can open information without developer acceptance',async()=>{const client={rpc:async()=>({data:true,error:null})} as unknown as SupabaseClient<Database>;assert.equal(await isQualifiedInvestor({id:'investor'},client),true);});
