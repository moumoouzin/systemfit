
import { User } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Shield, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User;
}

const UserAvatar = ({ user }: UserAvatarProps) => {
  // Calculate XP progress percentage for current level
  const xpForNextLevel = 200;
  const xpProgress = (user.xp / xpForNextLevel) * 100;

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
            {user.level}
          </div>
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <div className="flex items-center mt-1 text-sm text-muted-foreground">
            <span className="font-medium">{user.xp} / {xpForNextLevel} XP</span>
            <span className="mx-2">•</span>
            <span>Nível {user.level}</span>
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
                className="w-full h-2" 
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
