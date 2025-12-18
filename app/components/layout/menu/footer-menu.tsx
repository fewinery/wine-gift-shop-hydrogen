import Link from "~/components/link";
import { useShopMenu } from "~/hooks/use-shop-menu";
import type { SingleMenuItem } from "~/types/menu";

export function FooterMenu() {
  const { footerMenu } = useShopMenu();
  const items = footerMenu.items as unknown as SingleMenuItem[];
  return (
    <div className="grid w-full lg:grid-cols-2 lg:gap-6">
      {items.map(({ id, to, title, items: childItems }) => (
        <div key={id} className="font-henderson-slab flex flex-col gap-2 text-black text-sm">
          {["#", "/"].includes(to) ? (
            <span>{title}</span>
          ) : (
            <Link to={to}>{title}</Link>
          )}
          {childItems?.map((child) => (
            <Link to={child.to} key={child.id}>
              {child.title}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
