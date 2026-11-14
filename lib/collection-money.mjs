export const collectionMoney = (value) => new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR'}).format(value/100);
