// Social turns need no property record or web source. Match whole messages so a
// greeting before a substantive question never swallows the actual question.
function clean(value){
 return String(value||"").normalize("NFKC").toLowerCase().replace(/[’']/g,"").replace(/[^\p{L}\p{M}\p{N}\s]/gu," ").replace(/\bgullu\b|गुल्लू/gu," ").replace(/\s+/g," ").trim();
}
const yes=/^(?:(?:ha+n?|haan|ha|han)\s*(?:jee|ji)?|ji\s*(?:haan|ha)?|yes(?: please)?|sure|please do|go ahead|yep|yup|bilkul|हाँ(?: जी)?|हां(?: जी)?|जी हाँ|हांजी)$/u;
export const isAssent=text=>yes.test(clean(text));
const handoffOffer=/(?:would you like (?:our|the) team to (?:check (?:it|that)(?: for you)?|contact you|follow up(?: with you)?)|should i (?:ask|connect).*team|team se follow.?up karwaun|टीम से जोड़ूँ)\??$/iu;
export const acceptsFollowup=(question,previous)=>isAssent(question)&&handoffOffer.test(previous?.answer||"");
const offer=(en,mix,hi,lang)=>lang==="Hindi"?hi:lang==="Hinglish"?mix:en;
const socialHinglish=/\b(?:kya|kaise|kaisi|haal|batao|bataiye|chahiye|dikhao|kaun|mein|mujhe|aap|aur|hai|hain|hinglish|hanji|haanji|ha+nji|bilkul|theek|yaar|shukriya|sahi|achha|accha|mazaak|sunao)\b/i;
export function conversationLanguage(question,history=[],requested){
 if(["English","Hindi","Hinglish"].includes(requested))return requested;
 const detect=s=>/[\u0900-\u097f]/u.test(s)?"Hindi":socialHinglish.test(s)?"Hinglish":/\b(?:who|what|where|when|how|could|please|tell|looking|want)\b/i.test(s)?"English":null;
 return detect(question)||history.slice().reverse().map(h=>detect(h.question)).find(Boolean)||"English";
}
export function socialReply(question,history=[],language="English"){
 const q=clean(question),last=history.at(-1),say=(en,mix,hi)=>offer(en,mix,hi,language);
 const response=answer=>({answer,sources:[],practice_interest:last?.sources?.length?last.practice_interest||"General enquiry":"General enquiry"});
 // Rotate only when a phrase was already used in this chat. No cross-visitor memory.
 const fresh=(...options)=>options.find(a=>!history.some(t=>t.answer===a))||options[history.length%options.length];
 if(/^(?:who are you|what are you|are you (?:a )?(?:bot|human|ai|real person)|tum kaun ho|aap kaun ho|तुम कौन हो|क्या तुम इंसान हो)$/u.test(q))
  return response(say("I’m Gullu, your India Gully buddy. An AI, with a desi streak. What’s on your mind?","Main Gullu, aapka India Gully buddy! AI hoon, andaaz desi hai. Boliye?","मैं गुल्लू, आपका India Gully buddy! AI हूँ, अंदाज़ देसी है। बताइए?"));
 if(/^(?:i )?(?:love you|luv you|love u|luv u|youre the best|you are the best|pyaar tumse|tumse pyaar hai|आपसे प्यार है)$/u.test(q))
  return response(fresh(say("That’s kind of you! Gullu’s sending a little extra cheer your way.","Arre wah, itna pyaar! Gullu ki taraf se dher saari good vibes.","अरे वाह, इतना प्यार! गुल्लू की तरफ़ से ढेर सारी शुभकामनाएँ।"),say("You’ve brought the good vibes to this gully!","Aaj toh gully mein good vibes ki baarish hai!","आज तो गली में खुशियों की बारिश है!")));
 if(/^(?:no|nope|nah|nahi|nahin|nahi ji|not now|no thanks|नहीं|नहीं जी)$/u.test(q))
  return response(say("No problem. What would work better for you?","Koi baat nahi. Aap bataiye, kya better rahega?","कोई बात नहीं। आपके लिए क्या बेहतर रहेगा?"));
 if(/^(?:thats wrong|that is wrong|wrong|not what i (?:asked|meant)|you misunderstood|galat|galat hai|गलत है)$/u.test(q))
  return response(say("Let me get this right. Which part did I misunderstand?","Chaliye, sahi karte hain. Maine kaunsi baat galat samjhi?","चलिए, सही करते हैं। मैंने कौन सी बात गलत समझी?"));
 if(/^(?:you are (?:funny|cool|awesome)|youre (?:funny|cool|awesome)|nice one|mast|badhiya|badiya|बहुत बढ़िया)$/u.test(q))
  return response(fresh(say("I’ll take that! What’s next?","Arre wah, din ban gaya! Aage kya dekhein?","अरे वाह! आगे क्या देखें?"),say("Gully approved, then!","Toh phir, gully approved!","तो फिर, गली की मुहर लग गई!")));
 if(/^(?:(?:hey|arre|arey|hello|hi|yaar) )?(?:what ?s up|wassup|sup|how are (?:you|things)|how s it going|hows it going|kya (?:ho\s*(?:raha|rha)|chal\s*(?:raha|rha)) (?:hai|h)|kya scene hai|kaise ho|kaisi ho|kaisa hai|kya haal(?: hai)?|aur sunao|क्या (?:हो|चल) रहा है|कैसे हो)(?: (?:yaar|buddy|man|aaj|today))?$/iu.test(q))
  return response(fresh(say("All good in the gully! Ready for a proper chat.","Bas, gully mein mast hoon! Aap sunao, aaj kya chal raha hai?","बस, गली में मस्त हूँ! आप सुनाइए, आज क्या चल रहा है?"),say("Gullu’s on duty, good banter included. How’s your day going?","Gullu duty par hai, gupshup complimentary! Aapka din kaisa ja raha hai?","गुल्लू ड्यूटी पर है, गपशप साथ में! आपका दिन कैसा जा रहा है?"),say("Ready when you are! Business or a bit of gully gossip?","Main taiyaar hoon! Business ki baat ya thodi gupshup?","मैं तैयार हूँ! कारोबार की बात या थोड़ी गपशप?")));
 if(/^(?:(?:h[ie]+|hello+|hey+|namaste|namaskar|good morning|good evening|नमस्ते|नमस्कार)(?: ji| buddy| there| yaar| bro| dost)?)$/u.test(q))
  return response(fresh(say("Hey! Good to see you. What’s on your mind?","Namaste ji! Aaj kis baare mein baat karein?","नमस्ते जी! आज किस बारे में बात करें?"),say("Hello again! Where shall we pick up?","Arre, phir se hello! Kahan se shuru karein?","फिर से नमस्ते! कहाँ से शुरू करें?"),say("You rang? Gullu reporting!","Bulaaya aur Gullu haazir!","बुलाया और गुल्लू हाज़िर!")));
 if(!q && /gullu|गुल्लू/i.test(question))return response(say("Right here! What’s on your mind?","Haan ji, main yahin hoon! Boliye.","हाँ जी, यहीं हूँ! बताइए।"));
 if(/^(?:h|he|i|um?|uh|ह)$/u.test(q)||!q)
  return response(say("Looks like that message got cut short. Go on, I’m listening.","Lagta hai message beech mein reh gaya. Boliye, main sun raha hoon.","लगता है संदेश अधूरा रह गया। बताइए, मैं सुन रहा हूँ।"));
 if(/^(?:h+m+|huh|hmm ji|ach+h?a|accha|acha|okay|ok|theek hai|alright|हम्म|अच्छा|ठीक है)$/u.test(q))
  return response(say(last?"Take your time. We can stay with that or talk about something else.":"Take your time. I’m here.","Aaram se. Isi par baat karein ya kuch aur dekhein?","आराम से। इसी पर बात करें या कुछ और देखें?"));
 if(isAssent(question)){
  const previous=last?.answer||"";
  const prompt=previous.match(/([^.!?\n]+[?？])\s*$/u)?.[1]?.trim();
  if(prompt&&!handoffOffer.test(previous)&&/how much|which|what (?:amount|city|location|budget|timeline)|kitna|kitne|kis |kaunsa|कितन|कौन|किस/u.test(prompt.toLowerCase()))
   return response(say("Got it. ","Haan ji. ","जी। ")+prompt);
  if(/operating property|operating hotel|चालू संपत्ति/i.test(previous))return response(say("Which would you like to see first, operating hotels or development sites?","Pehle kya dekhein, operating hotels ya development sites?","पहले क्या देखें, चालू होटल या विकास के लिए साइट?"));
  return response(say("I’m all ears. What would you like to get into?","Haan ji, boliye! Koi jagah dekh rahe hain, business ki baat karein, ya bas gupshup?","हाँ जी, बताइए! कोई जगह देख रहे हैं, कारोबार की बात करें या बस गपशप?"));
 }
 if(/^(?:thanks(?: a lot)?|thank you|shukriya|dhanyavaad|धन्यवाद|शुक्रिया)(?: ji| yaar)?$/u.test(q))
  return response(say("Anytime!","Kabhi bhi, ji!","जब चाहें!"));
 if(/^(?:(?:tell me a|tell me another|another|ek|koi|ek aur) )?(?:joke|joke sunao|joke suna|chutkula sunao|चुटकुला सुनाओ)$/u.test(q))
  return response(fresh(say("Why did the samosa turn down a corner shop? It already had three good corners.","Samosa corner shop lene se kyun mana kar gaya? Bola, mere paas pehle se teen corners hain!","समोसे ने कॉर्नर शॉप क्यों छोड़ दी? बोला, मेरे पास पहले से तीन कॉर्नर हैं!"),say("My fictional business plan for a chai stall: location, location… and extra elaichi.","Mera imaginary chai-stall business plan: location, location… aur extra elaichi!","मेरे काल्पनिक चाय स्टॉल का बिज़नेस प्लान: लोकेशन, लोकेशन… और ज़्यादा इलायची!"),say("The jalebi applied for a straight answer. Still waiting.","Jalebi ne seedha jawaab maanga. Abhi tak ghoom raha hai!","जलेबी ने सीधा जवाब माँगा। अभी भी घूम रहा है!")));
 return null;
}
