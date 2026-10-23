import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "~/components/button";
import Link from "~/components/link";
import { Section } from "~/components/section";

/**
 * Shown when the page builder could not be reached, which is a passing fault
 * rather than a missing page.
 *
 * Deliberately plain: no "page not found" wording to make someone think they
 * mistyped the address, and no brand logo, because the theme settings that
 * carry the logo are exactly what failed to load - the stock placeholder is
 * what visitors have been seeing.
 */
export function TemporarilyUnavailable() {
  return (
    <Section width="fixed" verticalPadding="large">
      <div className="mx-auto max-w-lg space-y-4 py-20 text-center">
        <h4 className="font-medium">This page didn&rsquo;t finish loading</h4>
        <p>
          Nothing is wrong with your order or your account. Give it another go
          and it should come straight up.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 pt-6 md:flex-row">
          <Button
            type="button"
            variant="primary"
            onClick={() => window.location.reload()}
          >
            <ArrowClockwiseIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            Reload the page
          </Button>
          <span>Or</span>
          <Link variant="underline" to="/">
            Take me to the home page
          </Link>
        </div>
      </div>
    </Section>
  );
}
