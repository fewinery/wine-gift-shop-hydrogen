import {
  createSchema,
  type HydrogenComponentProps,
  isBrowser,
} from "@weaverse/hydrogen";
import clsx from "clsx";
import type { CSSProperties } from "react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { useAnimation } from "~/hooks/use-animation";
import { Link } from "~/components/link";



interface HeroVideoData {
  videoURL: string;
  heading: string;
  paragraph: string;
  buttonText: string;
  buttonLink: string;
  buttonTextColor: string;
  buttonBgColor: string;
}

export interface HeroVideoProps extends HeroVideoData, HydrogenComponentProps {
  ref: React.Ref<HTMLElement>;
}


function getPlayerSize(id: string) {
  if (isBrowser) {
    const section = document.querySelector(`[data-wv-id="${id}"]`);
    if (section) {
      const rect = section.getBoundingClientRect();
      const aspectRatio = rect.width / rect.height;
      if (aspectRatio < 16 / 9) {
        return { width: "auto", height: "100%" };
      }
    }
  }
  return { width: "100%", height: "auto" };
}

const ReactPlayer = lazy(() => import("react-player/lazy"));

export default function HeroVideo(props: HeroVideoProps) {
  const {
    ref,
    videoURL,
    heading,
    paragraph,
    buttonText,
    buttonLink,
    buttonTextColor,
    buttonBgColor,
    ...rest
  } = props;

  const id = rest["data-wv-id"];
  const [size, setSize] = useState(() => getPlayerSize(id));

  const desktopHeight = "70vh";
  const mobileHeight = "80vh";
  const sectionStyle: CSSProperties = {
    "--desktop-height": desktopHeight,
    "--mobile-height": mobileHeight,
  } as CSSProperties;

  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
  });

  // Use `useCallback` so we don't recreate the function on each render
  const setRefs = useCallback(
    (node: HTMLElement) => {
      // Callback refs, like the one from `useInView`, is a function that takes the node as an argument
      inViewRef(node);
      // Handle ref prop
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && "current" in ref) {
        ref.current = node;
      }
    },
    [inViewRef, ref],
  );

  function handleResize() {
    setSize(getPlayerSize(id));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation> --- IGNORE ---
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [inView]);

  const [scope] = useAnimation();

  return (
    <section
      ref={setRefs}
      {...rest}
      className="h-full w-full overflow-hidden"
      style={sectionStyle}
    >
      <div
        className={clsx(
          "relative flex items-center justify-center overflow-hidden",
          "h-(--mobile-height) sm:h-(--desktop-height)",
          "w-[max(var(--mobile-height)/9*16,100vw)] sm:w-[max(var(--desktop-height)/9*16,100vw)]",
          "translate-x-[min(0px,calc((var(--mobile-height)/9*16-100vw)/-2))]",
          "sm:translate-x-[min(0px,calc((var(--desktop-height)/9*16-100vw)/-2))]",
        )}
      >
        {inView && (
          <Suspense fallback={null}>
            <ReactPlayer
              url={videoURL}
              playing
              muted
              loop={true}
              width={size.width}
              height={size.height}
              controls={false}
              className="aspect-video"
            />
          </Suspense>
        )}

        <div ref={scope} className="absolute inset-0 z-10 mx-auto flex max-w-screen flex-col items-center justify-center px-3 text-center">
          <div className="flex flex-col items-center w-full">
            {heading && (
              <div className="text-[48px] max-w-[668px] font-bold text-white mb-5" dangerouslySetInnerHTML={{ __html: heading }} />
            )}
            {paragraph && (
              <div
                className="text-lg leading-[1.6] max-w-[668px] tracking-normal text-white"
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            )}
            {buttonText && (
              <Link to={buttonLink}>
                <button
                  type="button"
                  className="rounded py-[15px] px-[100px] mt-5"
                  style={{
                    color: buttonTextColor,
                    backgroundColor: buttonBgColor,
                  }}
                >
                  {buttonText}
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const schema = createSchema({
  type: "hero-video",
  title: "Hero video",
  settings: [
    {
      group: "Video",
      inputs: [
        {
          type: "text",
          name: "videoURL",
          label: "Video URL",
          defaultValue: "https://www.youtube.com/watch?v=Su-x4Mo5xmU",
          placeholder: "https://www.youtube.com/watch?v=Su-x4Mo5xmU",
          helpText: "Support YouTube, Vimeo, MP4, WebM, and HLS streams.",
        },
      ],
    },
    {
      group: "Content",
      inputs: [
        {
          type: "heading",
          label: "Heading",
        },
        {
          type: "richtext",
          name: "heading",
          label: "Heading text",
          defaultValue: "Section heading",
          placeholder: "Section heading",
        },
        {
          type: "heading",
          label: "Paragraph",
        },
        {
          type: "richtext",
          name: "paragraph",
          label: "Paragraph text",
          defaultValue:
            "Pair large video with a compelling message to captivate your audience.",
          placeholder: "Pair large video with a compelling message to captivate your audience.",
        },
        {
          type: "heading",
          label: "Button",
        },
        {
          type: "text",
          name: "buttonText",
          label: "Button text",
          defaultValue: "Text",
          placeholder: "Text",
        },
        {
          type: "url",
          name: "buttonLink",
          label: "Button link",
          defaultValue: "/",
          placeholder: "/",
        },
        {
          type: "color",
          name: "buttonTextColor",
          label: "Button text color",
          defaultValue: "#000000",
        },
        {
          type: "color",
          name: "buttonBgColor",
          label: "Button background color",
          defaultValue: "#ffffff",
        },
      ],
    },

  ],
  presets: {
    videoURL: "https://www.youtube.com/watch?v=gbLmku5QACM",
    heading: "Section heading",
    paragraph:
      "Pair large video with a compelling message to captivate your audience.",
    buttonText: "Text",
    buttonLink: "/",
  },
});
