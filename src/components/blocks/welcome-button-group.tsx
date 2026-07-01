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
    <div className="flex flex-col w-full gap-4">
      <Link href={data.linkPrimary} className="w-full">
        <Button size="lg" className="w-full">
          {data.labelPrimary}
        </Button>
      </Link>
      
      <Link href={data.linkSecond} className="w-full">
        <Button size="lg" variant="outline" className="w-full">
          {data.labelSecond}
        </Button>
      </Link>
    </div>
  );
}