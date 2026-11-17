const paths={
 lighting:'M32 5v12M22 17h20l10 24H12l10-24ZM25 47h14M32 41v6M15 49l-4 5M49 49l4 5M32 53v6',
 'in-room':'M9 37h46v18M9 55V25h46v12M9 48h46M15 37v-8h14v8M35 37v-8h14v8M19 17h26M32 9v8',
 cutlery:'M16 8v17c0 8 12 8 12 0V8M22 8v47M44 55V9c-8 6-11 15-10 25h10',
 crockery:'M55 32a23 23 0 1 1-46 0 23 23 0 1 1 46 0ZM48 32a16 16 0 1 1-32 0 16 16 0 1 1 32 0Z',
 glassware:'M22 7h20l3 17c2 12-28 12-26 0l3-17ZM32 34v21M23 56h18M20 21h24',
 hollowware:'M18 24h25l4 29H15l3-29ZM20 18h21M25 13h11M46 29h6c9 0 8 17-6 17M17 26 9 20 5 23l11 15',
 'kitchen-equipment':'M9 11h46v44H9zM9 23h46M17 16h1M28 16h1M40 16h1M49 16h1M16 30h32v18H16zM16 39h32',
 linen:'M13 13h35v40H13c-8 0-8-12 0-12h35M13 13c-8 0-8 12 0 12h35M17 13v28M24 47h19M24 19h18',
 housekeeping:'M15 9h8v9h-8zM13 24h12l4 29H9l4-29ZM40 8v32M34 40h12l8 14H26l8-14ZM13 35h13',
 'banquet-buffet':'M7 43h50M12 42a20 20 0 0 1 40 0M28 16h8M32 16v6M12 49h40M17 49v7M47 49v7',
 furniture:'M16 9h32v25H16zM12 34h40v9H12zM16 43v13M48 43v13M23 9v25M41 9v25',
 bathroom:'M11 30h42v9c0 11-42 11-42 0v-9ZM16 30V15c0-10 17-10 17 0M28 15h10M18 48v7M46 48v7M30 21v2M36 21v2',
 other:'M12 16h40v38H12zM12 29h40M24 16V9h16v7M26 38h12',
};
export default function CategoryIcon({id}){return <svg className="horeca-category-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[id]||paths.other}/></svg>;}
