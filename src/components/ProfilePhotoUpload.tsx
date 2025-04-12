
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2 } from "lucide-react";

const ProfilePhotoUpload = () => {
  const { profile, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log('Uploading avatar:', { fileName, filePath });
      
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL for the file
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      if (!data) {
        throw new Error('Could not get public URL for avatar.');
      }
      
      const avatarUrl = data.publicUrl;
      console.log('Avatar URL:', avatarUrl);
      
      // Update profile with new avatar URL
      await updateProfile({
        avatar_url: avatarUrl,
      });
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso.",
      });
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <Avatar className="h-20 w-20 relative">
        <AvatarImage src={profile?.avatarUrl} alt={profile?.name} />
        <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div>
        <h3 className="text-lg font-medium">Foto de perfil</h3>
        <p className="text-sm text-muted-foreground">
          Esta imagem será exibida em seu perfil.
        </p>
        <div className="mt-2 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={uploading}
            className="relative overflow-hidden"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Alterar
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoUpload;
