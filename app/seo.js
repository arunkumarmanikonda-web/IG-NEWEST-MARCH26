import {structuredData,jsonLd} from '../lib/seo.mjs';
export default function Seo({path}){const data=structuredData(path);return data?<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(data)}}/>:null;}
