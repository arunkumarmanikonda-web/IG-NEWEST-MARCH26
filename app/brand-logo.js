export default function BrandLogo({light=false,symbol=false,className='',decorative=false}){
 return <img className={'brand-artwork '+className} src={'/brand/'+(symbol?'mark':light?'logo-white':'logo-dark')+'.svg'} alt={decorative?'':'India Gully. Celebrating Desiness.'} aria-hidden={decorative||undefined} width={symbol?275:2048} height={symbol?424:477}/>;
}
