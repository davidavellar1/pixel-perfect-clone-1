import {useState} from 'react';
import {FileText,Download} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {supabase} from '@/integrations/supabase/client';
import {pdfInputsSchema,type PdfKind} from '@/lib/projectPdf';
import {deliverFile} from '@/lib/downloadFile';
import {useInvestorQualification} from '@/hooks/useInvestorQualification';
import {Link} from '@/lib/router-compat';
export function GeneratedProjectDocuments({projectId}:{projectId:string}){
 const {qualified,loading}=useInvestorQualification();const [busy,setBusy]=useState<PdfKind|null>(null);const [error,setError]=useState('');const [ready,setReady]=useState<{kind:PdfKind;blob:Blob}|null>(null);
 const prepare=async(kind:PdfKind)=>{setBusy(kind);setError('');setReady(null);try{const {data,error:failed}=await supabase.rpc('project_pdf_inputs',{_project_id:projectId});if(failed)throw failed;const inputs=pdfInputsSchema.parse(data);const response=await fetch('/fonts/inter-report.ttf');if(!response.ok)throw new Error('Report font unavailable');const {generateProjectPdf}=await import('@/lib/projectPdf');const bytes=await generateProjectPdf(inputs,kind,new Uint8Array(await response.arrayBuffer()),window.location.origin);setReady({kind,blob:new Blob([new Uint8Array(bytes)],{type:'application/pdf'})});}catch(e){setError(e instanceof Error?e.message:'The report could not be prepared. Check your mandate and retry.');}finally{setBusy(null);}};
 return <section className="mt-8 border-t border-border pt-6"><h2 className="mb-3 text-xl font-semibold">Generated documents</h2>{loading?<p role="status">Checking investment mandate...</p>:!qualified?<Button variant="outline" asChild><Link to="/app/settings#investor">Complete your investment mandate to open this</Link></Button>:<><div className="flex flex-wrap gap-3">{(['teaser','summary'] as const).map(kind=><Button key={kind} variant="outline" disabled={busy!==null} onClick={()=>void prepare(kind)}><FileText className="h-4 w-4"/>{busy===kind?'Preparing...':kind==='teaser'?'Prepare anonymized teaser PDF':'Prepare project summary PDF'}</Button>)}</div>{ready&&<Button className="mt-4" onClick={()=>void deliverFile(ready.blob,`dhc-market-${ready.kind}.pdf`)}><Download className="h-4 w-4"/>Download {ready.kind} PDF</Button>}<p className="mt-3 text-xs text-muted-foreground">Developer-stated figures, dated copy and recipient watermark. The teaser always remains anonymized.</p></>}{error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}</section>;
}
