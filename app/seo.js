import {structuredData,jsonLd} from '../lib/seo.mjs';
import {headers} from 'next/headers';
export default async function Seo({path}){const data=structuredData(path);return data?<script nonce={(await headers()).get('x-nonce')} type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(data)}}/>:null;}
