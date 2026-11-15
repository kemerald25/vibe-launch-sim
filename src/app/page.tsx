import type { Metadata } from "next";
import { Simulator } from "@/components/Simulator";
import { VERIFIED_ON } from "@/config/protocol";
import { SITE } from "@/config/site";
import { isValid, validateConfig } from "@/lib/schema";
import { displayName } from "@/lib/summary";
import { decodeConfig, encodeConfig, hasConfigParams } from "@/lib/urlState";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  if (!hasConfigParams(params)) return {};
  const config = decodeConfig(params);
  if (!isValid(validateConfig(config))) return {};
  const title = `${displayName(config)}: launch simulation (unofficial)`;
  const image = `/og?${encodeConfig(config)}`;
  return {
    title,
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description: `${SITE.description} ${SITE.unofficialLabel}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE.name} summary card. ${SITE.unofficialLabel}`,
        },
      ],
    },
    twitter: { card: "summary_large_image", images: [image] },
    robots: { index: false, follow: true },
  };
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialConfig = decodeConfig(params);

  return (
    <>
      <section className="py-8 sm:py-10">
        <h1 className="max-w-3xl text-2xl leading-tight sm:text-[2rem]">
          See what your launch settings mean before you sign.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-body">
          Enter the settings you plan to use on vibe/vibe. {SITE.name} shows, in plain language,
          where the tax goes, what early buyers pay, and what gets locked forever.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[13px] text-muted">
          <li>
            <span className="text-accent" aria-hidden="true">
              ✓{" "}
            </span>
            {SITE.noWalletLabel}
          </li>
          <li>
            Rules last checked <time dateTime={VERIFIED_ON}>{VERIFIED_ON}</time>
          </li>
        </ul>
      </section>
      <Simulator initialConfig={initialConfig} syncUrlOnLoad={hasConfigParams(params)} />
    </>
  );
}
