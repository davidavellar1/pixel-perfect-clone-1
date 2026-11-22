export function applicantCriterion(allowed:string[],type:string|null|undefined){
 const map:Record<string,string[]>={municipality:['municipality','public_body'],private_developer:['private_developer'],energy_company:['private_developer'],esco:['private_developer']};
 if(!type||type==='other'||type==='utility')return {label:'Applicant type',state:'open' as const,detail:'Applicant ownership or legal form is not established. Company size is unchecked.'};
 if(!allowed.length)return {label:'Applicant type',state:'open' as const,detail:'No actor restriction recorded. Company size is unchecked.'};
 const actors=map[type]??[];const sizeOnly=allowed.some(v=>['sme','large_company'].includes(v));
 if(actors.some(v=>allowed.includes(v)))return {label:'Applicant type',state:'meets' as const,detail:`${type.replaceAll('_',' ')} is among the recorded applicant actors. Company size is unchecked.`};
 if(sizeOnly&&type!=='municipality')return {label:'Applicant type',state:'open' as const,detail:'Business applicant; SME or large-company status is unchecked because headcount and turnover are not collected.'};
 return {label:'Applicant type',state:'fails' as const,detail:`${type.replaceAll('_',' ')} does not match the recorded applicant actors: ${allowed.join(', ')}. Company size is unchecked.`};
}
