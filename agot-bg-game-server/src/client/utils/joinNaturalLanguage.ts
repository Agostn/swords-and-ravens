import { t } from "../i18n/i18n";
export default function joinNaturalLanguage(items: any[]): string {
    return items.join(', ').replace(/, ([^,]*)$/, ` ${t("common.and")} $1`);
}