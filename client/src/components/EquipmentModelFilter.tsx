import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import type { EquipmentModelInfo } from "@/hooks/useEquipmentModels";

type EquipmentModelFilterProps = {
  models: EquipmentModelInfo[];
  value: string;
  onChange: (value: string) => void;
  includeAllOption?: boolean;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
};

export function EquipmentModelFilter({
  models,
  value,
  onChange,
  includeAllOption = true,
  placeholder,
  className = "w-[200px]",
  isLoading = false,
}: EquipmentModelFilterProps) {
  const { language } = useLanguage();

  const defaultPlaceholder = language === "am" ? "ሁሉም ሞዴሎች" : "All Models";

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className={className} data-testid="select-equipment-model-filter">
        <SelectValue placeholder={placeholder || defaultPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && (
          <SelectItem value="all" data-testid="option-model-all">
            {language === "am" ? "ሁሉም ሞዴሎች" : "All Models"}
          </SelectItem>
        )}
        {models.map((modelInfo) => (
          <SelectItem 
            key={modelInfo.model} 
            value={modelInfo.model}
            data-testid={`option-model-${modelInfo.model}`}
          >
            {modelInfo.model} ({modelInfo.make}) - {modelInfo.count}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
