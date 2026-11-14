export const publicPractices = new Map([["real-estate","/opportunities"], ["horeca","/horeca"]]);

export function advertisingEvent({id, label, event, practice, granted, interests, token}) {
  if (!/^AW-[1-9]\d{4,15}$/.test(id || "") || !granted || !publicPractices.has(practice) ||
    !Array.isArray(interests) || !interests.includes(practice)) return null;
  if (event === "view") return ["event","page_view",{send_to:id,page_location:"https://indiagully.com"+publicPractices.get(practice)}];
  if (event === "enquiry" && /^[A-Za-z0-9_-]{3,80}$/.test(label || "") && /^[a-f0-9]{64}$/.test(token || ""))
    return ["event","conversion",{send_to:id+"/"+label,transaction_id:token,page_location:"https://indiagully.com/contact"}];
  return null;
}
