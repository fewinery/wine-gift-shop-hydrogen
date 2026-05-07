import { CaretDownIcon } from "@phosphor-icons/react";
import { Content, Item, Root, Trigger } from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { useRef, useState } from "react";
import Link from "~/components/link";
import { RevealUnderline } from "~/components/reveal-underline";
import type { SingleMenuItem } from "~/types/menu";

const CLOSE_DELAY_MS = 120;

export function DropdownMenu({ menuItem }: { menuItem: SingleMenuItem }) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { items: childItems = [], title, to } = menuItem;

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <div className="font-heading">
      <Root open={open} onOpenChange={setOpen} modal={false}>
        <Trigger asChild>
          <Link
            to={to}
            className={clsx([
              "flex h-full cursor-pointer items-center gap-1.5 px-3 py-2",
              "uppercase focus:outline-hidden transition-none font-heading!",
              "data-[state=open]:[&>svg]:rotate-180",
            ])}
            style={
              {
                fontSize: "var(--nav-font-size)",
                letterSpacing: "var(--nav-letter-spacing)",
                fontWeight: "var(--nav-font-weight)",
              } as React.CSSProperties
            }
            onMouseEnter={() => {
              cancelClose();
              setOpen(true);
            }}
            onMouseLeave={scheduleClose}
          >
            {title}
            <CaretDownIcon className="h-3.5 w-3.5 transition-transform" />
          </Link>
        </Trigger>
        <Content
          align="start"
          sideOffset={0}
          className="flex min-w-48 flex-col gap-1.5 bg-(--color-header-bg) p-6 shadow-lg animate-fade-in"
          onCloseAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {childItems.map(
            ({ id: itemId, to: itemTo, title: itemTitle, isExternal }) => (
              <Item key={itemId} asChild>
                <Link
                  to={itemTo}
                  prefetch="intent"
                  className="transition-none items-center gap-2 group outline-hidden font-heading!"
                  style={
                    {
                      fontSize: "var(--nav-font-size)",
                      letterSpacing: "var(--nav-letter-spacing)",
                      fontWeight: "var(--nav-font-weight)",
                    } as React.CSSProperties
                  }
                >
                  <RevealUnderline>{itemTitle}</RevealUnderline>
                  {isExternal && (
                    <span className="invisible group-hover:visible text-sm">
                      ↗
                    </span>
                  )}
                </Link>
              </Item>
            ),
          )}
        </Content>
      </Root>
    </div>
  );
}
