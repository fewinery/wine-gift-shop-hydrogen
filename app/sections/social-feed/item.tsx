import { createSchema, type HydrogenComponentProps } from "@weaverse/hydrogen";
import type { ElementType } from "react";
import { useContext } from "react";
import { SocialFeedDisplayContext } from "./items";

type Platform = "instagram" | "tiktok" | "facebook" | "youtube";

interface ParsedPost {
  platform: Platform;
  embedUrl: string;
}

// Turns a normal share link into the platform's official embed player URL.
// No API keys or account connection needed: these are the public embeds
// each platform provides for any public post.
export function parsePostUrl(raw: string): ParsedPost | null {
  const url = raw?.trim();
  if (!url) {
    return null;
  }

  const instagram = url.match(
    /instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/i,
  );
  if (instagram) {
    const kind = instagram[1].toLowerCase() === "p" ? "p" : "reel";
    return {
      platform: "instagram",
      embedUrl: `https://www.instagram.com/${kind}/${instagram[2]}/embed/captioned/`,
    };
  }

  const tiktok = url.match(
    /tiktok\.com\/(?:@[\w.-]+\/(?:video|photo)|player\/v1|embed(?:\/v2)?)\/(\d+)/i,
  );
  if (tiktok) {
    return {
      platform: "tiktok",
      embedUrl: `https://www.tiktok.com/player/v1/${tiktok[1]}?description=1&music_info=1&rel=0`,
    };
  }

  const youtube = url.match(
    /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/i,
  );
  if (youtube) {
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtube[1]}`,
    };
  }

  if (/facebook\.com|fb\.watch/i.test(url)) {
    const isVideo = /\/(reel|videos|watch)\b|fb\.watch/i.test(url);
    const plugin = isVideo ? "video.php" : "post.php";
    return {
      platform: "facebook",
      embedUrl: `https://www.facebook.com/plugins/${plugin}?href=${encodeURIComponent(url)}&show_text=true`,
    };
  }

  return null;
}

const platformLabels: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
};

interface SocialFeedItemProps extends HydrogenComponentProps {
  ref?: React.Ref<HTMLDivElement>;
  postUrl: string;
  creatorName?: string;
  creatorLink?: string;
  source?: "brand" | "influencer";
}

function SocialFeedItem(props: SocialFeedItemProps) {
  const { ref, postUrl, creatorName, creatorLink, source, ...rest } = props;
  const { cardHeight, showCreator } = useContext(SocialFeedDisplayContext);
  const parsed = parsePostUrl(postUrl);
  const name = creatorName?.trim();
  const profileLink = creatorLink?.trim();

  const CreatorTag: ElementType = profileLink ? "a" : "span";
  const creatorProps = profileLink
    ? { href: profileLink, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <div ref={ref} {...rest} className="flex h-full flex-col">
      {parsed ? (
        <iframe
          src={parsed.embedUrl}
          title={`${platformLabels[parsed.platform]} post${name ? ` by ${name}` : ""}`}
          loading="lazy"
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full overflow-hidden rounded-lg border-0 bg-white"
          style={{ height: `${cardHeight}px` }}
        />
      ) : (
        <div
          className="flex w-full items-center justify-center rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500"
          style={{ height: `${cardHeight}px` }}
        >
          Paste a public Instagram, TikTok, Facebook or YouTube Shorts link into
          this post's settings.
        </div>
      )}

      {showCreator && (name || parsed) && (
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          {name ? (
            <CreatorTag {...creatorProps} className="truncate font-medium">
              {name}
            </CreatorTag>
          ) : (
            <span />
          )}
          {source === "influencer" && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs uppercase tracking-wide">
              Creator
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default SocialFeedItem;

export const schema = createSchema({
  type: "social-feed--item",
  title: "Social post",
  settings: [
    {
      group: "Post",
      inputs: [
        {
          type: "text",
          name: "postUrl",
          label: "Post or reel link",
          defaultValue: "",
          placeholder: "https://www.instagram.com/reel/ABC123/",
          helpText:
            "Paste the normal share link of a public Instagram post or reel, TikTok video, Facebook post or reel, or YouTube Short. For TikTok use the full link with /video/ in it (not a vm.tiktok.com short link).",
        },
        {
          type: "toggle-group",
          name: "source",
          label: "Posted by",
          configs: {
            options: [
              { value: "brand", label: "Our account" },
              { value: "influencer", label: "Creator" },
            ],
          },
          defaultValue: "brand",
        },
        {
          type: "text",
          name: "creatorName",
          label: "Account name",
          defaultValue: "",
          placeholder: "@handle",
        },
        {
          type: "text",
          name: "creatorLink",
          label: "Account profile link (optional)",
          defaultValue: "",
          placeholder: "https://www.instagram.com/handle/",
        },
      ],
    },
  ],
});
