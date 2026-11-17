import Link from "next/link";
import "./priority-products.css";

export default function PriorityProducts({ products, preview = false }) {
  const Card = preview ? "div" : Link;
  return <ul className="horeca-priority-products">
    {products.map(product => {
      const d = product.public_data;
      return <li key={product.id}><Card className="priority-product-card" {...(!preview && {href:"/horeca/products/" + product.slug})}>
        {d.image && <img alt="" src={d.image} width={82} height={82} loading="lazy" />}
        <div>
          {(d.brand || d.category || d.sector) && <span className="priority-product-brand">{d.brand || d.category || d.sector}</span>}
          <h3>{product.title}</h3>
          {d.sku && <span className="priority-product-sku">SKU {d.sku}</span>}
        </div>
      </Card></li>;
    })}
  </ul>;
}
