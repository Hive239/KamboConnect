import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GlobeIcon, Check } from "@/lib/icons";
import { LANGUAGES, setLanguage } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.split("-")[0] || "en";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("common.language")}>
          <GlobeIcon className="h-5 w-5" weight="duotone" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} className="cursor-pointer justify-between gap-6" onClick={() => setLanguage(l.code)}>
            {l.label}
            {current === l.code && <Check className="h-4 w-4 text-primary" weight="bold" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
