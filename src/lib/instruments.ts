export const MATCHED_INSTRUMENTS={equity:'Equity',equity_and_shareholder_loan:'Equity and shareholder loan',preferred_equity:'Preferred equity',mezzanine:'Mezzanine',convertible:'Convertible'};
export const FINANCING_CAPABILITIES={senior_debt:'Senior debt',guarantee_provision:'Guarantee provision',grant_cofinancing:'Grant co-financing'};
export function legacyMatchedInstruments(value:string|null|undefined){return value==='either'?Object.keys(MATCHED_INSTRUMENTS):value==='equity'?['equity']:[];}
export function matchedInstrumentIntersection(selected:readonly string[],accepted:readonly string[]){return selected.some(value=>accepted.includes(value)&&Object.hasOwn(MATCHED_INSTRUMENTS,value));}
