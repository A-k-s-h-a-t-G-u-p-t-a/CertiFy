// //For dynamic data coming in English only from backend
// export async function translateDynamic(text, targetLang) {
//   if (targetLang === "en") return text; // no translation needed

//   const response = await fetch("https://libretranslate.de/translate", {
//     method: "POST",
//     body: JSON.stringify({
//       q: text,
//       source: "en",
//       target: targetLang,
//       format: "text"
//     }),
//     headers: { "Content-Type": "application/json" }
//   });

//   if (!response.ok) return text;
//   const data = await response.json();
//   return data.translatedText;
// }

