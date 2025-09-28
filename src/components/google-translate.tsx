"use client"

import { useState, useEffect } from "react"
import { Globe, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Language {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ur", name: "اُردُو", flag: "🇵🇰" },
  { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  { code: "or", name: "ଓଡ଼ିଆ", flag: "🇮🇳" },
]

export default function GoogleTranslate() {
  const [currentLang, setCurrentLang] = useState<Language>(languages[0])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Prevent duplicate script
    if (!document.querySelector("#google-translate-script")) {
      const script = document.createElement("script")
      script.id = "google-translate-script"
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      script.async = true
      document.body.appendChild(script)
    }

    // Callback before script loads
    ;(window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: languages.map((l) => l.code).join(","),
          autoDisplay: false,
        },
        "google_translate_element"
      )
    }
  }, [])

  const handleLanguageChange = (language: Language) => {
    setCurrentLang(language)

    const selectElement = document.querySelector(
      ".goog-te-combo"
    ) as HTMLSelectElement | null

    if (selectElement) {
      selectElement.value = language.code
      selectElement.dispatchEvent(new Event("change"))
    }
  }

  return (
    <div className="relative">
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" className="hidden"></div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
            <Globe className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {currentLang.flag} {currentLang.name}
            </span>
            <span className="sm:hidden">{currentLang.flag}</span>
            <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base">{language.flag}</span>
              <span className="text-sm">{language.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hide Google Translate banner + toolbar using dangerouslySetInnerHTML */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .goog-te-banner-frame { display: none !important; }
            .goog-te-gadget-simple { display: none !important; }
            body { top: 0 !important; }
            iframe.goog-te-banner-frame { display: none !important; }
            .goog-te-menu-frame { box-shadow: none !important; }
          `,
        }}
      />
    </div>
  )
}


// "use client"

// import { useState, useEffect } from "react"
// import { Globe, ChevronDown } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

// interface Language {
//   code: string
//   name: string
//   flag: string
// }

// const languages: Language[] = [
//   { code: "en", name: "English", flag: "🇺🇸" },
//   { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
//   { code: "ur", name: "اُردُو", flag: "🇵🇰" },
//   { code: "bn", name: "বাংলা", flag: "🇧🇩" },
//   { code: "or", name: "ଓଡ଼ିଆ", flag: "🇮🇳" },
// ]

// export default function GoogleTranslate() {
//   const [currentLang, setCurrentLang] = useState<Language>(languages[0])

//   useEffect(() => {
//     if (typeof window === "undefined") return

//     // Prevent duplicate script
//     if (!document.querySelector("#google-translate-script")) {
//       const script = document.createElement("script")
//       script.id = "google-translate-script"
//       script.src =
//         "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
//       script.async = true
//       document.body.appendChild(script)
//     }

//     // Define callback before script loads
//     ;(window as any).googleTranslateElementInit = () => {
//       new (window as any).google.translate.TranslateElement(
//         {
//           pageLanguage: "en",
//           includedLanguages: languages.map((l) => l.code).join(","),
//           autoDisplay: false,
//         },
//         "google_translate_element"
//       )
//     }
//   }, [])

//   const handleLanguageChange = (language: Language) => {
//     setCurrentLang(language)

//     const selectElement = document.querySelector(
//       ".goog-te-combo"
//     ) as HTMLSelectElement | null

//     if (selectElement) {
//       selectElement.value = language.code
//       selectElement.dispatchEvent(new Event("change"))
//     }
//   }

//   return (
//     <div className="relative">
//       {/* Hidden Google Translate element */}
//       <div id="google_translate_element" className="hidden"></div>

//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button
//             variant="ghost"
//             size="sm"
//             className="h-9 px-3 text-sm font-medium"
//           >
//             <Globe className="h-4 w-4 mr-2" />
//             <span className="hidden sm:inline">
//               {currentLang.flag} {currentLang.name}
//             </span>
//             <span className="sm:hidden">{currentLang.flag}</span>
//             <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent
//           align="end"
//           className="w-48 max-h-64 overflow-y-auto"
//         >
//           {languages.map((language) => (
//             <DropdownMenuItem
//               key={language.code}
//               onClick={() => handleLanguageChange(language)}
//               className="flex items-center gap-2 cursor-pointer"
//             >
//               <span className="text-base">{language.flag}</span>
//               <span className="text-sm">{language.name}</span>
//             </DropdownMenuItem>
//           ))}
//         </DropdownMenuContent>
//       </DropdownMenu>

//       {/* Hide Google Translate banner + toolbar */}
//       <style jsx global>{`
//         .goog-te-banner-frame {
//           display: none !important;
//         }
//         .goog-te-gadget-simple {
//           display: none !important;
//         }
//         body {
//           top: 0 !important;
//         }
//         iframe.goog-te-banner-frame {
//           display: none !important;
//         }
//         .goog-te-menu-frame {
//           box-shadow: none !important;
//         }
//       `}</style>
//     </div>
//   )
// }


