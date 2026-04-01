"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listRepoBranches, updateRepoBranch } from "@/actions/repo-actions";

interface RepoSettingsModalProps {
  owner: string;
  name: string;
  currentBranch: string;
}

export function RepoSettingsModal({
  owner,
  name,
  currentBranch,
}: RepoSettingsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(currentBranch);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenChange(nextOpen: boolean) {
    if (saving) return;
    setOpen(nextOpen);
    setError(null);

    if (nextOpen) {
      setSelectedBranch(currentBranch);
      setLoading(true);
      const result = await listRepoBranches({ owner, name });
      setLoading(false);
      if (result.success) {
        setBranches(result.data);
      } else {
        setError(result.error);
      }
    }
  }

  async function handleSave() {
    if (selectedBranch === currentBranch) {
      setOpen(false);
      return;
    }

    setSaving(true);
    setError(null);
    const result = await updateRepoBranch({
      owner,
      name,
      branch: selectedBranch,
    });
    setSaving(false);

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  const hasChanges = selectedBranch !== currentBranch;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project settings</DialogTitle>
          <DialogDescription>
            Configure the tracked branch for{" "}
            <strong>
              {owner}/{name}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="text-sm font-medium">Branch</label>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading branches...
            </div>
          ) : (
            <Select
              value={selectedBranch}
              onValueChange={setSelectedBranch}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !hasChanges}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
