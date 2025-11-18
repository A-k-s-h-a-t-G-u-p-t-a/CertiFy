// "use client";
// import { useState } from "react";
// import { useTranslation } from "react-i18next";

// const languages = [
//   { code: "en", name: "English" },
//   { code: "hi", name: "[translate:हिंदी]" },
//   { code: "bn", name: "[translate:বাংলা]" },
//   { code: "or", name: "[translate:ଓଡ଼ିଆ]" },
//   { code: "mai", name: "[translate:मैथिली]" },
//   { code: "sat", name: "[translate:संताली]" },
//   { code: "hoc", name: "[translate:हो]" },
//   { code: "unr", name: "[translate:मुंडारी]" },
//   { code: "kru", name: "[translate:कुरुख]" },
//   { code: "mag", name: "[translate:मगही]" },
// ];

// export default function LocaleSwitcher() {
//   const { i18n } = useTranslation();
//   const [currentLang, setCurrentLang] = useState(i18n.language || "en");

//   const changeLanguage = (e) => {
//     const lang = e.target.value;
//     i18n.changeLanguage(lang);
//     setCurrentLang(lang);
//   };

//   return (
//     <select value={currentLang} onChange={changeLanguage} className="p-2 rounded border">
//       {languages.map(({ code, name }) => (
//         <option key={code} value={code}>
//           {name}
//         </option>
//       ))}
//     </select>
//   );
// }
