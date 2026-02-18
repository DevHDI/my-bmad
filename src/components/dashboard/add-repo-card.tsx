"use client";

import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { AddRepoDialog } from "@/components/layout/add-repo-dialog";
import Image from "next/image";

export function AddRepoCard() {
  return (
    <AddRepoDialog
      trigger={
        <Card className="glass-card hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer aspect-square flex items-center justify-center border-dashed border-2 border-border/50 hover:border-primary/30 p-8">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Image src="/logo_mybmad.png" alt="MyBMAD" width={96} height={96} />
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add a project</span>
          </div>
        </Card>
      }
    />
  );
}
