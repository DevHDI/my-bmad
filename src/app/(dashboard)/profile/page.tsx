"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Shield } from "lucide-react";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="mesh-gradient min-h-full">
        <div className="space-y-8 pt-6 lg:pt-8">
        <Skeleton className="h-8 w-48" />
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  const { name, email, image, role, createdAt } = session.user;

  const formattedDate = createdAt
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(createdAt))
    : null;

  return (
    <div className="mesh-gradient min-h-full">
      <div className="space-y-8 pt-6 lg:pt-8">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {image && <AvatarImage src={image} alt={name ?? ""} />}
              <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {role && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="size-4 text-muted-foreground" />
                <Badge variant={role === "admin" ? "default" : "secondary"}>
                  {role}
                </Badge>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                <span>Member since {formattedDate}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
