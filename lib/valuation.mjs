export const MODEL_VERSION = 'IG-VAL-1.0.0';
export class InputError extends Error {
  constructor(field, message) { super(message); this.field = field; this.name = 'InputError'; }
}
function number(input, key, min, max, integer = false) {
  const value = input[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new InputError(key, 'Enter a finite number.');
  if (value < min || value > max || (integer && !Number.isInteger(value))) throw new InputError(key, `Enter ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}.`);
  return value;
}
const cash = (i,k) => number(i,k,0,1e8) * 100000; // user input: INR lakh; calculation: INR
export function calculate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('input','A calculation object is required.');
  const common = { modelVersion:MODEL_VERSION, currency:'INR', calculatedAt:new Date().toISOString(), indicative:true };
  if (input.method === 'income') {
    const noi=cash(input,'noi'), reserve=cash(input,'reserve'), capRate=number(input,'capRate',0.01,100)/100;
    if (reserve > noi) throw new InputError('reserve','Reserve cannot exceed NOI in this income model.');
    const adjustedNoi=noi-reserve;
    return {...common,method:'income',value:adjustedNoi/capRate,valueLabel:'Indicative property value',noi,reserve,adjustedNoi,capRate,
      assumptions:['NOI already reflects vacancy and operating expenses.','Capital reserve is deducted once, before capitalisation.','No debt, transfer taxes or acquisition costs are included.'],
      sensitivity:[-1,-0.5,0,0.5,1].map(delta=>({rate:(capRate*100)+delta})).filter(x=>x.rate>0).map(x=>({...x,value:adjustedNoi/(x.rate/100)}))};
  }
  if (input.method === 'dcf') {
    const year1=cash(input,'year1'), growth=number(input,'growth',-50,50)/100, discount=number(input,'discount',0,100)/100,
      exitCap=number(input,'exitCap',0.01,100)/100, exitCost=number(input,'exitCost',0,25)/100, years=number(input,'years',1,30,true);
    const schedule=Array.from({length:years},(_,i)=>{const year=i+1,cashFlow=year1*(1+growth)**i;return {year,cashFlow,discountFactor:1/(1+discount)**year,presentValue:cashFlow/(1+discount)**year};});
    const exitNoi=year1*(1+growth)**years, terminalGross=exitNoi/exitCap, terminalCosts=terminalGross*exitCost,
      terminalNet=terminalGross-terminalCosts, terminalPv=terminalNet/(1+discount)**years, cashFlowPv=schedule.reduce((s,x)=>s+x.presentValue,0), value=cashFlowPv+terminalPv;
    return {...common,method:'dcf',value,valueLabel:'Indicative unlevered value',year1,growth,discount,exitCap,exitCost,years,schedule,exitNoi,terminalGross,terminalCosts,terminalNet,terminalPv,cashFlowPv,terminalShare:value===0?0:terminalPv/value,
      assumptions:['Year 1 is exactly the entered cash flow, received at year end.','Enter cash flow after operating costs, vacancy and recurring capital reserves.','Terminal value uses Year N+1 cash flow and is discounted from the end of Year N.','Growth also applies to Year N+1. Debt, acquisition costs and income taxes are excluded.']};
  }
  if (input.method === 'hotel') {
    const keys=number(input,'keys',1,100000,true), adr=number(input,'adr',0,10000000), occupancy=number(input,'occupancy',0,100)/100,
      fbShare=number(input,'fbShare',0,500)/100, margin=number(input,'margin',0,100)/100, multiple=number(input,'multiple',0.1,100),debt=cash(input,'debt'),surplusCash=cash(input,'surplusCash');
    const roomRevenue=keys*adr*occupancy*365,fbRevenue=roomRevenue*fbShare,revenue=roomRevenue+fbRevenue,ebitda=revenue*margin,value=ebitda*multiple,equity=value-debt+surplusCash;
    return {...common,method:'hotel',value,valueLabel:'Indicative enterprise value',keys,adr,occupancy,roomRevenue,fbRevenue,revenue,ebitda,multiple,debt,surplusCash,equity,revpar:adr*occupancy,
      assumptions:['365 operating days. F&B revenue is expressed as a share of room revenue.','EBITDA margin applies to room and F&B revenue combined.','Enterprise value is not a standalone property valuation. Lease/rent treatment and other liabilities require review.','Equity bridge deducts entered debt and adds surplus cash only. Other adjustments are excluded.']};
  }
  throw new InputError('method','Choose income, dcf or hotel.');
}
