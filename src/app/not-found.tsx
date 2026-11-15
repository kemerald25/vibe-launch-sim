import Link from "next/link";
import { PageIntro } from "@/components/Prose";

export default function NotFound() {
  return (
    <PageIntro title="Page not found">
      <p>
        That page does not exist.{" "}
        <Link className="link" href="/">
          Go to the simulator
        </Link>
        .
      </p>
    </PageIntro>
  );
}
