"use client";

import { useState } from "react";
import { Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ImageTile } from "@/components/ui/image-tile";

export type NewsPost = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  isPinned: boolean;
  publishedAt: string; // ISO — Dates don't cross the server/client boundary
};

const COLLAPSED_LENGTH = 180;

export function PostCard({ post }: { post: NewsPost }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.body.length > COLLAPSED_LENGTH;
  const text = expanded || !isLong ? post.body : `${post.body.slice(0, COLLAPSED_LENGTH).trimEnd()}…`;

  return (
    <Card className="flex flex-col gap-3 p-0" data-testid="news-post">
      {post.imageUrl && (
        <ImageTile
          src={post.imageUrl}
          alt=""
          aspect="4/3"
          fit="cover"
          className="rounded-b-none"
          sizes="(min-width: 768px) 30vw, 90vw"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4 pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("he-IL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          {post.isPinned && (
            <Badge tone="accent">
              <Pin className="size-3" aria-hidden />
              מוצמד
            </Badge>
          )}
        </div>
        <h3 className="text-heading">{post.title}</h3>
        <p className="whitespace-pre-line text-body text-muted-foreground">{text}</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="self-start text-sm text-accent hover:underline"
          >
            {expanded ? "הצג פחות" : "קרא עוד"}
          </button>
        )}
      </div>
    </Card>
  );
}
