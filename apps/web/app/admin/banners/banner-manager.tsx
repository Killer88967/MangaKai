"use client";

import { useState, useTransition } from "react";
import {
  BANNER_VARIANTS,
  type AdminBanner,
  type BannerVariant,
} from "@mangakai/shared";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createBannerAction,
  deleteBannerAction,
  updateBannerAction,
  type BannerFormInput,
} from "./actions";

const EMPTY_FORM: BannerFormInput = {
  title: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  linkLabel: "",
  variant: "info",
  active: true,
  startsAt: "",
  endsAt: "",
};

function localDateTime(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

function formFromBanner(banner: AdminBanner): BannerFormInput {
  return {
    title: banner.title,
    body: banner.body ?? "",
    imageUrl: banner.imageUrl ?? "",
    linkUrl: banner.linkUrl ?? "",
    linkLabel: banner.linkLabel ?? "",
    variant: banner.variant,
    active: banner.active,
    startsAt: localDateTime(banner.startsAt),
    endsAt: localDateTime(banner.endsAt),
  };
}

function variantClass(variant: BannerVariant): string {
  switch (variant) {
    case "warning":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "announcement":
      return "border-brand/25 bg-brand-soft text-brand-hover";

    default:
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }
}

export function BannerManager({
  initialBanners,
}: {
  initialBanners: AdminBanner[];
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [creating, setCreating] = useState(false);

  function removeBanner(id: string) {
    setBanners((current) => current.filter((banner) => banner.id !== id));
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Configured banners</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {banners.length} {banners.length === 1 ? "banner" : "banners"}
          </p>
        </div>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger render={<Button />}>New banner</DialogTrigger>

          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Create banner</DialogTitle>
              <DialogDescription>
                Publish a new MangaKai site notice.
              </DialogDescription>
            </DialogHeader>

            <BannerForm
              initial={EMPTY_FORM}
              submitLabel="Create banner"
              onSubmit={async (input) => {
                const result = await createBannerAction(input);

                if (!result.ok) {
                  toast.error(result.error ?? "Unable to create banner.");
                  return;
                }

                toast.success("Banner created.");
                setCreating(false);
                window.location.reload();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No banners</CardTitle>
            <CardDescription>
              Create one when you need to announce something site-wide.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{banner.title}</CardTitle>

                      <Badge
                        variant="outline"
                        className={variantClass(banner.variant)}
                      >
                        {banner.variant}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={
                          banner.active
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "text-muted-foreground"
                        }
                      >
                        {banner.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {banner.body && (
                      <CardDescription className="mt-2 max-w-3xl">
                        {banner.body}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(banner)}
                    >
                      Edit
                    </Button>

                    <DeleteBannerButton
                      banner={banner}
                      onDeleted={() => removeBanner(banner.id)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  {banner.startsAt && (
                    <span>
                      Starts {new Date(banner.startsAt).toLocaleString()}
                    </span>
                  )}

                  {banner.endsAt && (
                    <span>Ends {new Date(banner.endsAt).toLocaleString()}</span>
                  )}

                  {banner.linkUrl && <span>Has link</span>}

                  {banner.imageUrl && <span>Has image</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit banner</DialogTitle>
            <DialogDescription>
              Update this site-wide MangaKai notice.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <BannerForm
              initial={formFromBanner(editing)}
              submitLabel="Save changes"
              onSubmit={async (input) => {
                const result = await updateBannerAction(editing.id, input);

                if (!result.ok) {
                  toast.error(result.error ?? "Unable to update banner.");
                  return;
                }

                toast.success("Banner updated.");
                setEditing(null);
                window.location.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: BannerFormInput;
  submitLabel: string;
  onSubmit: (input: BannerFormInput) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof BannerFormInput>(
    key: K,
    value: BannerFormInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();

        startTransition(async () => {
          await onSubmit(form);
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="banner-title">Title</Label>
        <Input
          id="banner-title"
          value={form.title}
          maxLength={120}
          required
          onChange={(event) => set("title", event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="banner-body">Body</Label>
        <Textarea
          id="banner-body"
          value={form.body}
          onChange={(event) => set("body", event.target.value)}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Variant</Label>

          <Select
            value={form.variant}
            onValueChange={(value) => set("variant", value as BannerVariant)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {BANNER_VARIANTS.map((variant) => (
                <SelectItem key={variant} value={variant}>
                  <span className="capitalize">{variant}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-end gap-3 pb-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => set("active", event.target.checked)}
            className="size-4 accent-brand"
          />
          Active
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="banner-start">Starts at</Label>
          <Input
            id="banner-start"
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => set("startsAt", event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="banner-end">Ends at</Label>
          <Input
            id="banner-end"
            type="datetime-local"
            value={form.endsAt}
            onChange={(event) => set("endsAt", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="banner-image">Image URL</Label>
        <Input
          id="banner-image"
          type="url"
          placeholder="https://..."
          value={form.imageUrl}
          onChange={(event) => set("imageUrl", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="banner-link">Link URL</Label>
          <Input
            id="banner-link"
            type="url"
            placeholder="https://..."
            value={form.linkUrl}
            onChange={(event) => set("linkUrl", event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="banner-link-label">Link label</Label>
          <Input
            id="banner-link-label"
            placeholder="Read more"
            value={form.linkLabel}
            onChange={(event) => set("linkLabel", event.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

function DeleteBannerButton({
  banner,
  onDeleted,
}: {
  banner: AdminBanner;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(`Delete "${banner.title}"?`)) return;

        startTransition(async () => {
          const result = await deleteBannerAction(banner.id);

          if (!result.ok) {
            toast.error(result.error ?? "Unable to delete banner.");
            return;
          }

          onDeleted();
          toast.success("Banner deleted.");
        });
      }}
    >
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  );
}
