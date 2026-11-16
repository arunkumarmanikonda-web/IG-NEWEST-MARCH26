import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogueProduct, catalogueResults } from "../lib/catalogue-results.mjs";
import { addProduct } from "../lib/procurement.mjs";

const products = Array.from({length: 325}, (_, index) => ({
  id: String(index), title: "Product " + index, slug: "sku-" + index, summary: "", tags: [{label:"Tableware"}],
  public_data: {brand:index%2?"Ariane":"Other",sku:"ABC-"+index,category:index%2?"Crockery":"Linen",moq:12,pack_size:6,uom:"pieces"},
}));
test("Priority positions apply across catalogue pages and respect search and explicit sort", () => {
  const priorities = [{content_id:"324",slot:2},{content_id:"311",slot:1}];
  assert.deepEqual(catalogueResults(products, priorities,"","priority").slice(0,3).map(p=>p.id), ["311","324","0"]);
  assert.deepEqual(catalogueResults(products, priorities,"","newest"), products);
  assert.equal(catalogueResults(products, priorities,"Ariane","priority")[0].id,"311");
  assert.deepEqual(catalogueResults(products, priorities,"ABC-324","priority").map(p=>p.id),["324"]);
  assert.equal(catalogueResults(products, priorities,"Linen","priority").some(p => p.id==="311"),false);
  assert.equal(catalogueResults(products, priorities,"","name")[0].title,"Product 0");
  assert.deepEqual(catalogueResults(products, [],"","priority"),products);
  assert.equal(new Set(catalogueResults(products, priorities,"","priority").map(p=>p.id)).size,products.length);
  assert.equal(products[0].id,"0");
});
test("Lightweight catalogue projection retains RFQ order quantities and public searchable information", () => {
  const product=catalogueProduct({...products[311],id:"11111111-1111-1111-1111-111111111111",body:"long specifications",public_data:{...products[311].public_data,image:"/catalogue/source.jpg"}});
  const basket=addProduct([],product);
  assert.equal(basket[0].quantity,12);
  assert.equal(basket[0].uom,"pieces");
  assert.equal(addProduct(basket,product)[0].quantity,18);
  assert.equal(product.public_data.image,"/catalogue/source.jpg");
  assert.equal("body" in product,false);
  assert.equal(catalogueResults([product],[],"tableware","name").length,1);
});
