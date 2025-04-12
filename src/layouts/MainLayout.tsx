
import { PropsWithChildren } from "react";
import MainNav from "@/components/MainNav";

const MainLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:py-6">
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">SystemFit</h1>
          <p className="text-sm text-muted-foreground">Fitness RPG</p>
        </div>
        <MainNav />
      </div>
      <div className="flex-1 md:py-6 pb-16 md:pb-6">
        <main className="px-4 md:px-6 max-w-4xl mx-auto">
          {children}
        </main>
      </div>
      <div className="md:hidden block">
        <MainNav />
      </div>
    </div>
  );
};

export default MainLayout;
