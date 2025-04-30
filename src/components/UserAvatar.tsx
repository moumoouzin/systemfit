
import { User } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Shield, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { calculateLevel } from "@/contexts/profile";

interface UserAvatarProps {
  user: User;
}

const UserAvatar = ({ user }: UserAvatarProps) => {
  const { updateProfile } = useAuth();
  const xpForNextLevel = 200;
  const [displayedLevel, setDisplayedLevel] = useState(user.level);
  const [displayedXP, setDisplayedXP] = useState(user.xp);
  
  // Check if user XP matches the current level
  useEffect(() => {
    // Calculate what the level should be based on current XP
    const correctLevel = calculateLevel(user.xp);
    
    // If there's a mismatch between stored level and calculated level
    if (correctLevel !== user.level) {
      console.log(`Level mismatch detected: stored ${user.level}, calculated ${correctLevel}`);
      
      // Update the user's level in the database to match XP
      updateProfile({ 
        level: correctLevel,
      }).catch(error => {
        console.error("Failed to update level:", error);
      });
      
      setDisplayedLevel(correctLevel);
    } else {
      setDisplayedLevel(user.level);
      setDisplayedXP(user.xp);
    }
  }, [user.xp, user.level, updateProfile]);

  // Calculate XP progress percentage for current level
  const xpProgress = Math.min(
    ((displayedXP % xpForNextLevel) / xpForNextLevel) * 100,
    100
  );

  return (
    <div className="rpg-card mb-6">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary animate-pulse-glow">
            <img 
              src={user.avatarUrl || "/placeholder.svg"} 
              alt={user.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-rpg-gold text-white font-bold rounded-full w-10 h-10 flex items-center justify-center border-2 border-white animate-level-up">
            {displayedLevel}
          </div>
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <div className="flex items-center mt-1 text-sm text-muted-foreground">
            <span className="font-medium">
              {displayedXP % xpForNextLevel} / {xpForNextLevel} XP
            </span>
            <span className="mx-2">•</span>
            <span>Nível {displayedLevel}</span>
            <span className="mx-2">•</span>
            <span>Sequência: {user.streakDays} dias</span>
          </div>
          
          <div className="mt-2">
            <Progress value={xpProgress} className="h-2 bg-gray-200" />
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="flex flex-col items-center text-rpg-strength">
              <Shield size={18} />
              <span className="text-xs font-medium">Força</span>
              <Progress 
                value={(user.attributes.strength/10)*100} 
                className={cn("w-full h-2", "bg-rpg-strength/20")}
              />
            </div>
            
            <div className="flex flex-col items-center text-rpg-vitality">
              <Zap size={18} />
              <span className="text-xs font-medium">Vigor</span>
              <Progress 
                value={(user.attributes.vitality/10)*100} 
                className={cn("w-full h-2", "bg-rpg-vitality/20")}
              />
            </div>
            
            <div className="flex flex-col items-center text-rpg-focus">
              <Brain size={18} />
              <span className="text-xs font-medium">Foco</span>
              <Progress 
                value={(user.attributes.focus/10)*100} 
                className={cn("w-full h-2", "bg-rpg-focus/20")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAvatar;
