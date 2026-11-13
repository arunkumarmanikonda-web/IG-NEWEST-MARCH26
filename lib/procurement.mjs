export const basketKey='ig-procurement-basket-v1';
export function normaliseBasket(value){
 if(!Array.isArray(value))return [];
 return value.slice(0,100).filter(x=>x&&typeof x.description==='string'&&x.description.trim().length>=2&&Number.isFinite(Number(x.quantity))&&Number(x.quantity)>0).map(x=>({product_id:/^[0-9a-f-]{36}$/i.test(x.product_id||'')?x.product_id:null,description:x.description.slice(0,1000),quantity:Math.min(Number(x.quantity),10000000),uom:String(x.uom||'nos').slice(0,30)}));
}
export function addProduct(basket,p){
 const size=Number(p.public_data?.pack_size)||1,minimum=Number(p.public_data?.moq)||size,quantity=Math.ceil(minimum/size)*size;
 const match=basket.find(x=>x.product_id===p.id);
 return normaliseBasket(match?basket.map(x=>x===match?{...x,quantity:x.quantity+size}:x):[...basket,{product_id:p.id,description:p.title,quantity,uom:p.public_data?.uom||'nos'}]);
}
export const inr=paise=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(paise||0)/100);
