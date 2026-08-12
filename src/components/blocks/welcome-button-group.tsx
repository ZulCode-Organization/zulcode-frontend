import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ButtonGroupProps {
  data: {
    labelPrimary: string;
    linkPrimary: string;
    labelSecond: string;
    linkSecond: string;
  };
}

export default function ButtonGroup({ data }: ButtonGroupProps) {
  return (
    <div className="flex w-full animate-fade-in-up flex-col gap-4" style={{ animationDelay: "160ms" }}>
      <Link href={data.linkPrimary} className="w-full">
        <Button size="lg" className="w-full uppercase tracking-wider">
          {data.labelPrimary}
        </Button>
      </Link>

      <Link href={data.linkSecond} className="w-full">
        <Button size="lg" variant="outline" className="w-full uppercase tracking-wider">
          {data.labelSecond}
        </Button>
      </Link>
    </div>
  );
}