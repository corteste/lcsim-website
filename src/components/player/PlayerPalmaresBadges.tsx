import React from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Shield, Award, Star, Crown, Target, Sparkles } from "lucide-react";
import { PlayerPalmares } from "@/services/playerPalmaresService";

interface PlayerPalmaresBadgesProps {
  palmares?: PlayerPalmares | null;
  className?: string;
  onClickPalmaresTab?: () => void;
}

export const PlayerPalmaresBadges: React.FC<PlayerPalmaresBadgesProps> = ({
  palmares,
  className = "",
  onClickPalmaresTab,
}) => {
  if (!palmares || (palmares.totalTrophiesCount === 0 && palmares.totwCount === 0)) {
    return null;
  }

  const { scudettiCount, supercoppeCount, individualAwardsCount, hallOfFame } = palmares;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className} ${
        onClickPalmaresTab ? "cursor-pointer" : ""
      }`}
      onClick={onClickPalmaresTab}
      title={onClickPalmaresTab ? "Clicca per visualizzare la bacheca completa" : undefined}
    >
      {/* Hall of Fame Badge */}
      {hallOfFame && (
        <Badge
          variant="outline"
          className="bg-amber-500/20 text-amber-500 border-amber-500/40 text-xs font-black px-2.5 py-0.5 shadow-sm flex items-center gap-1"
        >
          <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />
          <span>Hall of Fame ({hallOfFame.inductionClass})</span>
        </Badge>
      )}

      {/* Scudetti Badge */}
      {scudettiCount > 0 && (
        <Badge
          variant="outline"
          className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 shadow-sm flex items-center gap-1"
        >
          <Trophy className="h-3 w-3 text-emerald-500" />
          <span>
            {scudettiCount === 1 ? "1 Scudetto" : `${scudettiCount} Scudetti`}
          </span>
        </Badge>
      )}

      {/* Supercoppe Badge */}
      {supercoppeCount > 0 && (
        <Badge
          variant="outline"
          className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-bold px-2.5 py-0.5 shadow-sm flex items-center gap-1"
        >
          <Shield className="h-3 w-3 text-blue-500" />
          <span>
            {supercoppeCount === 1 ? "1 Supercoppa" : `${supercoppeCount} Supercoppe`}
          </span>
        </Badge>
      )}

      {/* Individual Awards Badge */}
      {individualAwardsCount > 0 && (
        <Badge
          variant="outline"
          className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold px-2.5 py-0.5 shadow-sm flex items-center gap-1"
        >
          <Award className="h-3 w-3 text-amber-500" />
          <span>
            {individualAwardsCount === 1 ? "1 Titolo Ind." : `${individualAwardsCount} Titoli Ind.`}
          </span>
        </Badge>
      )}
    </div>
  );
};
