import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, BookOpen, Clock, Users, Shield } from "lucide-react";

type SOP = {
  id: string;
  sopCode: string;
  title: string;
  category: string;
  targetRole: string;
  description: string;
  estimatedTimeMinutes: number;
  requiredEquipment: string[];
  safetyRequirements: string[];
  language: string;
  version: string;
  isActive: boolean;
  createdAt: string;
};

export default function SOPsPage() {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: sops, isLoading } = useQuery<SOP[]>({
    queryKey: ["/api/sops"],
  });

  const filteredSOPs = sops?.filter((sop) => {
    const matchesSearch = sop.sopCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sop.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || sop.category === categoryFilter;
    const matchesRole = roleFilter === "all" || sop.targetRole === roleFilter;
    const matchesLanguage = sop.language === language || sop.language === "en";
    return matchesSearch && matchesCategory && matchesRole && matchesLanguage && sop.isActive;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "wash": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "maintenance": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "safety": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "inspection": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t("sops")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("standardOperatingProcedures")}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchSOPs")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-sops"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
                <SelectValue placeholder={t("allCategories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                <SelectItem value="wash">Wash</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-role-filter">
                <SelectValue placeholder={t("allRoles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allRoles")}</SelectItem>
                <SelectItem value="all">All Staff</SelectItem>
                <SelectItem value="mechanic">Mechanic</SelectItem>
                <SelectItem value="wash_staff">Wash Staff</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
            <Button data-testid="button-add-sop">
              <Plus className="h-4 w-4 mr-2" />
              {t("addSOP")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SOPs Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
      ) : filteredSOPs && filteredSOPs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSOPs.map((sop) => (
            <Card key={sop.id} className="hover-elevate" data-testid={`card-sop-${sop.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm">{sop.sopCode}</CardTitle>
                  </div>
                  <Badge className={getCategoryColor(sop.category)} data-testid={`badge-category-${sop.id}`}>
                    {sop.category}
                  </Badge>
                </div>
                <p className="text-base font-semibold mt-2">{sop.title}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{sop.description}</p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{sop.targetRole.replace("_", " ")}</span>
                  </div>
                  {sop.estimatedTimeMinutes && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{sop.estimatedTimeMinutes} min</span>
                    </div>
                  )}
                  {sop.safetyRequirements && sop.safetyRequirements.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Shield className="h-3.5 w-3.5 text-red-500" />
                      <span>{sop.safetyRequirements.length} safety req.</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>v{sop.version}</span>
                  <span>{sop.language.toUpperCase()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("noSOPsFound")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
