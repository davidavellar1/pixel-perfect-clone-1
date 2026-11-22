import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { Form,FormField,FormItem,FormLabel,FormControl,FormMessage } from '@/components/ui/form';
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useOwnProjects } from '@/lib/funding';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
const schema=z.object({project:z.string().uuid('Choose your listing.'),message:z.string().trim().min(5,'Write at least five characters.').max(3000)});
export default function ContactRequestDialog({target,close}:{target:{id:string;name:string;kind:'funding'|'advisor'};close:()=>void}){
 const {user}=useAuth();const {projects,loading}=useOwnProjects();const [saved,setSaved]=useState(false);const [error,setError]=useState('');const form=useForm<z.infer<typeof schema>>({resolver:zodResolver(schema),defaultValues:{project:'',message:''}});
 const submit=async(values:z.infer<typeof schema>)=>{if(!user)return;setError('');const result=await supabase.from('contact_request').insert({requester_id:user.id,project_id:values.project,kind:target.kind,target_id:target.id,message:values.message}).select('id').single();if(result.error){setError('The request was not recorded. Please try again.');return;}setSaved(true);};
 return <Dialog open onOpenChange={open=>{if(!open)close();}}><DialogContent><DialogHeader><DialogTitle>Request contact with {target.name}</DialogTitle><DialogDescription>{saved?'Your request and listing context were recorded for administrator review. No introduction has been made.':'Record your listing and message for administrator review. Nothing is sent to the target automatically.'}</DialogDescription></DialogHeader>{saved?<Button onClick={close}>Close</Button>:loading?<p role="status">Loading your listings...</p>:!projects.length?<p className="text-sm text-muted-foreground">A listing is required before requesting contact.</p>:<Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-4"><FormField control={form.control} name="project" render={({field})=><FormItem><FormLabel>Your listing</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Choose listing"/></SelectTrigger></FormControl><SelectContent>{projects.map(p=><SelectItem key={p.id} value={p.id}>{p.title||'Draft listing'}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>}/><FormField control={form.control} name="message" render={({field})=><FormItem><FormLabel>Message</FormLabel><FormControl><Textarea {...field} maxLength={3000}/></FormControl><FormMessage/></FormItem>}/>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting?'Recording...':'Record contact request'}</Button></form></Form>}</DialogContent></Dialog>;
}
